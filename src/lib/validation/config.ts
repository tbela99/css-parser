import config from './config.json' with {type: 'json'};
import type {ValidationConfiguration, ValidationSyntaxNode} from "../../@types/validation.d.ts";
import {parseSyntax, ValidationSyntaxGroupEnum, ValidationToken} from "./parser/index.ts";

const parsedSyntaxes = new Map<string, ValidationToken[]>();

Object.freeze(config);

export function getSyntaxConfig(): ValidationConfiguration {
    // @ts-ignore
    return config as ValidationConfiguration;
}

export function getParsedSyntax(group: ValidationSyntaxGroupEnum, key: string | string[]): null | ValidationToken[] {

    // @ts-ignore
    let obj = config[group] as Record<ValidationSyntaxGroupEnum, ValidationSyntaxNode>;

    const keys: string[] = Array.isArray(key) ? key : [key];

    for (let i = 0; i < keys.length; i++) {

        key = keys[i];

        if (!(key in obj)) {

            if ((i == 0 && key.charAt(0) == '@') || key.charAt(0) == '-') {

                const matches: RegExpMatchArray = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/) as RegExpMatchArray;

                if (matches != null) {

                    key = matches[1] + matches[3];
                }
            }

            if (!(key in obj)) {

                return null;
            }
        }

        // @ts-ignore
        obj = obj[key];
    }

    const index: string = group + '.' + keys.join('.');

    // @ts-ignore
    if (!parsedSyntaxes.has(index)) {

        // @ts-ignore
        const syntax: ValidationRootToken = parseSyntax(obj.syntax);

        // @ts-ignore
        parsedSyntaxes.set(index, syntax.chi);
    }

    return parsedSyntaxes.get(index) as ValidationToken[];
}