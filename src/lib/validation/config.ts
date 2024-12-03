import config from './config.json' with {type: 'json'};
import type {ValidationConfiguration} from "../../@types/validation";
import {parseSyntax, ValidationSyntaxGroupEnum, ValidationToken} from "./parser";

const parsedSyntaxes = new Map<string, ValidationToken[]>();

Object.freeze(config);

export function getSyntaxConfig(): ValidationConfiguration {
    // @ts-ignore
    return config as ValidationConfiguration;
}

export function getParsedSyntax(group: ValidationSyntaxGroupEnum, key: string): null | ValidationToken[] {

    //
    // console.error({group, key});

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
    // console.error(`> group: '${group}' | key: '${key}' | syntax: "${config[group][key].syntax}"`);

    // @ts-ignore
    if (!parsedSyntaxes.has(index)) {

        // @ts-ignore
        parsedSyntaxes.set(index, parseSyntax(config[group][key].syntax).chi);
    }

    return parsedSyntaxes.get(index) as ValidationToken[];
}