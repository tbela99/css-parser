import type { AstAtRule, AstDeclaration, AstNode, AstRule, ParserOptions, Token } from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import { compute, type ComputedTransform, TransformKind, transformKind } from "../transform/compute.ts";
import { filterValues, renderValue } from "../../printer/render.ts";
import { eqMatrix, minifyTransformFunctions } from "../transform/minify.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";
import { StructuralMemo } from "../cache.ts";

/**
 * outcome of the minification of a transform value that is not a list of new tokens, see {@link TransformMemo}
 */
const enum Outcome {
    /**
     * the matrix cannot be computed: the transform functions are minified one by one
     */
    Failed = 0,
    /**
     * the transform functions minified one by one are the shortest form
     */
    Functions = 1,
    /**
     * the shortest form reuses tokens of the value: it is computed for every declaration
     */
    Uncached = 2,
}

/**
 * Results of the minification of the transform values, shared by the rules of a minification and valid for the arena
 * they were computed for. Identical values are common (`transform: translate3d(0, 0, 0)`, the keyframes of the
 * animation libraries, ...): the matrix of a value is computed once per distinct value. A value whose shortest form
 * only contains new tokens (`none`, `matrix()`, the minified functions) is stored as detached tokens that are cloned.
 *
 * @internal
 */
class TransformMemo {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: TransformMemo = new TransformMemo();

    /**
     * the outcome or the detached tokens of the shortest form, by value structure
     */
    readonly values: StructuralMemo<Outcome | Token[]> = new StructuralMemo();
}

export class TransformCssFeature {
    public accept: Set<EnumToken> = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);

    get ordering(): number {
        return 4;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Post;
    }

    static register(options: ParserOptions): void {
        // @ts-ignore
        if (options.computeTransform) {
            // @ts-ignore
            options.features.push(new TransformCssFeature());
        }
    }

    /**
     *
     * @param arena
     * @param ast
     * @param _options
     * @param _parent
     * @param context minification context: the results are shared by the rules of the minification
     */
    run(
        arena: AstArena,
        ast: AstRule | AstAtRule,
        _options?: unknown,
        _parent?: AstNode,
        context?: {
            [key: string]: any;
        },
    ): AstNode | null {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren)) {
            return null;
        }

        let memo: StructuralMemo<Outcome | Token[]> | null = null;
        let node: AstNode | AstDeclaration;

        for (node = arena.firstChild[ast]; node !== 0; node = arena.nextSibling[node]) {
            if (arena.flags[node] & (EnumAstNodeStatus.Invalid | EnumAstNodeStatus.ValidationFailed)) {
                continue;
            }

            if (
                arena.dataTypes[node] !== EnumToken.DeclarationNodeType ||
                (transformKind(arena, arena.name[node]) & TransformKind.KindMask) !== TransformKind.Property
            ) {
                continue;
            }

            let slot: number = -1;
            let outcome: Outcome | Token[] | undefined;

            if (context != null) {
                // created with the first transform declaration of the minification
                if (memo === null) {
                    memo = (context.transforms ??= new TransformMemo()).values as StructuralMemo<Outcome | Token[]>;
                }

                slot = memo.list(arena, arena.firstToken[node]);
                // inlined: memo.get(slot)
                outcome = memo.values[slot];

                if (Array.isArray(outcome)) {
                    const tokens: Token[] = new Array(outcome.length);

                    for (let i = 0; i < outcome.length; i++) {
                        tokens[i] = arena.clone(outcome[i], true);
                    }

                    arena.setTokenList(node, tokens);
                    continue;
                }
            }

            const children: Token[] = [];

            for (let child: Token = arena.firstToken[node]; child !== 0; child = arena.nextSibling[child]) {
                children.push(
                    arena.dataTypes[child] === EnumToken.TransformFunctionTokenType
                        ? minifyTransformFunctions(arena, child)
                        : child,
                );
            }

            if (outcome === Outcome.Failed) {
                arena.setTokenList(node, children);
                continue;
            }

            if (outcome === Outcome.Functions) {
                arena.setTokenList(node, filterValues(arena, children));
                continue;
            }

            const computed: ComputedTransform | null = compute(arena, children);

            if (computed == null) {
                if (slot !== -1) {
                    memo!.values[slot] = Outcome.Failed;
                }

                arena.setTokenList(node, children);
                continue;
            }

            // the shortest form: the functions minified one by one, the cumulative list, the minified matrix. a
            // candidate replaces the matrix if its rendered value is shorter
            const length: number = renderValue(arena, computed.matrix).length;
            let result: Token[] | null = null;

            if (renderedLength(arena, filterValues(arena, children)) < length) {
                result = children;
            }

            if (
                eqMatrix(arena, computed.values, computed.cumulative) &&
                renderedLength(arena, computed.cumulative) < length
            ) {
                result = computed.cumulative;
            }

            if (
                eqMatrix(arena, computed.values, computed.minified) &&
                renderedLength(arena, computed.minified) < length
            ) {
                result = computed.minified;
            }

            if (slot !== -1) {
                if (result === children) {
                    memo!.values[slot] = Outcome.Functions;
                } else if (result === computed.cumulative && !computed.created) {
                    memo!.values[slot] = Outcome.Uncached;
                } else {
                    // detached copies: the tokens of the declaration may be modified by the next features
                    const template: Token[] =
                        result === null ? [arena.clone(computed.matrix, true)] : new Array(result.length);

                    for (let i = 0; result !== null && i < result.length; i++) {
                        template[i] = arena.clone(result[i], true);
                    }

                    memo!.values[slot] = template;
                }
            }

            if (result === null) {
                arena.setTokenList(node, [computed.matrix]);
            } else {
                arena.setTokenList(node, result);
            }
        }

        return null;
    }
}

/**
 * length of the rendered tokens
 * @param arena
 * @param tokens
 */
function renderedLength(arena: AstArena, tokens: Token[]): number {
    let length: number = 0;

    for (let i = 0; i < tokens.length; i++) {
        length += renderValue(arena, tokens[i]).length;
    }

    return length;
}
