import type { Token, AstAtRule, AstComment, AstDeclaration, AstNode, AstRule, AstRuleList, AstStyleSheet, ErrorDescription, RenderOptions, RenderResult, SourceLocation } from "../../@types/index.d.ts";
import { convertColor, getAngle } from "../syntax/color/color.ts";
import { reduceHexValue } from "../syntax/color/hex.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "../ast/types.ts";
import { expand } from "../ast/expand.ts";
import { SourceMap } from "./sourcemap/sourcemap.ts";
import { anglePrecision, pseudoElements, tokensfuncSet, urlTokenMatcher } from "../syntax/constants.ts";
import {
    isWhiteSpace,
    minifyNumber,
    parseColor,
    reduceColorStops,
    reduceConicColorStops,
    reducegradientBackgroundPosition,
    toPrecisionAngle,
    toPrecisionValue,
} from "../syntax/syntax.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";
import { toDegrees } from "../parser/utils/angle.ts";
import { LineMap as LinesMap } from "../parser/linesmap.ts";
import { dirname } from "../fs/resolve.ts";
import { SourceFile } from "../parser/source.ts";
import { AstArena, TokenField } from "../ast/arena.ts";

/**
 * render ast
 * @param arena
 * @param data node id
 * @param options
 * @param mapping
 * @private
 */
export function doRender(
    arena: AstArena,
    data: AstNode,
    options: RenderOptions = {},
    mapping?: {
        mapping: Record<string, string>;
        importMapping: Record<string, Record<string, string>> | null;
    } | null,
): RenderResult {
    const minify: boolean = options.minify ?? true;
    const beautify: boolean = options.beautify ?? !minify;

    options = {
        ...(beautify
            ? {
                  indent: " ",
                  newLine: "\n",
              }
            : {
                  indent: "",
                  newLine: "",
              }),
        ...(minify
            ? {
                  removeEmpty: true,
                  removeComments: true,

                  minify: true,
              }
            : {
                  removeEmpty: false,
                  removeComments: false,
              }),
        minifyValues: true,
        sourcemap: false,
        convertColor: true,
        expandNestingRules: false,
        preserveLicense: false,
        ...options,
    };

    const expandNesting: boolean =
        (options.expandNestingRules as boolean) &&
        [EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(
            arena.dataTypes[data],
        ) &&
        (arena.flags[data] & EnumAstNodeStatus.HasChildren) != 0;

    if (options.withParents || expandNesting) {
        // render a copy allocated in a temporary arena: the original tree is not modified
        const source: AstArena = arena;
        let parent: AstNode = source.parents[data];

        arena = new AstArena(Math.min(source.current, 1024));
        data = arena.import(source, data);

        if (options.withParents) {
            // wrap the node into shallow copies of its ancestors
            while (parent != 0) {
                const clone: AstNode = arena.import(source, parent, false);

                arena.appendChildren(clone, data);

                data = clone;
                parent = source.parents[parent];
            }
        }

        if (expandNesting) {
            data = expand(arena, data);
        }
    }

    const startTime: number = performance.now();
    const errors: ErrorDescription[] = [];
    const sourcemap: SourceMap | null = options.sourcemap ? new SourceMap() : null;
    const sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> } | null =
        options.sourcemap ? { sources: [], maps: [] } : null;
    const cache: {
        [key: string]: any;
    } = Object.create(null);

    const sourceLocation = {
        srcId: 0,
        sta: 0,
        end: 0,
    } as SourceLocation;
    const linesMap: LinesMap | null = options.sourcemap ? new LinesMap() : null;

    let code: string = "";

    if (mapping != null) {
        if (mapping.importMapping != null) {
            const absolutePath = options.resolve!(
                options.output != null ? dirname(options.output as string) : dirname(options.src as string),
                options.cwd as string,
            ).absolute;

            for (let [key, value] of Object.entries(mapping.importMapping)) {
                key = options.resolve!(options.resolve!(key, options.cwd as string).absolute, absolutePath).relative;

                if (!key.startsWith("/") && !key.startsWith(".")) {
                    key = "./" + key;
                }

                code += `:import("${key}")${options.indent}{${options.newLine}${Object.entries(value).reduce(
                    (acc, [k, v]) =>
                        acc + (acc.length > 0 ? options.newLine : "") + `${options.indent}${v}:${options.indent}${k};`,
                    "",
                )}${options.newLine}}${options.newLine}`;
            }
        }

        code += `:export${options.indent}{${options.newLine}${Object.entries(mapping.mapping).reduce(
            (acc, [k, v]) =>
                acc + (acc.length > 0 ? options.newLine : "") + `${options.indent}${k}:${options.indent}${v};`,
            "",
        )}${options.newLine}}${options.newLine}`;

        if (sourcemap != null) {
            move(sourceLocation, linesMap!, code);
        }
    }

    if (options.output != null) {
        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
    }

    // the tokens allocated while rendering (color conversion, gradients, ...) are released
    const mark: number = arena.mark();

    const result: RenderResult = {
        code:
            code +
            renderAstNode(
                arena,
                data,
                options,
                sourcemaps,
                sourceLocation,
                linesMap,
                errors,
                function reducer(acc: string, curr: Token): string {
                    if (arena.dataTypes[curr] == EnumToken.CommentTokenType && options.removeComments) {
                        if (!options.preserveLicense || !arena.strings[arena.stringValue[curr]].startsWith("/*!")) {
                            return acc;
                        }

                        return acc + arena.strings[arena.stringValue[curr]];
                    }

                    return acc + renderValue(arena, curr, options, cache, reducer, errors);
                },
                cache,
            ),
        errors,
        stats: {
            total: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
    };

    arena.rewind(mark);

    if (sourcemap != null) {
        let source: SourceFile;
        for (const sourceId of sourcemaps!.sources) {
            source = options!.sourcesMap!.get(sourceId)! as SourceFile;
            sourcemap.addSourceContent(source.id, source.getFileName(), source.getContent());
        }

        sourcemap.add(sourcemaps!.maps!);
        result.map = sourcemap;

        if (options.sourcemap === "inline") {
            result.code += `\n/*# sourceMappingURL=${result.map.toUrl()} */`;
        }
    }

    return result;
}

/**
 * Update source map
 * @param arena
 * @param node
 * @param options
 * @param cache
 * @param sourcemaps
 * @param sourceLocation
 * @param linesMap
 * @param str
 *
 * @internal
 */
function updateSourceMap(
    arena: AstArena,
    node: AstNode,
    options: RenderOptions,
    cache: {
        [p: string]: any;
    },
    sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> },
    sourceLocation: SourceLocation,
    linesMap: LinesMap,
    str: string,
) {
    let offset: number = 0;

    // eat leanding whitespace
    while (offset < str.length && isWhiteSpace(str.charCodeAt(offset))) {
        offset++;
    }

    if (offset > 0) {
        move(sourceLocation, linesMap, str, 0, offset + 1);
    }

    if (arena.flags[node] & EnumAstNodeStatus.HasLocation) {
        const source = options.sourcesMap!.get(arena.getSource(node)) as SourceFile;
        const inputSourceMap = source.getInputSourceMap();
        const offsets: [number, number] = source.getOffsets(arena.getSpanStart(node)) as [number, number];
        const [newLine, newColumn] = linesMap.getOffsets(sourceLocation.end);
        let records: Array<[string | null, number, number, string | null]> | null = null;
        let srcId: number = arena.getSource(node);
        let sourceFileName: string | null = (source.getFileName() as string) || null;
        let sourceContent: string | null; // = (source.getContent() as string) || null;

        if (inputSourceMap != null && (records = inputSourceMap.find(offsets[0], offsets[1])) != null) {
            let newId: number | null = null;

            for (const record of records) {
                newId = null;

                // @ts-ignore
                sourceFileName = (record[0] as string) || null;
                // @ts-ignore
                offsets[0] = record[1] as number;
                // @ts-ignore
                offsets[1] = record[2] as number;

                sourceContent = (record[3] as string) || null;

                if (sourceFileName != null && options.output != null && !sourceFileName.startsWith("data:")) {
                    if (cache[sourceFileName] == null) {
                        const absolute = options.resolve!(dirname(options.output as string), options.cwd as string)
                            .absolute as string;
                        const absoluteSourcePath = options.resolve!(
                            dirname(options.src! || ("" as string)),
                            options.cwd as string,
                        ).absolute;
                        // resolution is relative to the source file
                        const absoluteSourceFileName = options.resolve!(sourceFileName, absoluteSourcePath as string)
                            .absolute as string;

                        cache[sourceFileName] = options.resolve!(absoluteSourceFileName, absolute).relative as string;
                    }

                    sourceFileName = cache[sourceFileName] as string;
                }

                for (const [id, file] of options.sourcesMap!.entries()) {
                    if (file.getFileName() === sourceFileName) {
                        newId = id;
                        break;
                    }

                    if (sourceFileName == null && file.getContent() === sourceContent) {
                        newId = id;
                        break;
                    }
                }

                if (newId == null) {
                    const source = new SourceFile(sourceContent as string, [], sourceFileName);

                    options.sourcesMap!.set(source.id, source);
                    newId = source.id;
                }

                srcId = newId as number;

                if (!sourcemaps.sources.includes(srcId)) {
                    sourcemaps.sources.push(srcId);
                }

                sourcemaps.maps.push([newLine, newColumn, srcId, offsets[0], offsets[1]]);
            }
        } else {
            // if (sourceFileName != null && options.output != null && !sourceFileName.startsWith("data:")) {
            //     if (cache[sourceFileName] == null) {
            //         const absolute = options.resolve!(dirname(options.output as string), options.cwd as string)
            //             .absolute as string;
            //         const absoluteSourceFileName = options.resolve!(sourceFileName, options.cwd as string)
            //             .absolute as string;

            //         cache[sourceFileName] = options.resolve!(absoluteSourceFileName, absolute).relative as string;
            //     }

            //     sourceFileName = cache[sourceFileName] as string;
            // }

            if (!sourcemaps.sources.includes(srcId)) {
                sourcemaps.sources.push(srcId);
            }

            sourcemaps.maps.push([newLine, newColumn, srcId, offsets[0], offsets[1]]);
        }
    }

    move(sourceLocation, linesMap, str, offset);
}

/**
 * Update position
 * @param sourceLocation
 * @param linesMap
 * @param str
 * @param start
 * @param end
 */
export function move(sourceLocation: SourceLocation, linesMap: LinesMap, str: string, start?: number, end?: number) {
    let i: number = start ?? 0;
    let j: number = end ?? str.length;
    let codepoint: number;
    let char: string;

    for (; i < j; i++) {
        char = str.charAt(i);
        codepoint = char.charCodeAt(0);
        sourceLocation.end += char.length;

        if (
            codepoint == 0xa || // \n
            codepoint == 0xb || // \v
            codepoint == 0xc || // \f
            codepoint == 0xd || // \r
            codepoint == 0x2028 || // \u2028
            codepoint == 0x2029 // \u2029
        ) {
            if (codepoint == 0xd && i + 1 < str.length && str.charCodeAt(i + 1) == 0xa) {
                // defer CRLF to the LF step so the next line starts after both characters
            } else if (codepoint == 0xa && i > 0 && str.charCodeAt(i - 1) == 0xd) {
                // nope
            } else {
                linesMap.addLineStart(sourceLocation.end);
            }
        }
    }
}

/**
 * render ast node
 * @param arena
 * @param data node id
 * @param options
 * @param sourcemaps
 * @param sourceLocation
 * @param linesMap
 * @param errors
 * @param reducer
 * @param cache
 * @param level
 * @param indents
 *
 * @internal
 */
function renderAstNode(
    arena: AstArena,
    data: AstNode,
    options: RenderOptions,
    sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> } | null,
    sourceLocation: SourceLocation,
    linesMap: LinesMap | null,
    errors: ErrorDescription[],
    reducer: (acc: string, curr: Token) => string,
    cache: {
        [key: string]: any;
    },
    level: number = 0,
    indents: string[] = [],
): string {
    if (indents.length < level + 1) {
        indents.push((<string>options.indent).repeat(level));
    }

    if (indents.length < level + 2) {
        indents.push((<string>options.indent).repeat(level + 1));
    }

    // @ts-ignore
    let children: string = "";
    let str: string = "";

    const indent: string = indents[level];
    const indentSub: string = indents[level + 1];

    const typ: EnumToken = arena.dataTypes[data];

    switch (typ) {
        case EnumToken.DeclarationNodeType: {
            const values: Token[] = options.minifyValues ? filterValues(arena, arena.tokens(data)) : arena.tokens(data);
            let rendered: string = "";

            for (const value of values) {
                rendered = reducer(rendered, value);
            }

            return `${arena.strings[arena.name[data]]}:${options.indent}${rendered}`;
        }

        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType: {
            const val: string = arena.strings[arena.stringValue[data]];

            if (val.startsWith("/*# sourceMappingURL=")) {
                // ignore sourcemap comment
                return "";
            }

            return !options.removeComments || (options.preserveLicense && val.startsWith("/*!")) ? val : "";
        }

        case EnumToken.StyleSheetNodeType:
            for (let node = arena.firstChild[data]; node != 0; node = arena.nextSibling[node]) {
                str = renderAstNode(
                    arena,
                    node,
                    options,
                    sourcemaps,
                    sourceLocation,
                    linesMap,
                    errors,
                    reducer,
                    cache,
                    level,
                    indents,
                );

                if (str === "") {
                    continue;
                }

                if (children.length > 0) {
                    str = options.newLine + str;
                }

                children += str;

                if (sourcemaps != null && str !== "" && options.newLine) {
                    move(sourceLocation, linesMap!, options.newLine as string);
                }
            }

            return children;

        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyframesRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType: {
            const isAtRule: boolean = typ == EnumToken.AtRuleNodeType || typ == EnumToken.KeyframesAtRuleNodeType;
            const nam: string = arena.strings[arena.name[data]];
            const val: string = arena.strings[arena.stringValue[data]];

            if (isAtRule && !(arena.flags[data] & EnumAstNodeStatus.HasChildren)) {
                return `${(indent.length > 0 ? options.newLine : "") + indent}@${nam}${val === "" ? "" : options.indent || " "}${val};`;
            }

            const lineMapLength = linesMap ? linesMap.getLineStarts().length : 0;
            const prelude =
                (indent.length > 0 ? options.newLine : "") +
                indent +
                (isAtRule
                    ? `@${nam}${val === "" ? "" : options.indent || " "}${val}${options.indent}{`
                    : nam + `${options.indent}{`);

            if (sourcemaps != null) {
                updateSourceMap(arena, data, options, cache, sourcemaps, sourceLocation, linesMap!, prelude);
            }

            let node: AstNode;
            let nodeType: EnumToken;
            let recordDeclarationSourceMap: boolean = typ == EnumToken.AtRuleNodeType;

            for (node = arena.firstChild[data]; node != 0; node = arena.nextSibling[node]) {
                nodeType = arena.dataTypes[node];

                if (nodeType == EnumToken.CommentNodeType) {
                    const comment: string = arena.strings[arena.stringValue[node]];

                    str =
                        options.removeComments && (!options.preserveLicense || !comment.startsWith("/*!"))
                            ? ""
                            : comment;
                } else if (nodeType == EnumToken.DeclarationNodeType) {
                    const values: Token[] = options.minifyValues ? filterValues(arena, arena.tokens(node)) : arena.tokens(node);
                    let rendered: string = "";

                    for (const value of values) {
                        rendered = reducer(rendered, value);
                    }

                    str = `${arena.strings[arena.name[node]]}:${options.indent}${rendered.trimEnd()};`;
                } else {
                    str = renderAstNode(
                        arena,
                        node,
                        options,
                        sourcemaps,
                        sourceLocation,
                        linesMap,
                        errors,
                        reducer,
                        cache,
                        level + 1,
                        indents,
                    );

                    if (str === "") {
                        continue;
                    }

                    children += str;
                    str = "";
                    continue;
                }

                if (str === "") {
                    continue;
                }

                str = options.newLine + indentSub + str;
                children += str;

                if (sourcemaps != null && str !== "") {
                    if (nodeType == EnumToken.DeclarationNodeType && recordDeclarationSourceMap) {
                        // if declaration is child of at-rule, then record it
                        // .rule {
                        //     @media screen {
                        //         color: red;
                        //     }
                        // }
                        updateSourceMap(arena, node, options, cache, sourcemaps, sourceLocation, linesMap!, str);
                    } else {
                        move(sourceLocation, linesMap!, str);
                    }
                }
            }

            if (children.endsWith(";")) {
                children = children.slice(0, -1);
                sourceLocation.end--;
            }

            if (options.removeEmpty && children === "") {
                if (sourcemaps != null) {
                    sourceLocation.end -= prelude.length;
                    linesMap!.getLineStarts().length = lineMapLength;
                }
                return "";
            }

            const end: string = options.newLine + indent + `}`;

            if (sourcemaps != null) {
                move(sourceLocation, linesMap!, end);
            }

            return prelude + children + end;
        }

        default:
            return "";
    }
}

function renderTokenList(tokens: Token[], reducer: (acc: string, curr: Token) => string): string {
    let result: string = "";

    for (const token of tokens) {
        result = reducer(result, token);
    }

    return result;
}

/**
 * render ast token
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 * @private
 */
export function renderValue(
    arena: AstArena,
    token: Token,
    options: RenderOptions = {},
    cache: {
        [key: string]: any;
    } = Object.create(null),
    reducer?: null | ((acc: string, curr: Token) => string),
    errors?: ErrorDescription[],
): string {
    if (
        arena.dataTypes[token] === EnumToken.WhenElseFunctionTokenType &&
        equalsIgnoreCase(arena.strings[arena.stringValue[token]], "supports")
    ) {
        options = { ...options, minifyValues: false, minify: false, convertColor: false };
        reducer = null;
    }

    options.minifyValues ??= options.minify;

    if (reducer == null) {
        reducer = function (acc: string, curr: Token): string {
            if (arena.dataTypes[curr] == EnumToken.CommentTokenType && options.removeComments) {
                if (!options.preserveLicense || !arena.strings[arena.stringValue[curr]].startsWith("/*!")) {
                    return acc;
                }

                return acc + arena.strings[arena.stringValue[curr]];
            }

            return acc + renderValue(arena, curr, options, cache, reducer, errors);
        };
    }

    switch (arena.dataTypes[token]) {
        case EnumToken.UrlFunctionTokenDefType:
        case EnumToken.FunctionTokenDefType:
        case EnumToken.MathFunctionTokenDefType:
        case EnumToken.ImageFunctionTokenDefType:
        case EnumToken.ColorFunctionTokenDefType:
        case EnumToken.TimingFunctionTokenDefType:
        case EnumToken.WhenElseFunctionTokenDefType:
        case EnumToken.SupportsFunctionTokenDefType:
        case EnumToken.TimelineFunctionTokenDefType:
        case EnumToken.GridTemplateFuncTokenDefType:
        case EnumToken.TransformFunctionTokenDefType:
        case EnumToken.ContainerFunctionTokenDefType:
        case EnumToken.PseudoClassFunctionTokenDefType:
        case EnumToken.GeneralEnclosedFunctionTokenDefType:
        case EnumToken.CustomFunctionTokenDefType:
        case EnumToken.WildCardFunctionTokenDefType:
            return arena.strings[arena.stringValue[token]] + "(";

        case EnumToken.ListToken: {
            let result: string = "";

            for (const curr of arena.tokens(token)) {
                result += renderValue(arena, curr, options, cache);
            }

            return result;
        }

        case EnumToken.BinaryExpressionTokenType: {
            const op: EnumToken = arena.numericValue[token];
            const l: Token = arena.getLeft(token)![0];
            const r: Token = arena.getRight(token)![0];

            if (EnumToken.Mul === op || EnumToken.Div === op) {
                let result: string = "";

                if (
                    arena.dataTypes[l] == EnumToken.BinaryExpressionTokenType &&
                    (arena.numericValue[l] == EnumToken.Add || arena.numericValue[l] == EnumToken.Sub)
                ) {
                    result = "(" + renderValue(arena, l, options, cache) + ")";
                } else {
                    result = renderValue(arena, l, options, cache);
                }

                result += op == EnumToken.Mul ? "*" : "/";

                if (
                    arena.dataTypes[r] == EnumToken.BinaryExpressionTokenType &&
                    (arena.numericValue[r] == EnumToken.Add || arena.numericValue[r] == EnumToken.Sub)
                ) {
                    result += "(" + renderValue(arena, r, options, cache) + ")";
                } else {
                    result += renderValue(arena, r, options, cache);
                }

                return result;
            }

            return (
                renderValue(arena, l, options, cache) +
                (op == EnumToken.Add ? " + " : " - ") +
                renderValue(arena, r, options, cache)
            );
        }

        case EnumToken.FractionTokenType: {
            const numerator: Token = arena.numerator(token);
            const denominator: Token = arena.denominator(token);
            const fraction: string = renderValue(arena, numerator) + "/" + renderValue(arena, denominator);

            if (arena.numericValue[denominator] != 0) {
                const value: string = minifyNumber(arena.numericValue[numerator] / arena.numericValue[denominator]);

                if (value.length <= fraction.length) {
                    return value;
                }
            }

            return fraction;
        }

        case EnumToken.Add:
            return " + ";

        case EnumToken.Sub:
            return " - ";

        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Star:
        case EnumToken.Mul:
            return "*";

        case EnumToken.Div:
            return "/";

        case EnumToken.WrappedValuesTokenType: {
            let result: string = "";

            for (const curr of arena.tokens(token)) {
                result += renderValue(arena, curr, options, cache);
            }

            return "{" + result + "}";
        }

        case EnumToken.ColorTokenType:
            if (
                arena.colorType[token] == ColorType.LIGHT_DARK ||
                (arena.firstToken[token] != 0 && options.convertColor === false && arena.tokenCount(token) == 2)
            ) {
                let result: string = "";

                for (const curr of arena.tokens(token)) {
                    if (arena.dataTypes[curr] === EnumToken.IdenTokenType) {
                        parseColor(arena, curr);
                    }

                    result += renderValue(arena, curr, options, cache);
                }

                return (
                    arena.strings[arena.stringValue[token]] +
                    "(" +
                    result +
                    ")"
                );
            }

            if (options.convertColor !== false) {
                const value: Token | null = convertColor(
                    arena,
                    token,
                    typeof options.convertColor === "boolean"
                        ? ColorType.HEX
                        : (ColorType[
                              (ColorType[options.convertColor ?? "HEX"] as string)
                                  ?.toUpperCase?.()
                                  .replaceAll?.("-", "_") as keyof typeof ColorType
                          ] ?? ColorType.HEX),
                );

                if (value != null) {
                    token = value;
                }

                if (arena.colorType[token] == ColorType.HEX || arena.colorType[token] == ColorType.LIT) {
                    return reduceHexValue(arena.strings[arena.stringValue[token]]);
                }
            }

            if (
                arena.colorType[token] === ColorType.SYS ||
                arena.colorType[token] === ColorType.DPSYS ||
                arena.colorType[token] === ColorType.NON_STD
            ) {
                return arena.strings[arena.stringValue[token]];
            }

            if (arena.colorType[token] == ColorType.HEX || arena.colorType[token] == ColorType.LIT) {
                return arena.strings[arena.stringValue[token]];
            }

            if (arena.firstToken[token] != 0) {
                const fnName: string = arena.strings[arena.stringValue[token]];
                const chi: Token[] = arena.tokens(token);
                const isLegacy: boolean = ["rgb", "rgba", "hsl", "hsla"].includes(fnName);
                const hasAlpha: boolean = [
                    "rgb",
                    "rgba",
                    "hsl",
                    "hsla",
                    "hwb",
                    "oklab",
                    "oklch",
                    "lab",
                    "lch",
                ].includes(fnName);
                const useAlpha: boolean =
                    (hasAlpha && chi.length == (isLegacy ? 7 : 4)) || ("color" == fnName && chi.length == 5);
                let result: string = "";

                for (let index = 0; index < chi.length; index++) {
                    const curr: Token = chi[index];

                    if (/[,/]\s*$/.test(result)) {
                        if (arena.dataTypes[curr] == EnumToken.WhitespaceTokenType) {
                            result = result.trimEnd();
                            continue;
                        }

                        result = result.trimStart() + renderValue(arena, curr, options, cache);
                        continue;
                    }

                    if (isLegacy && arena.dataTypes[curr] == EnumToken.CommaTokenType) {
                        result = result.trimEnd() + " ";
                    } else if (arena.dataTypes[curr] == EnumToken.WhitespaceTokenType) {
                        result = result.trimEnd() + " ";
                    } else if (
                        arena.dataTypes[curr] == EnumToken.CommaTokenType ||
                        (arena.dataTypes[curr] == EnumToken.LiteralTokenType && arena.strings[arena.stringValue[curr]] == "/")
                    ) {
                        result = result.trimEnd() + (arena.dataTypes[curr] == EnumToken.CommaTokenType ? "," : "/");
                    } else {
                        result =
                            result.trimEnd() +
                            (useAlpha && index == chi.length - 1 ? "/" : " ") +
                            renderValue(arena, curr, options, cache);
                    }
                }

                return (
                    (hasAlpha && fnName.endsWith("a") ? fnName.slice(0, -1) : fnName) +
                    "(" +
                    result.trimStart() +
                    ")"
                );
            }

        case EnumToken.UrlFunctionTokenType:
            if (options.minifyValues && arena.dataTypes[token] === EnumToken.UrlFunctionTokenType) {
                if (arena.typeOf(arena.firstToken[token]) === EnumToken.BadUrlTokenType) {
                    return "url()";
                }

                for (const child of arena.tokens(token)) {
                    if (arena.dataTypes[child] === EnumToken.StringTokenType) {
                        const val: string = arena.strings[arena.stringValue[child]];

                        if (val.slice(1, 5) !== "data:" && urlTokenMatcher.test(val)) {
                            arena.dataTypes[child] = EnumToken.UrlTokenTokenType;
                            arena.setStr(child, val.slice(1, -1));
                        }

                        break;
                    }
                }
            }

        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.MathFunctionTokenType:
        case EnumToken.ImageFunctionTokenType:
            if (options.minifyValues && arena.dataTypes[token] === EnumToken.ImageFunctionTokenType) {
                const slice: Token[] = arena.tokens(token);

                switch (arena.strings[arena.stringValue[token]]) {
                    case "linear-gradient":
                    case "repeating-linear-gradient":
                        {
                            let i: number;
                            let k: number;
                            let j: number;
                            let key: string;

                            for (i = 0; i < slice.length; i++) {
                                if (
                                    arena.dataTypes[slice[i]] == EnumToken.ColorTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommaTokenType
                                ) {
                                    break;
                                }

                                if (
                                    arena.dataTypes[slice[i]] == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "to")
                                ) {
                                    k = i + 1;
                                    while (
                                        k < slice.length &&
                                        (arena.dataTypes[slice[k]] === EnumToken.WhitespaceTokenType ||
                                            arena.dataTypes[slice[k]] === EnumToken.CommentTokenType)
                                    ) {
                                        k++;
                                    }

                                    if (k < slice.length && arena.dataTypes[slice[k]] === EnumToken.IdenTokenType) {
                                        // convert keyword to angle
                                        key = arena.strings[arena.stringValue[slice[k]]].toLowerCase();
                                        switch (key) {
                                            case "right":
                                                slice.splice(i, k - i + 1, arena.createToken(EnumToken.AngleTokenType, 90, "deg"));
                                                break;
                                            case "left":
                                                slice.splice(i, k - i + 1, arena.createToken(EnumToken.AngleTokenType, 270, "deg"));
                                                break;
                                            case "top":
                                            case "bottom":
                                                j = k + 1;

                                                while (
                                                    j < slice.length &&
                                                    (arena.dataTypes[slice[j]] === EnumToken.WhitespaceTokenType ||
                                                        arena.dataTypes[slice[j]] === EnumToken.CommentTokenType)
                                                ) {
                                                    j++;
                                                }

                                                if (j < slice.length && arena.dataTypes[slice[j]] !== EnumToken.CommaTokenType) {
                                                    i = j - 1;
                                                    break;
                                                }

                                                // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient#:~:text=If%20unspecified%2C%20it%20defaults%20to%20to%20bottom
                                                if (key === "bottom") {
                                                    // to bottom -> 180deg is the default angle and will be removed
                                                    while (
                                                        k < slice.length &&
                                                        arena.dataTypes[slice[k]] != EnumToken.CommaTokenType
                                                    ) {
                                                        k++;
                                                    }

                                                    slice.splice(i, k - i + 1);
                                                    i--;
                                                    continue;
                                                }

                                                slice.splice(i, k - i + 1, arena.createToken(EnumToken.AngleTokenType, key === "top" ? 0 : 180, "deg"));
                                                i--;
                                                break;
                                        }
                                    }
                                } else if (arena.dataTypes[slice[i]] == EnumToken.AngleTokenType) {
                                    if ((180 - arena.numericValue[toDegrees(arena, slice[i])]) % 360 === 0) {
                                        k = i + 1;

                                        // while (k < slice.length && arena.dataTypes[slice[k]] !== EnumToken.CommaTokenType) {
                                        //     k++;
                                        // }

                                        slice.splice(i, k - i + 1);
                                    }
                                }
                            }

                            if (arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                i++;
                                // while (
                                //     i < slice.length &&
                                //     (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                //         arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                //) {
                                //     i++;
                                // }
                            }

                            if (arena.dataTypes[slice[i]] === EnumToken.ColorTokenType) {
                                for (const token of reduceColorStops(arena, slice.splice(i, slice.length - i))) {
                                    slice.push(token);
                                }
                            }
                        }

                        break;

                    case "radial-gradient":
                    case "repeating-radial-gradient":
                        {
                            let i: number = 0;

                            // while (
                            //     i < slice.length &&
                            //     (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                            //         arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                            //) {
                            //     i++;
                            // }

                            const positions: Token[] = [];
                            const form: Token[] = [];
                            const size: Token[] = [];
                            const colorSpaceDef: Token[] = [];

                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType) {
                                if (
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "ellipse")
                                ) {
                                    i++;
                                } else if (
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-side") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-side")
                                ) {
                                    size.push(slice[i++]);
                                } else if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "circle")) {
                                    form.push(slice[i++]);
                                }

                                while (
                                    arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommentTokenType
                                ) {
                                    i++;
                                }
                            }

                            if (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType) {
                                if (
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "ellipse")
                                ) {
                                    i++;
                                } else if (
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-side") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "closest-corner") ||
                                    equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "farthest-side")
                                ) {
                                    size.push(slice[i++]);
                                } else if (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "circle")) {
                                    form.push(slice[i++]);
                                }

                                while (
                                    arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommentTokenType
                                ) {
                                    i++;
                                }
                            }

                            if (
                                arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "at")
                            ) {
                                i++;
                            }

                            while (
                                arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                arena.dataTypes[slice[i]] === EnumToken.CommentTokenType
                            ) {
                                i++;
                            }

                            if (
                                arena.dataTypes[slice[i]] === EnumToken.PercentageTokenType ||
                                (arena.dataTypes[slice[i]] === EnumToken.NumberTokenType && 0 === arena.numericValue[slice[i]]) ||
                                (arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                    (equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "center") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "top") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "bottom") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "left") ||
                                        equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "right")))
                            ) {
                                do {
                                    if (
                                        arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                        "in" === arena.strings[arena.stringValue[slice[i]]]
                                    ) {
                                        break;
                                    }

                                    positions.push(slice[i]);
                                    i++;
                                } while (i < slice.length && arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType);
                            }

                            while (i < slice.length && arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType) {
                                colorSpaceDef.push(slice[i++]);
                            }

                            if (arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                i++;
                            }

                            if (positions.length > 0) {
                                let k: number;
                                let position1: string = "";
                                let position2: string = "";

                                for (k = 0; k < positions.length; k++) {
                                    if (arena.dataTypes[positions[k]] === EnumToken.IdenTokenType) {
                                        if (position1.length === 0) {
                                            position1 = arena.strings[arena.stringValue[positions[k]]];
                                        } else {
                                            position2 = arena.strings[arena.stringValue[positions[k]]];
                                        }
                                    } else if (
                                        arena.dataTypes[positions[k]] === EnumToken.PercentageTokenType ||
                                        arena.dataTypes[positions[k]] === EnumToken.NumberTokenType
                                    ) {
                                        if (position1.length === 0) {
                                            position1 = arena.numericValue[positions[k]] + "%";
                                        } else {
                                            position2 = arena.numericValue[positions[k]] + "%";
                                        }
                                    }

                                    if (position2.length > 0) {
                                        break;
                                    }
                                }

                                if (position1.length > 0) {
                                    let key = `${position1} ${position2}`.trim();

                                    if (
                                        key === "50% 50%" ||
                                        key === "center center" ||
                                        key === "50%" ||
                                        key === "center"
                                    ) {
                                        positions.length = 0;
                                    } else if (
                                        key === "0% 0%" ||
                                        key === "0 0" ||
                                        key === "top left" ||
                                        key === "left top"
                                    ) {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.PercentageTokenType, 0));
                                    } else if (
                                        key === "50% 0%" ||
                                        key === "50% 0" ||
                                        key === "center top" ||
                                        key === "top center"
                                    ) {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "top"));
                                    } else if (key === "top right" || key === "right top") {
                                        positions.splice(
                                            0,
                                            positions.length,
                                            arena.createToken(EnumToken.PercentageTokenType, 100),
                                            arena.createToken(EnumToken.WhitespaceTokenType),
                                            arena.createToken(EnumToken.PercentageTokenType, 0),
                                        );
                                    } else if (
                                        key === "0 50%" ||
                                        key === "0% 50%" ||
                                        key === "left center" ||
                                        key === "center left"
                                    ) {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "left"));
                                    } else if (key === "100% 50%" || key === "right center" || key === "center right") {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "right"));
                                    } else if (
                                        key === "0 100%" ||
                                        key === "0% 100%" ||
                                        key === "left bottom" ||
                                        key === "bottom left"
                                    ) {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "bottom"));
                                    } else if (
                                        key === "50% 100%" ||
                                        key === "center bottom" ||
                                        key === "bottom center"
                                    ) {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.IdenTokenType, "bottom"));
                                    } else if (
                                        key === "100% 100%" ||
                                        key === "right bottom" ||
                                        key === "bottom right"
                                    ) {
                                        positions.splice(0, positions.length, arena.createToken(EnumToken.PercentageTokenType, 100));
                                    } else if (position1 === position2) {
                                        positions.splice(0, positions.length, positions[k]);
                                    }
                                }
                            }

                            const result: Token[] = [];

                            if (form.length > 0) {
                                for (const token of form) {
                                    result.push(token);
                                }
                            }

                            if (size.length > 0) {
                                if (result.length > 0) {
                                    result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }

                                for (const token of size) {
                                    result.push(token);
                                }
                            }

                            if (positions.length > 0) {
                                if (result.length > 0) {
                                    result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }

                                result.push(
                                    arena.createToken(EnumToken.IdenTokenType, "at"),
                                    arena.createToken(EnumToken.WhitespaceTokenType),
                                );

                                for (const token of positions) {
                                    result.push(token);
                                }
                            }

                            if (colorSpaceDef.length > 0) {
                                if (result.length > 0) {
                                    result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }

                                for (const token of colorSpaceDef) {
                                    result.push(token);
                                }
                            }

                            if (result.length > 0) {
                                result.push(arena.createToken(EnumToken.CommaTokenType));
                            }

                            for (const token of reduceColorStops(arena, slice.slice(i))) {
                                result.push(token);
                            }

                            slice.length = 0;

                            for (const token of result) {
                                slice.push(token);
                            }
                        }
                        break;

                    case "conic-gradient":
                    case "repeating-conic-gradient":
                        {
                            let i: number = 0;

                            const angles: Token[] = [];
                            const positions: Token[] = [];
                            const colorSpaceDef: Token[] = [];

                            // while (
                            //     i < slice.length &&
                            //     (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                            //         arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                            //) {
                            //     i++;
                            // }

                            if (
                                arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "from")
                            ) {
                                angles.push(slice[i++]);

                                while (
                                    i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                ) {
                                    angles.push(slice[i++]);
                                }

                                if (
                                    (arena.dataTypes[slice[i]] === EnumToken.NumberTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.AngleTokenType) &&
                                    0 === arena.numericValue[toDegrees(arena, slice[i])]
                                ) {
                                    angles.length = 0;
                                    i++;
                                } else if (
                                    arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType &&
                                    arena.dataTypes[slice[i]] != EnumToken.IdenTokenType
                                ) {
                                    angles.push(slice[i++]);
                                }

                                while (
                                    i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }
                            }

                            if (
                                arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase(arena.strings[arena.stringValue[slice[i]]], "at")
                            ) {
                                i++;

                                while (
                                    i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }

                                let position1: string = "";
                                let position2: string = "";

                                if (
                                    arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", arena.strings[arena.stringValue[slice[i]]])
                                ) {
                                    position1 = arena.strings[arena.stringValue[slice[i]]];
                                    positions.push(slice[i++]);
                                } else if (
                                    arena.dataTypes[slice[i]] === EnumToken.PercentageTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.NumberTokenType
                                ) {
                                    position1 = arena.numericValue[slice[i]] + "%";
                                    positions.push(slice[i++]);
                                }

                                while (
                                    i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                ) {
                                    positions.push(slice[i++]);
                                }

                                if (
                                    arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", arena.strings[arena.stringValue[slice[i]]])
                                ) {
                                    position2 = arena.strings[arena.stringValue[slice[i]]];
                                    positions.push(slice[i++]);
                                } else if (
                                    arena.dataTypes[slice[i]] === EnumToken.PercentageTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.NumberTokenType
                                ) {
                                    position2 = arena.numericValue[slice[i]] + "%";
                                    positions.push(slice[i++]);
                                }

                                while (
                                    i < slice.length &&
                                    (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }

                                if (position1.length > 0) {
                                    reducegradientBackgroundPosition(arena, positions, `${position1} ${position2}`.trim());
                                }
                            }

                            while (
                                i < slice.length &&
                                (arena.dataTypes[slice[i]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[slice[i]] === EnumToken.CommentTokenType)
                            ) {
                                i++;
                            }

                            if (
                                arena.dataTypes[slice[i]] === EnumToken.IdenTokenType &&
                                equalsIgnoreCase("in", arena.strings[arena.stringValue[slice[i]]])
                            ) {
                                while (i < slice.length && arena.dataTypes[slice[i]] !== EnumToken.CommaTokenType) {
                                    colorSpaceDef.push(slice[i++]);
                                }
                            }

                            if (arena.dataTypes[slice[i]] === EnumToken.CommaTokenType) {
                                i++;
                            }

                            const result: Token[] = [];

                            if (positions.length > 0) {
                                if (positions.length > 0) {
                                    if (angles.length > 0) {
                                        angles.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                    }

                                    angles.push(
                                        arena.createToken(EnumToken.IdenTokenType, "at"),
                                        arena.createToken(EnumToken.WhitespaceTokenType),
                                    );

                                    for (const position of positions) {
                                        angles.push(position);
                                    }
                                }
                            }

                            if (angles.length > 0) {
                                for (const angle of angles) {
                                    result.push(angle);
                                }
                                result.push(arena.createToken(EnumToken.CommaTokenType));
                            }

                            if (colorSpaceDef.length > 0) {
                                if (colorSpaceDef.length > 0) {
                                    if (result.length > 0) {
                                        result.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                    }

                                    for (const token of colorSpaceDef) {
                                        result.push(token);
                                    }
                                }

                                result.push(arena.createToken(EnumToken.CommaTokenType));
                            }

                            for (const token of reduceConicColorStops(arena, slice.slice(i))) {
                                result.push(token);
                            }

                            slice.length = 0;

                            for (let j = 0; j < result.length; j++) {
                                slice.push(result[j]);
                            }
                        }
                        break;
                }

                return arena.strings[arena.stringValue[token]] + "(" + renderTokenList(slice, reducer) + ")";
            }

        case EnumToken.TimingFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:
        case EnumToken.WhenElseFunctionTokenType:
        case EnumToken.TimelineFunctionTokenType:
        case EnumToken.GridTemplateFuncTokenType:
        case EnumToken.SupportsFunctionTokenType:
        case EnumToken.ContainerFunctionTokenType:
        case EnumToken.TransformFunctionTokenType:
        case EnumToken.GeneralEnclosedFunctionTokenType:
        case EnumToken.CustomFunctionTokenType:
        case EnumToken.WildCardFunctionTokenType:
            if (
                arena.dataTypes[token] == EnumToken.MathFunctionTokenType &&
                arena.tokenCount(token) == 1 &&
                ![EnumToken.BinaryExpressionTokenType, EnumToken.FractionTokenType, EnumToken.IdenTokenType].includes(
                    arena.dataTypes[arena.firstToken[token]],
                ) &&
                !arena.hasFraction(arena.firstToken[token])
            ) {
                return (
                    arena.strings[arena.stringValue[token]] +
                    "(" +
                    renderTokenList(arena.tokens(token),
                        (acc: string, curr: Token) =>
                            acc +
                            renderValue(
                                arena,
                                curr,
                                arena.dataTypes[token] == EnumToken.FunctionTokenType ? { minify: false } : options,
                                cache,
                                reducer,
                            ),
                    ) +
                    ")"
                );
            }

            return (arena.strings[arena.stringValue[token]] ?? "") + "(" + renderTokenList(arena.tokens(token), reducer) + ")";

        case EnumToken.BlockStartTokenType:
            return "{";

        case EnumToken.BlockEndTokenType:
            return "}";

        case EnumToken.StartParensTokenType:
            return "(";

        case EnumToken.DelimTokenType:
        case EnumToken.EqualMatchTokenType:
            return "=";

        case EnumToken.IncludeMatchTokenType:
            return "~=";

        case EnumToken.DashMatchTokenType:
            return "|=";

        case EnumToken.StartMatchTokenType:
            return "^=";

        case EnumToken.EndMatchTokenType:
            return "$=";

        case EnumToken.ContainMatchTokenType:
            return "*=";

        case EnumToken.LtTokenType:
            return "<";

        case EnumToken.LteTokenType:
            return "<=";

        case EnumToken.Tilda:
        case EnumToken.SubsequentSiblingCombinatorTokenType:
            return "~";

        case EnumToken.Plus:
        case EnumToken.NextSiblingCombinatorTokenType:
            return "+";

        case EnumToken.GtTokenType:
        case EnumToken.ChildCombinatorTokenType:
            return ">";

        case EnumToken.GteTokenType:
            return ">=";

        case EnumToken.ColumnCombinatorTokenType:
            return "||";

        case EnumToken.EndParensTokenType:
            return ")";

        case EnumToken.AttrStartTokenType:
            return "[";

        case EnumToken.AttrEndTokenType:
            return "]";

        case EnumToken.DescendantCombinatorTokenType:
        case EnumToken.WhitespaceTokenType:
            return " ";

        case EnumToken.ColonTokenType:
            return ":";

        case EnumToken.DoubleColonTokenType:
            return "::";

        case EnumToken.SemiColonTokenType:
            return ";";

        case EnumToken.CommaTokenType:
            return ",";

        case EnumToken.ImportantTokenType:
            return "!important";

        case EnumToken.PipeTokenType:
            return "|";
        case EnumToken.AttrTokenType:
        case EnumToken.IdenListTokenType:
            return "[" + renderTokenList(arena.tokens(token), reducer) + "]";

        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:
        case EnumToken.UserDefinedDimensionTokenType:
            let val: string = arena.hasFraction(token)
                ? renderValue(arena, arena.getFraction(token), options, cache)
                : minifyNumber(arena.numericValue[token]);
            let unit: string = arena.strings[arena.unit[token]];

            if (arena.dataTypes[token] == EnumToken.AngleTokenType && !val.includes("/")) {
                const angle: number = getAngle(arena, token);

                let v: string;
                let value: string = val + unit;

                for (const u of ["deg", "turn", "rad", "grad"]) {
                    if (arena.strings[arena.unit[token]] == u) {
                        continue;
                    }

                    switch (u) {
                        case "deg":
                            v = minifyNumber(
                                toPrecisionAngle(angle * 360, anglePrecision, false).toFixed(anglePrecision),
                            );

                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "turn":
                            v = minifyNumber(toPrecisionAngle(angle, anglePrecision, false).toFixed(anglePrecision));

                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "rad":
                            v = minifyNumber(
                                toPrecisionAngle(angle * (2 * Math.PI), anglePrecision, false).toFixed(anglePrecision),
                            );

                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "grad":
                            v = minifyNumber(
                                toPrecisionAngle(angle * 400, anglePrecision, false).toFixed(anglePrecision),
                            );

                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;
                    }
                }
            }

            if (val === "0") {
                if (arena.dataTypes[token] == EnumToken.TimeTokenType) {
                    return "0s";
                }

                if (arena.dataTypes[token] == EnumToken.FrequencyTokenType) {
                    return "0Hz";
                }

                // @ts-ignore
                if (arena.dataTypes[token] == EnumToken.ResolutionTokenType) {
                    return "0x";
                }

                return "0";
            }

            if (arena.dataTypes[token] == EnumToken.TimeTokenType) {
                if (unit == "ms") {
                    // @ts-ignore
                    const v: string = minifyNumber(val / 1000);

                    if (v.length + 1 <= val.length) {
                        return v + "s";
                    }

                    return val + "ms";
                }

                return val + "s";
            }

            if (arena.dataTypes[token] == EnumToken.ResolutionTokenType && unit == "dppx") {
                unit = "x";
            }

            return val.includes("/") ? val.replace("/", unit + "/") : minifyNumber(toPrecisionValue(val)) + unit;

        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni: string = arena.dataTypes[token] == EnumToken.PercentageTokenType ? "%" : "fr";
            const perc: string = arena.hasFraction(token)
                ? renderValue(arena, arena.getFraction(token), options, cache)
                : minifyNumber(arena.numericValue[token]);

            return options.minifyValues && perc == "0"
                ? "0"
                : perc.includes("/")
                  ? perc.replace("/", uni + "/")
                  : perc + uni;

        case EnumToken.NumberTokenType:
            return arena.hasFraction(token)
                ? renderValue(arena, arena.getFraction(token), options, cache)
                : minifyNumber(arena.numericValue[token]);

        case EnumToken.InfinityTokenType:
            return "1/0";
        case EnumToken.NegativeInfinityTokenType:
            return "-1/0";

        case EnumToken.NaNTokenType:
            return "NaN";

        case EnumToken.AtRuleTokenType:
            return "@" + arena.strings[arena.name[token]];

        case EnumToken.CommentTokenType:
        case EnumToken.CDOCOMMNodeType:
            if (
                options.removeComments &&
                (!options.preserveLicense || !arena.strings[arena.stringValue[token]].startsWith("/*!"))
            ) {
                return "";
            }

        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (
                arena.dataTypes[token] == EnumToken.PseudoElementTokenType &&
                pseudoElements.includes(arena.strings[arena.stringValue[token]].slice(1))
            ) {
                return arena.strings[arena.stringValue[token]].slice(1);
            }

        case EnumToken.CssTypeTokenType:
        case EnumToken.UrlTokenTokenType:

        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:
            return arena.strings[arena.stringValue[token]];

        case EnumToken.NestingSelectorTokenType:
            return "&";

        case EnumToken.InvalidAttrTokenType:
            return "[" + renderTokenList(arena.tokens(token), (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache));

        case EnumToken.InvalidClassSelectorTokenType:
            return arena.strings[arena.stringValue[token]];

        case EnumToken.SupportsQueryUnaryConditionTokenType:
        case EnumToken.WhenElseUnaryConditionTokenType:
            return (
                renderValue(arena, arena.field(token, TokenField.L), options, cache, reducer, errors) +
                " " +
                renderTokenList(
                    arena.fieldTokens(token, TokenField.R),
                    (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors),
                )
            );

        case EnumToken.SupportsQueryConditionTokenType:
        case EnumToken.WhenElseQueryConditionTokenType:
            return (
                renderTokenList(
                    arena.fieldTokens(token, TokenField.L),
                    (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors),
                ) +
                " " +
                renderValue(arena, arena.field(token, TokenField.Op), options, cache, reducer, errors) +
                " " +
                renderTokenList(
                    arena.fieldTokens(token, TokenField.R),
                    (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors),
                )
            );

        case EnumToken.IfConditionTokenType: {
            const l: Token[] = arena.fieldTokens(token, TokenField.L);

            return l.length == 0
                ? ""
                : renderTokenList(l, (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors)) +
                      ":" +
                      (options.indent ?? "") +
                      renderTokenList(
                          arena.fieldTokens(token, TokenField.R),
                          (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors),
                      );
        }

        case EnumToken.IfElseConditionTokenType:
            return (
                renderValue(arena, arena.field(token, TokenField.L), options, cache, reducer, errors) +
                (options.indent ?? "") +
                renderValue(arena, arena.field(token, TokenField.R), options, cache, reducer, errors)
            );

        case EnumToken.DeclarationNodeType:
            return (
                arena.strings[arena.name[token]] +
                ":" +
                renderTokenList(
                    options.minifyValues ? filterValues(arena, arena.tokens(token)) : arena.tokens(token),
                    (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache, reducer, errors),
                )
            );

        case EnumToken.MediaQueryUnaryFeatureTokenType:
            return (
                renderValue(arena, arena.field(token, TokenField.L), options, cache, reducer, errors) +
                " " +
                renderTokenList(
                    arena.fieldTokens(token, TokenField.R),
                    (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache, reducer, errors),
                )
            );

        case EnumToken.MediaQueryConditionTokenType: {
            const op: Token = arena.field(token, TokenField.Op);
            const opType: EnumToken = arena.dataTypes[op];
            const indent =
                opType == EnumToken.LtTokenType ||
                opType == EnumToken.GtTokenType ||
                opType == EnumToken.ColonTokenType ||
                opType == EnumToken.DelimTokenType ||
                opType == EnumToken.LteTokenType ||
                opType == EnumToken.GteTokenType
                    ? ""
                    : " ";
            return (
                renderTokenList(
                    arena.fieldTokens(token, TokenField.L),
                    (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors),
                ) +
                indent +
                renderValue(arena, op, options, cache, reducer, errors) +
                indent +
                renderTokenList(
                    arena.fieldTokens(token, TokenField.R),
                    (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache, reducer, errors),
                )
            );
        }

        case EnumToken.MediaRangeQueryTokenType:
            return (
                renderTokenList(
                    arena.fieldTokens(token, TokenField.L),
                    (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache, reducer, errors),
                ) +
                renderValue(arena, arena.field(token, TokenField.Op), options, cache, reducer, errors) +
                renderTokenList(
                    arena.fieldTokens(token, TokenField.Val),
                    (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache, reducer, errors),
                ) +
                renderValue(arena, arena.field(token, TokenField.Op2), options, cache, reducer, errors) +
                renderTokenList(
                    arena.fieldTokens(token, TokenField.R),
                    (acc: string, curr: Token): string => acc + renderValue(arena, curr, options, cache, reducer, errors),
                )
            );

        case EnumToken.MediaFeatureTokenType:
            return arena.strings[arena.stringValue[token]];

        case EnumToken.NotTokenType:
            return "not";

        case EnumToken.OnlyTokenType:
            return "only";
        case EnumToken.AndTokenType:
            return "and";

        case EnumToken.OrTokenType:
            return "or";

        case EnumToken.InvalidMediaQueryTokenType:
        case EnumToken.InvalidCommentTokenType:
        case EnumToken.BadCommentTokenType:
        case EnumToken.BadCdoTokenType:
        case EnumToken.BadStringTokenType:
        case EnumToken.BadUrlTokenType:
        case EnumToken.EOFTokenType:
            return "";

        case EnumToken.ComposesSelectorNodeType:
            return `${renderTokenList(arena.fieldTokens(token, TokenField.L), (acc, curr) => acc + renderValue(arena, curr, options, cache, reducer, errors))}${!arena.hasField(token, TokenField.R) ? "" : " from " + renderValue(arena, arena.field(token, TokenField.R), options, cache, reducer, errors)}`;

        default:
            throw new Error(`Unsupported token type for ${EnumToken[arena.dataTypes[token]]}`);
    }

    // errors?.push({ action: "ignore", message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    // return "";
}

/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
export function filterValues(arena: AstArena, values: Token[]): Token[] {
    let i: number = 0;

    for (; i < values.length; i++) {
        if (arena.dataTypes[values[i]] == EnumToken.ImportantTokenType && arena.dataTypes[values[i - 1]] === EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        } else if (
            tokensfuncSet.has(arena.dataTypes[values[i]]) &&
            // color keywords and hex colors are not functions
            (arena.dataTypes[values[i]] != EnumToken.ColorTokenType || arena.firstToken[values[i]] != 0) &&
            arena.dataTypes[values[i]] != EnumToken.WildCardFunctionTokenType &&
            arena.dataTypes[values[i + 1]] == EnumToken.WhitespaceTokenType
        ) {
            values.splice(i + 1, 1);
        }
    }

    return values;
}
