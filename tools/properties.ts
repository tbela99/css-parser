import {PropertySetType, TokenType} from "../src/@types";

function createProperties(shorthand: string, properties: string[], types: TokenType[], multiple: boolean, separator, keywords: string[] = []) {

    return Object.assign({
        [shorthand]: {
            shorthand,
            properties,
            types,
            multiple,
            separator: separator == undefined ? null : separator,
            keywords
        }
    }, properties.reduce((acc, property: string) => {

        return Object.assign(acc, {
            [property]: {

                shorthand
            }
        });
    }, <PropertySetType>{}));
}

export const properties: PropertySetType =
    [
        [
            'margin',
            ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
            ['Dimension', 'Number', 'Perc'],
            false,
            null,
            ['auto']
        ],
        [
            'padding',
            ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
            ['Dimension', 'Number', 'Perc'],
            false,
            null
        ],
        [
            'border-radius',
            ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
            ['Dimension', 'Number', 'Perc'],
            true,
            '/'
        ]
    ].reduce((acc, data: Array<string | string[]>) => {

        return Object.assign(acc, createProperties(...data));
    }, <PropertySetType>{});

console.debug(JSON.stringify({properties}, null, 1));