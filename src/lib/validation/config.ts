import { config } from "./json.ts";
import type { ValidationConfiguration, ValidationSyntaxNode } from "../../@types/validation.d.ts";
import type { ValidationToken } from "./parser/types.d.ts";
import { parseSyntax, trimSyntaxArray } from "./parser/parse.ts";
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "./parser/typedef.ts";
import { memoize } from "../parser/utils/cache.ts";

export interface ValidationSyntaxRule {
    acceptAnyDeclaration: boolean;
    acceptAnyRule: boolean;
    getRules: () => ValidationToken[];
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

export const getSyntax = memoize((group: ValidationSyntaxGroupEnum, key: string | string[]): null | string => {
    // @ts-expect-error
    let obj = config[group] as Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode>;

    const keys: string[] = Array.isArray(key) ? key : [key];

    for (let i = 0; i < keys.length; i++) {
        key = keys[i];

        if (!(key in obj)) {
            if ((i == 0 && key.charAt(0) == "@") || key.charAt(0) == "-") {
                const matches: RegExpMatchArray = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/) as RegExpMatchArray;

                if (matches != null) {
                    key = matches[1] + matches[3];
                }
            }
        }

        // @ts-expect-error
        obj = obj[key];
    }

    // @ts-expect-error
    return obj?.syntax ?? null;
}) as (group: ValidationSyntaxGroupEnum, key: string | string[]) => null | string;

function findNode(
    group: ValidationSyntaxGroupEnum,
    key: string | string[],
): Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode> | ValidationSyntaxNode | null {
    // @ts-expect-error
    let obj: Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode> | ValidationSyntaxNode = config[group] as Record<
        ValidationSyntaxGroupEnum,
        ValidationSyntaxNode
    >;

    const keys: string[] = Array.isArray(key) ? key : [key];

    for (let i = 0; i < keys.length; i++) {
        key = keys[i];

        if (!(key in obj)) {
            if ((i == 0 && key.charAt(0) == "@") || key.charAt(0) == "-") {
                const matches: RegExpMatchArray = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/) as RegExpMatchArray;

                if (matches != null) {
                    key = matches[1] + matches[3];
                }
            }

            if (!(key in obj)) {
                return null;
            }
        }

        // @ts-expect-error
        obj = obj[key] as ValidationSyntaxNode | Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode>;
    }

    return obj;
}

export const getParsedSyntax = memoize(
    (group: ValidationSyntaxGroupEnum, key: string | string[]): null | ValidationToken[] => {
        // @ts-expect-error
        const obj: Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode> | ValidationSyntaxNode = findNode(
            group,
            key,
        );

        if (obj == null) {
            return null;
        }

        const keys: string[] = Array.isArray(key) ? key : [key];
        const index: string = group + "." + keys.join(".");

        if (!parsedSyntaxes.has(index)) {
            const syntax: ValidationToken[] = Object.freeze(
                trimSyntaxArray(parseSyntax((obj as ValidationSyntaxNode).syntax as string)),
            ) as ValidationToken[];
            parsedSyntaxes.set(index, syntax);
        }

        return parsedSyntaxes.get(index) as ValidationToken[];
    },
) as (group: ValidationSyntaxGroupEnum, key: string | string[]) => null | ValidationToken[];

export const getSyntaxRule = memoize(
    (group: ValidationSyntaxGroupEnum, key: string | string[]): ValidationSyntaxRule | null => {
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

        const block = blockStart == -1 ? null : trimSyntaxArray(syntaxRules.slice(blockStart + 1, blockEnd));
        const prelude = trimSyntaxArray(blockStart == -1 ? syntaxRules.slice() : syntaxRules.slice(0, blockStart));

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

        return {
            acceptAnyDeclaration: (node as ValidationSyntaxNode).syntax.includes("<declaration-list>"),
            acceptAnyRule:
                (node as ValidationSyntaxNode).syntax.includes("<group-rule-body>") ||
                (node as ValidationSyntaxNode).syntax.includes("<stylesheet>"),
            getPreludeRules: () => prelude,
            getBlockRules: () => (block == null || block.length === 0 ? null : block),
            getRules: () => syntaxRules,
            getPropertyDescriptors: () => propertyDescriptors,
        };
    },
) as (group: ValidationSyntaxGroupEnum, key: string | string[]) => ValidationSyntaxRule | null;
