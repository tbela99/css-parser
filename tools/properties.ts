import {PropertySetType, TokenType} from "../src/@types";

function createProperties(shorthand: string, properties: string[], types: TokenType[]) {

    return Object.assign({
        [shorthand]: {
            shorthand,
            properties,
            types
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
            ['margin-top', 'margin-left', 'margin-bottom', 'margin-right'],
            ['Dimension', 'Number', 'Perc']
        ],
        [
            'padding',
            ['padding-top', 'padding-left', 'padding-bottom', 'padding-right'],
            ['Dimension', 'Number', 'Perc']
        ]
    ].reduce((acc, data) => {

        return Object.assign(acc, createProperties(...data));
    }, <PropertySetType>{});

console.debug({properties})