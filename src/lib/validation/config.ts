import config from './config.json' with {type: 'json'};
import type {ValidationConfiguration} from "../../@types/validation";
import {parseSyntax, renderSyntax, ValidationSyntaxGroupEnum, ValidationToken, walkValidationToken} from "./parser";

const parsedSyntaxes = new Map<string, ValidationToken[]>();

Object.freeze(config);

export function getSyntaxConfig(): ValidationConfiguration {
    // @ts-ignore
    return config as ValidationConfiguration;
}

export function getParsedSyntax(group: ValidationSyntaxGroupEnum, key: string): null | ValidationToken[] {

    if (!(key in config[group])) {

        const matches: RegExpMatchArray = key.match(/(@?)(-[a-zA-Z]+)-(.*?)$/) as RegExpMatchArray;

        if (matches != null) {

            key = matches[1] + matches[3];
        }

        if (!(key in config[group])) {

            return null;
        }
    }

    const index: string = group + '.' + key;

    // @ts-ignore
    if (!parsedSyntaxes.has(index)) {

        // @ts-ignore
        const syntax = parseSyntax(config[group][key].syntax);

        for (const node of syntax.chi as ValidationToken[]) {

            for (const {token, parent} of walkValidationToken(node)) {

                token.text = renderSyntax(token, parent);
            }
        }

        // @ts-ignore
        parsedSyntaxes.set(index, syntax.chi);
    }

    return parsedSyntaxes.get(index) as ValidationToken[];
}