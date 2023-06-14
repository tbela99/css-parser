import {PropertySetType, ShorthandMapType, TokenType, ShorthandType, ShorthandPropertyType} from "../src/@types";

function createProperties(data: ShorthandPropertyType) {

    return {
        [data.shorthand]: {...data}, ...data.properties.reduce((acc, property: string) => {

            return Object.assign(acc, {
                [property]: {

                    shorthand: data.shorthand
                }
            });
        }, <PropertySetType>{}),
    }
}

function createMap(shorthand: string, pattern: string, keywords: string, defaults: string[], fields: Array<ShorthandType>) {

    return fields.reduce((acc, curr: ShorthandType) => {

        // if (Object.keys(curr.properties).length > 0) {

        Object.assign(acc[shorthand].properties, {
            [curr.shorthand]: {...(<ShorthandType>curr).properties}
        });
        // }

        return Object.assign(acc, {

            [curr.shorthand]: {
                shorthand
            }
        });
    }, {
        [shorthand]: {

            shorthand,
            pattern,
            keywords,
            default: defaults,
            properties: {}
        }
    })
}

// @ts-ignore
export const map: ShorthandMapType = [
    ['outline', 'outline-color outline-style outline-width', ['none'], ['0', 'none'],
        [
            {
                shorthand: 'outline-color',
                properties: {
                    types: ['Color'],
                    default: ['currentColor', 'invert'],
                    keywords: ['currentColor', 'invert'],
                }
            },
            {
                shorthand: 'outline-style',
                properties: {
                    types: [],
                    default: ['none'],
                    keywords: ['auto', 'none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
                }
            },
            {
                shorthand: 'outline-width',
                properties: {
                    types: ['Length', 'Perc'],
                    default: ['medium'],
                    keywords: ['thin', 'medium', 'thick']
                }
            }
        ]
    ],
    ['font', 'font-weight font-style font-size line-height font-stretch font-variant font-family', ['caption', 'icon', 'menu', 'message-box', 'small-caption', 'status-bar', '-moz-window, ', '-moz-document, ', '-moz-desktop, ', '-moz-info, ', '-moz-dialog', '-moz-button', '-moz-pull-down-menu', '-moz-list', '-moz-field'], [],
        [
            {
                shorthand: 'font-weight',
                properties: {
                    types: ['Number'],
                    default: [],
                    keywords: ['normal', 'bold', 'lighter', 'bolder'],
                    constraints: {
                        number: {
                            min: '1', max: '1000'
                        }
                    },
                    mapping: {
                        thin: '100',
                        hairline: '100',
                        'extra light': '200',
                        'ultra light': '200',
                        'light': '300',
                        'normal': '400',
                        regular: '400',
                        'medium': '500',
                        'semi bold': '600',
                        'demi bold': '600',
                        'bold': '700',
                        'extra bold': '800',
                        'ultra bold': '800',
                        'black': '900',
                        'heavy': '900',
                        'extra black': '950',
                        'ultra black': '950'
                    }
                }
            },
            {
                shorthand: 'font-style',
                properties: {
                    types: ['Angle'],
                    default: [],
                    keywords: ['normal', 'italic', 'oblique'],
                    mapping: ['oblique', {type: 'angle'}]
                }
            },
            {
                shorthand: 'font-size',
                properties: {
                    types: ['Length', 'Perc'],
                    default: [],
                    keywords: ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large', 'larger', 'smaller'],
                    required: true
                }
            },
            {
                shorthand: 'line-height',
                properties: {
                    types: ['Length', 'Perc', 'Number'],
                    default: [],
                    keywords: ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large', 'larger', 'smaller'],
                    prefix: {
                        typ: 'Literal',
                        val: '/'
                    }
                }
            },
            {
                shorthand: 'font-stretch',
                properties: {
                    types: ['Perc'],
                    default: [],
                    keywords: ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large', 'larger', 'smaller'],
                    mapping: {
                        'ultra-condensed': '50%',
                        'extra-condensed': '62.5%',
                        'condensed': '75%',
                        'semi-condensed': '87.5%',
                        'normal': '100%',
                        'semi-expanded': '112.5%',
                        'expanded': '125%',
                        'extra-expanded': '150%',
                        'ultra-expanded': '200%'
                    }
                }
            },
            {
                shorthand: 'font-variant',
                properties: {
                    types: [],
                    default: [],
                    keywords: ['normal', 'none', 'common-ligatures', 'no-common-ligatures', 'discretionary-ligatures', 'no-discretionary-ligatures', 'historical-ligatures', 'no-historical-ligatures', 'contextual', 'no-contextual', 'historical-forms', 'small-caps', 'all-small-caps', 'petite-caps', 'all-petite-caps', 'unicase', 'titling-caps', 'ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions', 'ordinal', 'slashed-zero', 'ruby', 'jis78', 'jis83', 'jis90', 'jis04', 'simplified', 'traditional', 'full-width', 'proportional-width', 'ruby', 'sub', 'super', 'text', 'emoji', 'unicode']
                }
            },
            {
                shorthand: 'font-family',
                properties: {
                    types: ['String', 'Iden'],
                    default: [],
                    keywords: [],
                    required: true,
                    multiple: true,
                    separator: {
                        typ: 'Comma'
                    }
                }
            }
        ]
    ],
    ['background', 'background-repeat background-color background-image background-attachment background-clip background-origin background-position background-size', ['none'], [],
        [
            {
                shorthand: 'background-repeat',
                properties: {
                    types: [],
                    default: [],
                    multiple: true,
                    keywords: ['repeat-x', 'repeat-y', 'repeat', 'space', 'round', 'no-repeat'],
                    mapping: {
                        'repeat no-repeat': 'repeat-x',
                        'no-repeat repeat': 'repeat-y',
                        'repeat repeat': 'repeat',
                        'space space': 'space',
                        'round round': 'round',
                        'no-repeat no-repeat': 'no-repeat'
                    }
                }
            },
            {
                shorthand: 'background-color',
                properties: {
                    types: ['Color'],
                    default: ['transparent'],
                    keywords: []
                }
            },
            {
                shorthand: 'background-image',
                properties: {
                    types: ['UrlFunc'],
                    default: [],
                    keywords: ['none']
                }
            },
            {
                shorthand: 'background-attachment',
                properties: {
                    types: [],
                    default: [],
                    keywords: ['scroll', 'fixed', 'local']
                }
            },
            {
                shorthand: 'background-clip',
                properties: {
                    types: [],
                    default: [],
                    keywords: ['border-box', 'padding-box', 'content-box', 'text']
                }
            },
            {
                shorthand: 'background-origin',
                properties: {
                    types: [],
                    default: [],
                    keywords: ['border-box', 'padding-box', 'content-box']
                }
            },
            {
                shorthand: 'background-position',
                properties: {
                    multiple: true,
                    types: ['Perc', 'Length'],
                    default: [{typ: 'Perc', val: 50}],
                    keywords: ['top', 'left', 'center', 'bottom', 'right'],
                    mapping: {
                        left: '0',
                        top: '0',
                        center: '50%',
                        bottom: '100%',
                        'right': '100%'
                    }
                }
            },
            {
                shorthand: 'background-size',
                properties: {
                    types: ['Perc', 'Length'],
                    default: ['50%', 'middle'],
                    keywords: ['auto'],
                    mapping: {
                        'auto auto': 'auto',
                        'top': '0',
                        'left': '0',
                        'bottom': '100%',
                        'right': '100%',
                        'middle': '50%'
                    }
                }
            }
        ]
    ]
    // @ts-ignore
].reduce((acc: ShorthandMapType, data) => Object.assign(acc, createMap(...data)), <ShorthandMapType>{});

/*


            shorthand,
            properties,
            types,
            multiple,
            separator: separator == undefined ? null : separator,
            keywords
 */
export const properties: PropertySetType = [
    {
        shorthand: 'inset',
        properties: ['top', 'right', 'bottom', 'left'],
        types: ['Length', 'Perc'],
        multiple: false,
        separator: null,
        keywords: ['auto']
    },
    {
        shorthand: 'margin',
        properties: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
        types: ['Length', 'Perc'],
        multiple: false,
        separator: null,
        keywords: ['auto']
    },
    {
        shorthand: 'padding',
        properties: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
        types: ['Length', 'Perc'],
        // multiple: false,
        // separator:null ,
        keywords: []
    },
    {
        shorthand: 'border-radius',
        properties: ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
        types: ['Length', 'Perc'],
        multiple: true,
        separator: '/',
        keywords: []
    },
    {
        shorthand: 'border-width',
        properties: [
            'border-top-width',
            'border-right-width',
            'border-bottom-width',
            'border-left-width'
        ],
        types: ['Length', 'Perc'],
        // multiple: false,
        // separator: null,
        keywords: ['thin', 'medium', 'thick']
    },
    {
        shorthand: 'border-style',
        properties: ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
        types: [],
        // multiple: false,
        // separator: null,
        keywords: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
    },
    {
        shorthand: 'border-color',
        properties: ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
        types: ['Color'],
        // multiple: false,
        // separator: null,
        keywords: []
    }
].reduce((acc: PropertySetType, data) => {

    return Object.assign(acc, createProperties(<ShorthandPropertyType>data));
}, <PropertySetType>{});

console.debug(JSON.stringify({properties, map}, null, 1));