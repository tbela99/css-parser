import {PropertySetType, TokenType} from "../src/@types";

function createProperties(shorthand: string, properties: string[], types: TokenType[], multiple: boolean, separator) {

    return Object.assign({
        [shorthand]: {
            shorthand,
            properties,
            types,
            multiple,
            separator: separator == undefined ? null : separator
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
            false
        ],
        [
            'padding',
            ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
            ['Dimension', 'Number', 'Perc'],
            false
        ],
        [
            'border-radius',
            ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
            ['Dimension', 'Number', 'Perc'],
            false
        ]
    ].reduce((acc, data: Array<string | string[]>) => {

        return Object.assign(acc, createProperties(...data));
    }, <PropertySetType>{});

console.debug(JSON.stringify({properties}, null, 1));