import {
    PropertySetType,
    ShorthandMapType,
    ShorthandType,
    ShorthandPropertyType,
    ShorthandDef, PropertyMapType
} from "../src/@types";

function createProperties(data: ShorthandPropertyType) {

    const map: string = <string>data.map;
    return {
        [data.shorthand]: {...data}, ...data.properties.reduce((acc, property: string) => {


            return Object.assign(acc, {
                [property]: {
                    map,
                    shorthand: data.shorthand
                }
            });
        }, <PropertySetType>{})
    }
}

function createMap(data: ShorthandDef, fields: Array<ShorthandType>) {

    return fields.reduce((acc, curr: ShorthandType) => {

        Object.assign(acc[data.shorthand].properties, {
            [curr.shorthand]: {...(<ShorthandType>curr).properties}
        });

        return Object.assign(acc, {

            [curr.shorthand]: {
                shorthand: data.shorthand
            }
        });
    }, {
        [data.shorthand]: {
            ...data,
            properties: {}
        }
    })
}

export const map: ShorthandMapType = (<ShorthandMapType[][]>[

    [
        {
            shorthand: 'transition',
            multiple: true,
            separator: ',',
            pattern: 'transition-property transition-duration transition-timing-function transition-delay transition-behavior',
            keywords: ['none', 'all'],
            default: ['0s', '0ms', 'all', 'ease', 'none', 'normal'],
        },
        [
            {
                shorthand: 'transition-property',
                properties: {

                    keywords: ['none', 'all'],
                    default: [],
                    types: ['Iden']
                }
            },
            {
                shorthand: 'transition-duration',
                properties: {

                    keywords: [],
                    default: ['0s', '0ms', 'normal'],
                    types: ['Time']
                }
            },
            {
                shorthand: 'transition-timing-function',
                properties: {

                    keywords: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'],
                    default: ['ease'],
                    types: ['TimingFunction'],
                    mapping: {
                        'cubic-bezier(.25,.1,.25,1)': 'ease',
                        'cubic-bezier(0,0,1,1)': 'linear',
                        'cubic-bezier(.42,0,1,1)': 'ease-in',
                        'cubic-bezier(0,0,.58,1)': 'ease-out',
                        'cubic-bezier(.42,0,.58,.42)': 'ease-in-out'
                    }
                }
            },
            {
                shorthand: 'transition-delay',
                properties: {

                    keywords: [],
                    default: ['0s'],
                    types: ['Time']
                }
            },
            {
                shorthand: 'transition-behavior',
                properties: {

                    keywords: ['normal', 'allow-discrete'],
                    default: ['normal'],
                    types: []
                }
            }
        ]
    ],
    [
        {
            shorthand: 'animation',
            pattern: 'animation-name animation-duration animation-timing-function animation-delay animation-iteration-count animation-direction animation-fill-mode animation-play-state animation-timeline',
            default: ['1', '0s', '0ms', 'none', 'ease', 'normal', 'running', 'auto']
        },
        [
            {
                shorthand: 'animation-name',
                properties: {

                    keywords: ['none'],
                    default: ['none'],
                    types: ['Iden']
                }
            },
            {
                shorthand: 'animation-duration',
                properties: {
                    keywords: ['auto'],
                    default: ['0s', '0ms', 'auto'],
                    types: ['Time'],
                    mapping: {
                        'auto': '0s'
                    }
                }
            },
            {
                shorthand: 'animation-timing-function',
                properties: {
                    keywords: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'],
                    default: ['ease'],
                    types: ['TimingFunction'],
                    mapping: {
                        'cubic-bezier(.25,.1,.25,1)': 'ease',
                        'cubic-bezier(0,0,1,1)': 'linear',
                        'cubic-bezier(.42,0,1,1)': 'ease-in',
                        'cubic-bezier(0,0,.58,1)': 'ease-out',
                        'cubic-bezier(.42,0,.58,.42)': 'ease-in-out'
                    }
                }
            },
            {
                shorthand: 'animation-delay',
                properties: {
                    keywords: [],
                    default: ['0s', '0ms'],
                    types: ['Time']
                }
            },
            {
                shorthand: 'animation-iteration-count',
                properties: {
                    keywords: ['infinite'],
                    default: ['1'],
                    types: ['Number']
                }
            },
            {
                shorthand: 'animation-direction',
                properties: {
                    keywords: ['normal', 'reverse', 'alternate', 'alternate-reverse'],
                    default: ['normal'],
                    types: []
                }
            },
            {
                shorthand: 'animation-fill-mode',
                properties: {
                    keywords: ['none', 'forwards', 'backwards', 'both'],
                    default: ['none'],
                    types: []
                }
            },
            {
                shorthand: 'animation-play-state',
                properties: {
                    keywords: ['running', 'paused'],
                    default: ['running'],
                    types: []
                }
            },
            {
                shorthand: 'animation-timeline',
                properties: {
                    keywords: ['none', 'auto'],
                    default: ['auto'],
                    types: ['DashedIden', 'TimelineFunction']
                }
            }
        ]
    ],
    [
        {
            shorthand: 'text-emphasis',
            pattern: 'text-emphasis-color text-emphasis-style',
            default: ['none', 'currentcolor']
        },
        [
            {
                shorthand: 'text-emphasis-style',
                properties: {

                    keywords: ['none', 'filled', 'open', 'dot', 'circle', 'double-circle', 'triangle', 'sesame'],
                    default: ['none'],
                    types: ['String']
                }
            },
            {
                shorthand: 'text-emphasis-color',
                properties: {
                    default: ['currentcolor'],
                    types: ['Color']
                }
            }
        ]
    ],
    [
        {
            shorthand: 'border',
            pattern: 'border-color border-style border-width',
            keywords: ['none'],
            default: ['0', 'none']
        },
        [
            {
                shorthand: 'border-color',
                properties: {}
            },
            {
                shorthand: 'border-style',
                properties: {}
            },
            {
                shorthand: 'border-width',
                properties: {}
            }
        ]
    ],
    [
        {
            shorthand: 'list-style',
            pattern: 'list-style-type list-style-position list-style-image',
            keywords: ['none', 'outside'],
            default: ['none', 'outside']
        },
        [
            {
                shorthand: 'list-style-position',
                properties: {
                    types: [],
                    default: ['outside'],
                    keywords: ['inside', 'outside'],
                }
            },
            {
                shorthand: 'list-style-image',
                properties: {
                    default: ['none'],
                    keywords: ['node'],
                    types: ['UrlFunc', 'ImageFunc']
                }
            },
            {
                shorthand: 'list-style-type',
                properties:
                    {
                        types: ['String', 'Iden', 'Symbols'],
                        default: ['disc'],
                        keywords: ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-greek', 'lower-latin', 'upper-latin', 'none']
                    }
            }
        ]
    ],

    [
        {
            shorthand: 'overflow',
            pattern: 'overflow-x overflow-y',
            keywords: ['auto', 'visible', 'hidden', 'clip', 'scroll'],
            default: [],
            mapping: {
                'visible visible': 'visible',
                'auto auto': 'auto',
                'hidden hidden': 'hidden',
                'scroll scroll': 'scroll'
            }
        },
        [
            {
                shorthand: 'overflow-x',
                properties: {

                    default: [],
                    keywords: ['auto', 'visible', 'hidden', 'clip', 'scroll']
                }
            },
            {
                shorthand: 'overflow-y',
                properties: {
                    default: [],
                    keywords: ['auto', 'visible', 'hidden', 'clip', 'scroll']
                }
            }
        ]
    ],
    [
        {
            shorthand: 'outline',
            pattern: 'outline-color outline-style outline-width',
            keywords: ['none'],
            default: ['0', 'none', 'currentcolor']
        },
        [
            {
                shorthand: 'outline-color',
                properties: {
                    types: ['Color'],
                    default: ['currentcolor'],
                    keywords: ['currentcolor'],
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
    [
        {
            shorthand: 'font',
            pattern: 'font-weight font-style font-size line-height font-stretch font-variant font-family',
            keywords: ['caption', 'icon', 'menu', 'message-box', 'small-caption', 'status-bar', '-moz-window, ', '-moz-document, ', '-moz-desktop, ', '-moz-info, ', '-moz-dialog', '-moz-button', '-moz-pull-down-menu', '-moz-list', '-moz-field'],
            default: []
        },
        [
            {
                shorthand: 'font-weight',
                properties: {
                    types: ['Number'],
                    default: ['normal', '400'],
                    keywords: ['normal', 'bold', 'lighter', 'bolder'],
                    constraints: {
                        value: {
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
                    default: ['normal'],
                    keywords: ['normal', 'italic', 'oblique']
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
                    default: ['normal'],
                    keywords: ['normal'],
                    previous: 'font-size',
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
                    default: ['normal'],
                    keywords: ['ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'],
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
                    default: ['normal'],
                    keywords: ['normal', 'none', 'common-ligatures', 'no-common-ligatures', 'discretionary-ligatures', 'no-discretionary-ligatures', 'historical-ligatures', 'no-historical-ligatures', 'contextual', 'no-contextual', 'historical-forms', 'small-caps', 'all-small-caps', 'petite-caps', 'all-petite-caps', 'unicase', 'titling-caps', 'ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions', 'ordinal', 'slashed-zero', 'ruby', 'jis78', 'jis83', 'jis90', 'jis04', 'simplified', 'traditional', 'full-width', 'proportional-width', 'ruby', 'sub', 'super', 'text', 'emoji', 'unicode']
                }
            },
            {
                shorthand: 'font-family',
                properties: {
                    types: ['String', 'Iden'],
                    default: [],
                    keywords: ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong'],
                    required: true,
                    multiple: true,
                    separator: {
                        typ: 'Comma'
                    }
                }
            }
        ]
    ],
    [
        {
            shorthand: 'background',
            pattern: 'background-repeat background-color background-image background-attachment background-clip background-origin background-position background-size',
            keywords: ['none'],
            default: [],
            multiple: true,
            separator: {typ: 'Comma'}
        },
        [
            {
                shorthand: 'background-repeat',
                properties: {
                    types: [],
                    default: ['repeat'],
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
                    multiple: true,
                    keywords: []
                }
            },
            {
                shorthand: 'background-image',
                properties: {
                    types: ['UrlFunc', 'ImageFunc'],
                    default: ['none'],
                    keywords: ['none']
                }
            },
            {
                shorthand: 'background-attachment',
                properties: {
                    types: [],
                    default: ['scroll'],
                    multiple: true,
                    keywords: ['scroll', 'fixed', 'local']
                }
            },
            {
                shorthand: 'background-clip',
                properties: {
                    types: [],
                    default: ['border-box'],
                    multiple: true,
                    keywords: ['border-box', 'padding-box', 'content-box', 'text']
                }
            },
            {
                shorthand: 'background-origin',
                properties: {
                    types: [],
                    default: ['padding-box'],
                    multiple: true,
                    keywords: ['border-box', 'padding-box', 'content-box']
                }
            },
            {
                shorthand: 'background-position',
                properties: {
                    multiple: true,
                    types: ['Perc', 'Length'],
                    default: ['0 0', 'top left', 'left top'],
                    keywords: ['top', 'left', 'center', 'bottom', 'right'],
                    mapping: {
                        left: '0',
                        top: '0',
                        center: '50%',
                        bottom: '100%',
                        'right': '100%'
                    },
                    constraints: {
                        mapping: {
                            max: 2
                        }
                    }
                }
            },
            {
                shorthand: 'background-size',
                properties: {
                    multiple: true,
                    previous: 'background-position',
                    prefix: {typ: 'Literal', val: '/'},
                    types: ['Perc', 'Length'],
                    default: ['auto', 'auto auto'],
                    keywords: ['auto', 'cover', 'contain'],
                    mapping: {
                        'auto auto': 'auto'
                    }
                }
            }
        ]
    ]
    // @ts-ignore
]).reduce((acc: ShorthandMapType, data) => Object.assign(acc, createMap(...data)), <ShorthandMapType>{});

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
        map: 'border',
        properties: [
            'border-top-width',
            'border-right-width',
            'border-bottom-width',
            'border-left-width'
        ],
        types: ['Length', 'Perc'],
        // multiple: false,
        // separator: null,
        default: ['medium'],
        keywords: ['thin', 'medium', 'thick']
    },
    {
        shorthand: 'border-style',
        map: 'border',
        properties: ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
        types: [],
        // multiple: false,
        // separator: null,
        default: ['none'],
        keywords: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
    },
    {
        shorthand: 'border-color',
        map: 'border',
        properties: ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
        types: ['Color'],
        // multiple: false,
        // separator: null,
        default: ['currentcolor'],
        keywords: []
    }
].reduce((acc: PropertySetType, data) => {

    if (data.map) {

        // console.debug({data});

        // @ts-ignore
        (<PropertyMapType>map[data.map].properties[data.shorthand]).types = data.types;
        // @ts-ignore
        (<PropertyMapType>map[data.map].properties[data.shorthand]).default = data.default;
        // @ts-ignore
        (<PropertyMapType>map[data.map].properties[data.shorthand]).keywords = data.keywords;

        // @ts-ignore
        // (<PropertyMapType>map[data.shorthand]).types = data.types;
        // @ts-ignore
        // (<PropertyMapType>map[data.shorthand]).keywords = data.keywords;

    }

    return Object.assign(acc, createProperties(<ShorthandPropertyType>data));
}, <PropertySetType>{});

console.debug(JSON.stringify({properties, map}, null, 1));