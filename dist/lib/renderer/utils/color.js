import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import '../sourcemap/lib/encode.js';

// name to color
const COLORS_NAMES = Object.seal({
    'aliceblue': '#f0f8ff',
    'antiquewhite': '#faebd7',
    'aqua': '#00ffff',
    'aquamarine': '#7fffd4',
    'azure': '#f0ffff',
    'beige': '#f5f5dc',
    'bisque': '#ffe4c4',
    'black': '#000000',
    'blanchedalmond': '#ffebcd',
    'blue': '#0000ff',
    'blueviolet': '#8a2be2',
    'brown': '#a52a2a',
    'burlywood': '#deb887',
    'cadetblue': '#5f9ea0',
    'chartreuse': '#7fff00',
    'chocolate': '#d2691e',
    'coral': '#ff7f50',
    'cornflowerblue': '#6495ed',
    'cornsilk': '#fff8dc',
    'crimson': '#dc143c',
    'cyan': '#00ffff',
    'darkblue': '#00008b',
    'darkcyan': '#008b8b',
    'darkgoldenrod': '#b8860b',
    'darkgray': '#a9a9a9',
    'darkgrey': '#a9a9a9',
    'darkgreen': '#006400',
    'darkkhaki': '#bdb76b',
    'darkmagenta': '#8b008b',
    'darkolivegreen': '#556b2f',
    'darkorange': '#ff8c00',
    'darkorchid': '#9932cc',
    'darkred': '#8b0000',
    'darksalmon': '#e9967a',
    'darkseagreen': '#8fbc8f',
    'darkslateblue': '#483d8b',
    'darkslategray': '#2f4f4f',
    'darkslategrey': '#2f4f4f',
    'darkturquoise': '#00ced1',
    'darkviolet': '#9400d3',
    'deeppink': '#ff1493',
    'deepskyblue': '#00bfff',
    'dimgray': '#696969',
    'dimgrey': '#696969',
    'dodgerblue': '#1e90ff',
    'firebrick': '#b22222',
    'floralwhite': '#fffaf0',
    'forestgreen': '#228b22',
    'fuchsia': '#ff00ff',
    'gainsboro': '#dcdcdc',
    'ghostwhite': '#f8f8ff',
    'gold': '#ffd700',
    'goldenrod': '#daa520',
    'gray': '#808080',
    'grey': '#808080',
    'green': '#008000',
    'greenyellow': '#adff2f',
    'honeydew': '#f0fff0',
    'hotpink': '#ff69b4',
    'indianred': '#cd5c5c',
    'indigo': '#4b0082',
    'ivory': '#fffff0',
    'khaki': '#f0e68c',
    'lavender': '#e6e6fa',
    'lavenderblush': '#fff0f5',
    'lawngreen': '#7cfc00',
    'lemonchiffon': '#fffacd',
    'lightblue': '#add8e6',
    'lightcoral': '#f08080',
    'lightcyan': '#e0ffff',
    'lightgoldenrodyellow': '#fafad2',
    'lightgray': '#d3d3d3',
    'lightgrey': '#d3d3d3',
    'lightgreen': '#90ee90',
    'lightpink': '#ffb6c1',
    'lightsalmon': '#ffa07a',
    'lightseagreen': '#20b2aa',
    'lightskyblue': '#87cefa',
    'lightslategray': '#778899',
    'lightslategrey': '#778899',
    'lightsteelblue': '#b0c4de',
    'lightyellow': '#ffffe0',
    'lime': '#00ff00',
    'limegreen': '#32cd32',
    'linen': '#faf0e6',
    'magenta': '#ff00ff',
    'maroon': '#800000',
    'mediumaquamarine': '#66cdaa',
    'mediumblue': '#0000cd',
    'mediumorchid': '#ba55d3',
    'mediumpurple': '#9370d8',
    'mediumseagreen': '#3cb371',
    'mediumslateblue': '#7b68ee',
    'mediumspringgreen': '#00fa9a',
    'mediumturquoise': '#48d1cc',
    'mediumvioletred': '#c71585',
    'midnightblue': '#191970',
    'mintcream': '#f5fffa',
    'mistyrose': '#ffe4e1',
    'moccasin': '#ffe4b5',
    'navajowhite': '#ffdead',
    'navy': '#000080',
    'oldlace': '#fdf5e6',
    'olive': '#808000',
    'olivedrab': '#6b8e23',
    'orange': '#ffa500',
    'orangered': '#ff4500',
    'orchid': '#da70d6',
    'palegoldenrod': '#eee8aa',
    'palegreen': '#98fb98',
    'paleturquoise': '#afeeee',
    'palevioletred': '#d87093',
    'papayawhip': '#ffefd5',
    'peachpuff': '#ffdab9',
    'peru': '#cd853f',
    'pink': '#ffc0cb',
    'plum': '#dda0dd',
    'powderblue': '#b0e0e6',
    'purple': '#800080',
    'red': '#ff0000',
    'rosybrown': '#bc8f8f',
    'royalblue': '#4169e1',
    'saddlebrown': '#8b4513',
    'salmon': '#fa8072',
    'sandybrown': '#f4a460',
    'seagreen': '#2e8b57',
    'seashell': '#fff5ee',
    'sienna': '#a0522d',
    'silver': '#c0c0c0',
    'skyblue': '#87ceeb',
    'slateblue': '#6a5acd',
    'slategray': '#708090',
    'slategrey': '#708090',
    'snow': '#fffafa',
    'springgreen': '#00ff7f',
    'steelblue': '#4682b4',
    'tan': '#d2b48c',
    'teal': '#008080',
    'thistle': '#d8bfd8',
    'tomato': '#ff6347',
    'turquoise': '#40e0d0',
    'violet': '#ee82ee',
    'wheat': '#f5deb3',
    'white': '#ffffff',
    'whitesmoke': '#f5f5f5',
    'yellow': '#ffff00',
    'yellowgreen': '#9acd32',
    'rebeccapurple': '#663399',
    'transparent': '#00000000'
});
// color to name
const NAMES_COLORS = Object.seal({
    '#f0f8ff': 'aliceblue',
    '#faebd7': 'antiquewhite',
    // '#00ffff': 'aqua',
    '#7fffd4': 'aquamarine',
    '#f0ffff': 'azure',
    '#f5f5dc': 'beige',
    '#ffe4c4': 'bisque',
    '#000000': 'black',
    '#ffebcd': 'blanchedalmond',
    '#0000ff': 'blue',
    '#8a2be2': 'blueviolet',
    '#a52a2a': 'brown',
    '#deb887': 'burlywood',
    '#5f9ea0': 'cadetblue',
    '#7fff00': 'chartreuse',
    '#d2691e': 'chocolate',
    '#ff7f50': 'coral',
    '#6495ed': 'cornflowerblue',
    '#fff8dc': 'cornsilk',
    '#dc143c': 'crimson',
    '#00ffff': 'cyan',
    '#00008b': 'darkblue',
    '#008b8b': 'darkcyan',
    '#b8860b': 'darkgoldenrod',
    // '#a9a9a9': 'darkgray',
    '#a9a9a9': 'darkgrey',
    '#006400': 'darkgreen',
    '#bdb76b': 'darkkhaki',
    '#8b008b': 'darkmagenta',
    '#556b2f': 'darkolivegreen',
    '#ff8c00': 'darkorange',
    '#9932cc': 'darkorchid',
    '#8b0000': 'darkred',
    '#e9967a': 'darksalmon',
    '#8fbc8f': 'darkseagreen',
    '#483d8b': 'darkslateblue',
    // '#2f4f4f': 'darkslategray',
    '#2f4f4f': 'darkslategrey',
    '#00ced1': 'darkturquoise',
    '#9400d3': 'darkviolet',
    '#ff1493': 'deeppink',
    '#00bfff': 'deepskyblue',
    // '#696969': 'dimgray',
    '#696969': 'dimgrey',
    '#1e90ff': 'dodgerblue',
    '#b22222': 'firebrick',
    '#fffaf0': 'floralwhite',
    '#228b22': 'forestgreen',
    // '#ff00ff': 'fuchsia',
    '#dcdcdc': 'gainsboro',
    '#f8f8ff': 'ghostwhite',
    '#ffd700': 'gold',
    '#daa520': 'goldenrod',
    //    '#808080': 'gray',
    '#808080': 'grey',
    '#008000': 'green',
    '#adff2f': 'greenyellow',
    '#f0fff0': 'honeydew',
    '#ff69b4': 'hotpink',
    '#cd5c5c': 'indianred',
    '#4b0082': 'indigo',
    '#fffff0': 'ivory',
    '#f0e68c': 'khaki',
    '#e6e6fa': 'lavender',
    '#fff0f5': 'lavenderblush',
    '#7cfc00': 'lawngreen',
    '#fffacd': 'lemonchiffon',
    '#add8e6': 'lightblue',
    '#f08080': 'lightcoral',
    '#e0ffff': 'lightcyan',
    '#fafad2': 'lightgoldenrodyellow',
    // '#d3d3d3': 'lightgray',
    '#d3d3d3': 'lightgrey',
    '#90ee90': 'lightgreen',
    '#ffb6c1': 'lightpink',
    '#ffa07a': 'lightsalmon',
    '#20b2aa': 'lightseagreen',
    '#87cefa': 'lightskyblue',
    // '#778899': 'lightslategray',
    '#778899': 'lightslategrey',
    '#b0c4de': 'lightsteelblue',
    '#ffffe0': 'lightyellow',
    '#00ff00': 'lime',
    '#32cd32': 'limegreen',
    '#faf0e6': 'linen',
    '#ff00ff': 'magenta',
    '#800000': 'maroon',
    '#66cdaa': 'mediumaquamarine',
    '#0000cd': 'mediumblue',
    '#ba55d3': 'mediumorchid',
    '#9370d8': 'mediumpurple',
    '#3cb371': 'mediumseagreen',
    '#7b68ee': 'mediumslateblue',
    '#00fa9a': 'mediumspringgreen',
    '#48d1cc': 'mediumturquoise',
    '#c71585': 'mediumvioletred',
    '#191970': 'midnightblue',
    '#f5fffa': 'mintcream',
    '#ffe4e1': 'mistyrose',
    '#ffe4b5': 'moccasin',
    '#ffdead': 'navajowhite',
    '#000080': 'navy',
    '#fdf5e6': 'oldlace',
    '#808000': 'olive',
    '#6b8e23': 'olivedrab',
    '#ffa500': 'orange',
    '#ff4500': 'orangered',
    '#da70d6': 'orchid',
    '#eee8aa': 'palegoldenrod',
    '#98fb98': 'palegreen',
    '#afeeee': 'paleturquoise',
    '#d87093': 'palevioletred',
    '#ffefd5': 'papayawhip',
    '#ffdab9': 'peachpuff',
    '#cd853f': 'peru',
    '#ffc0cb': 'pink',
    '#dda0dd': 'plum',
    '#b0e0e6': 'powderblue',
    '#800080': 'purple',
    '#ff0000': 'red',
    '#bc8f8f': 'rosybrown',
    '#4169e1': 'royalblue',
    '#8b4513': 'saddlebrown',
    '#fa8072': 'salmon',
    '#f4a460': 'sandybrown',
    '#2e8b57': 'seagreen',
    '#fff5ee': 'seashell',
    '#a0522d': 'sienna',
    '#c0c0c0': 'silver',
    '#87ceeb': 'skyblue',
    '#6a5acd': 'slateblue',
    // '#708090': 'slategray',
    '#708090': 'slategrey',
    '#fffafa': 'snow',
    '#00ff7f': 'springgreen',
    '#4682b4': 'steelblue',
    '#d2b48c': 'tan',
    '#008080': 'teal',
    '#d8bfd8': 'thistle',
    '#ff6347': 'tomato',
    '#40e0d0': 'turquoise',
    '#ee82ee': 'violet',
    '#f5deb3': 'wheat',
    '#ffffff': 'white',
    '#f5f5f5': 'whitesmoke',
    '#ffff00': 'yellow',
    '#9acd32': 'yellowgreen',
    '#663399': 'rebeccapurple',
    '#00000000': 'transparent'
});
/**
 * clamp color values
 * @param token
 */
function clamp(token) {
    if (token.kin == 'rgb' || token.kin == 'rgba') {
        token.chi.filter((token) => ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(token.typ)).
            forEach((token, index) => {
            if (index <= 2) {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(Math.min(255, Math.max(0, +token.val)));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(Math.min(100, Math.max(0, +token.val)));
                }
            }
            else {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(Math.min(1, Math.max(0, +token.val)));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(Math.min(100, Math.max(0, +token.val)));
                }
            }
        });
    }
    return token;
}
function getNumber(token) {
    if (token.typ == EnumToken.IdenTokenType && token.val == 'none') {
        return 0;
    }
    // @ts-ignore
    return token.typ == EnumToken.PercentageTokenType ? token.val / 100 : +token.val;
}
function getAngle(token) {
    if (token.typ == EnumToken.IdenTokenType) {
        if (token.val == 'none') {
            return 0;
        }
    }
    if (token.typ == EnumToken.AngleTokenType) {
        switch (token.unit) {
            case 'deg':
                // @ts-ignore
                return token.val / 360;
            case 'rad':
                // @ts-ignore
                return token.val / (2 * Math.PI);
            case 'grad':
                // @ts-ignore
                return token.val / 400;
            case 'turn':
                // @ts-ignore
                return +token.val;
        }
    }
    // @ts-ignore
    return token.val / 360;
}

export { COLORS_NAMES, NAMES_COLORS, clamp, getAngle, getNumber };
