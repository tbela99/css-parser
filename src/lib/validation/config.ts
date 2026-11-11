import { config } from "./json.ts";
import type { ValidationConfiguration, ValidationSyntaxNode } from "../../@types/validation.d.ts";
import type { ValidationBracketToken, ValidationToken } from "./parser/types.d.ts";
import { parseSyntax, trimSyntaxArray } from "./parser/parse.ts";
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "./parser/typedef.ts";
import { memoize } from "../parser/utils/cache.ts";

export interface ValidationSyntaxRule {
    optionalBody: boolean;
    acceptAnyDeclaration: boolean;
    acceptAnyRule: boolean;
    getBlockRules: () => ValidationToken[] | null;
    getPreludeRules: () => ValidationToken[] | null;
    getPropertyDescriptors: () => Record<string, ValidationToken[]> | null;
}

const parsedSyntaxes = new Map<string, ValidationToken[]>();

Object.freeze(config);

export function getSyntaxConfig(): ValidationConfiguration {
    // @ts-expect-error
    return config as ValidationConfiguration;
}

/**
 * find a syntax definition in a group.
 *
 * the syntaxes are generated from webref (see scripts/webref.ts): the functions and the patched syntaxes are stored in
 * the {@link ValidationSyntaxGroupEnum.Syntaxes} group, the value types are stored in the
 * {@link ValidationSyntaxGroupEnum.Types} group with their name without the angle brackets (`color`).
 * a {@link ValidationSyntaxGroupEnum.Syntaxes} lookup falls back to the {@link ValidationSyntaxGroupEnum.Types} group
 * @param group
 * @param key
 */
function lookupNode(group: ValidationSyntaxGroupEnum, key: string): ValidationSyntaxNode | null {
    const groups = config as unknown as Record<string, Record<string, ValidationSyntaxNode> | undefined>;

    if (groups[group]?.[key] != null) {
        return groups[group][key];
    }

    if (group === ValidationSyntaxGroupEnum.Syntaxes) {
        return groups[ValidationSyntaxGroupEnum.Types]?.[key] ?? null;
    }

    return null;
}

/**
 * true if a type or a function syntax is defined
 * @param key the type name without the angle brackets, or the function name followed by `()`
 */
export function hasSyntax(key: string): boolean {
    return lookupNode(ValidationSyntaxGroupEnum.Syntaxes, key) != null;
}

/**
 * return the raw syntax of a type or a function
 * @param key the type name without the angle brackets, or the function name followed by `()`
 */
export function getSyntax(key: string): string | null {
    return (lookupNode(ValidationSyntaxGroupEnum.Syntaxes, key)?.syntax as string | undefined) ?? null;
}

function findNode(
    group: ValidationSyntaxGroupEnum,
    key: string,
): Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode> | ValidationSyntaxNode | null {
    let obj: ValidationSyntaxNode | null = lookupNode(group, key);

    if (obj == null) {
        if (key.charAt(0) == "@" || key.charAt(0) == "-") {
            const matches: RegExpMatchArray = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/) as RegExpMatchArray;

            if (matches != null) {
                key = matches[1] + matches[3];
            }
        }

        obj = lookupNode(group, key);

        if (obj == null) {
            return null;
        }
    }

    return obj;
}

export const getParsedSyntax = memoize((group: ValidationSyntaxGroupEnum, key: string): null | ValidationToken[] => {
    // @ts-expect-error
    const obj: Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode> | ValidationSyntaxNode = findNode(group, key);

    if (obj == null) {
        return null;
    }

    const index: string = group + "." + key;

    if (!parsedSyntaxes.has(index)) {
        const syntax: ValidationToken[] = Object.freeze(
            trimSyntaxArray(parseSyntax((obj as ValidationSyntaxNode).syntax as string)),
        ) as ValidationToken[];
        parsedSyntaxes.set(index, syntax);
    }

    return parsedSyntaxes.get(index) as ValidationToken[];
}) as (group: ValidationSyntaxGroupEnum, key: string) => null | ValidationToken[];

export const getSyntaxRule = memoize((group: ValidationSyntaxGroupEnum, key: string): ValidationSyntaxRule | null => {
    const node = findNode(group, key);

    if (node == null) {
        return null;
    }

    let syntaxRules = getParsedSyntax(group, key) as ValidationToken[];

    if (syntaxRules == null) {
        return null;
    }

    let blockStart: number = -1;
    let blockEnd: number = -1;
    let i: number;

    for (i = 0; i < syntaxRules.length; i++) {
        if (
            syntaxRules[i].typ === ValidationTokenEnum.OpenCurlyBrace ||
            syntaxRules[i].typ === ValidationTokenEnum.SemiColon
        ) {
            blockStart = i;
            break;
        }
    }

    if (blockStart != -1) {
        i = syntaxRules.length;

        while (i--) {
            if (syntaxRules[i].typ === ValidationTokenEnum.CloseCurlyBrace) {
                blockEnd = i;
                break;
            }
        }
    }

    let block = blockStart == -1 ? null : trimSyntaxArray(syntaxRules.slice(blockStart + 1, blockEnd));
    let prelude = trimSyntaxArray(blockStart == -1 ? syntaxRules.slice() : syntaxRules.slice(0, blockStart));

    let propertyDescriptors: Record<string, ValidationToken[]> | null = null;

    // @ts-expect-error
    if (node.descriptors != null) {
        propertyDescriptors = {};

        // @ts-expect-error
        for (const [key, value] of Object.entries(node.descriptors)) {
            // @ts-expect-error
            propertyDescriptors[key] = parseSyntax(typeof value === "string" ? value : value.syntax);
        }
    }

    let optionalBody = false;

    if (block == null || block.length === 0) {
        let k = prelude.length - 1;

        if (ValidationTokenEnum.SemiColon === prelude[k].typ) {
            k--;
        }

        if (k >= 0 && ValidationTokenEnum.Bracket === prelude[k].typ) {
            if (
                ((prelude[k] as ValidationBracketToken).chi[0] as ValidationToken).typ ===
                    ValidationTokenEnum.OpenCurlyBrace &&
                ((prelude[k] as ValidationBracketToken).chi as ValidationToken[]).at(-1)!.typ ===
                    ValidationTokenEnum.CloseCurlyBrace
            ) {
                block = (prelude[k] as ValidationBracketToken).chi.slice(1, -1);
                optionalBody = prelude[k].isOptional ?? false;
            }
        }
    }

    return {
        optionalBody,
        acceptAnyDeclaration: (node as ValidationSyntaxNode).syntax.includes("<declaration-list>"),
        acceptAnyRule:
            (node as ValidationSyntaxNode).syntax.includes("<group-rule-body>") ||
            (node as ValidationSyntaxNode).syntax.includes("<stylesheet>"),
        getPreludeRules: () => prelude,
        getBlockRules: () => (block == null || block.length === 0 ? null : block),
        // getRules: () => syntaxRules,
        getPropertyDescriptors: () => propertyDescriptors,
    };
}) as (group: ValidationSyntaxGroupEnum, key: string) => ValidationSyntaxRule | null;
