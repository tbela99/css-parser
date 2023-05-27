import {ColorToken, DimensionToken, NumberToken, PercentageToken} from "../../@types";

// name to color
export const COLORS_NAMES: {[key: string]: string} = Object.seal({
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
export const NAMES_COLORS: {[key: string]: string} = Object.seal({
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


export function rgb2Hex(token: ColorToken) {

    let value = '#';
    let t: NumberToken | PercentageToken;

    // @ts-ignore
    for (let i = 0; i < 6; i += 2) {

        // @ts-ignore
        t = token.chi[i];

        if (t == null) {

            console.debug({token})
        }
        // @ts-ignore
        value += Math.round(t.typ == 'Perc' ? 255 * t.val / 100 : t.val).toString(16).padStart(2, '0')
    }

    // @ts-ignore
    if (token.chi.length == 7) {

        // @ts-ignore
        t = token.chi[6];

        // @ts-ignore
        if ((t.typ == 'Number' && t.val < 1) ||
            // @ts-ignore
            (t.typ == 'Perc' && t.val < 100)) {

            // @ts-ignore
            value += Math.round(255 * (t.typ == 'Perc' ? t.val / 100 : t.val)).toString(16).padStart(2, '0')
        }
    }

    return value;
}

export function hsl2Hex(token: ColorToken) {

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>token.chi[0]);

    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[2];
    // @ts-ignore
    let s: number = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[4];
    // @ts-ignore
    let l: number = t.typ == 'Perc' ? t.val / 100 : t.val;

    let a = null;

    if (token.chi?.length == 7) {

        // @ts-ignore
        t = token.chi[6];

        // @ts-ignore
        if ((t.typ == 'Perc' && t.val < 100) ||
            // @ts-ignore
            (t.typ == 'Number' && t.val < 1)) {

            // @ts-ignore
            a = <number>(t.typ == 'Perc' ? t.val / 100 : t.val);
        }
    }

    return `#${hsl2rgb(h, s, l, a).reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

export function hwb2hex(token: ColorToken) {

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>token.chi[0]);

    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[2];
    // @ts-ignore
    let white: number = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = <NumberToken | DimensionToken>token.chi[4];
    // @ts-ignore
    let black: number = t.typ == 'Perc' ? t.val / 100 : t.val;

    let a = null;

    if (token.chi?.length == 7) {

        // @ts-ignore
        t = token.chi[6];

        // @ts-ignore
        if ((t.typ == 'Perc' && t.val < 100) ||
            // @ts-ignore
            (t.typ == 'Number' && t.val < 1)) {

            // @ts-ignore
            a = <number>(t.typ == 'Perc' ? t.val / 100 : t.val);
        }
    }

    const rgb = hsl2rgb(h, 1, .5, a);

    let value: number;

    for (let i = 0; i < 3; i++) {

        value = rgb[i] / 255;
        value *= (1 - white - black);
        value += white;

        rgb[i] = Math.round(value * 255);
    }

    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

export function cmyk2hex(token: ColorToken) {

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>token.chi[0];

    // @ts-ignore
    const c: number = t.typ == 'Perc' ? t.val / 100 : t.val;

    // @ts-ignore
    t = <NumberToken | PercentageToken>token.chi[2];

    // @ts-ignore
    const m: number = t.typ == 'Perc' ? t.val / 100 : t.val;

    // @ts-ignore
    t = <NumberToken | PercentageToken>token.chi[4];

    // @ts-ignore
    const y: number = t.typ == 'Perc' ? t.val / 100 : t.val;

    // @ts-ignore
    t = <NumberToken | PercentageToken>token.chi[6];

    // @ts-ignore
    const k: number = t.typ == 'Perc' ? t.val / 100 : t.val;

    const rgb = [
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];

    // @ts-ignore
    if (token.chi.length >= 9) {

        // @ts-ignore
        t = <NumberToken | PercentageToken>token.chi[8];

        // @ts-ignore
        rgb.push(Math.round(255 * (t.typ == 'Perc' ? t.val / 100 : t.val)));
    }

    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

function getAngle(token: NumberToken | DimensionToken): number {

    if (token.typ == 'Dimension') {

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
    return token.val / 360
}

function hsl2rgb(h: number, s: number, l: number, a: number | null = null) {

    let v = l <= .5 ? l * (1.0 + s) : l + s - l * s;

    let r = l;
    let g = l;
    let b = l;

    if (v > 0) {

        let m = l + l - v;
        let sv = (v - m) / v;
        h *= 6.0;
        let sextant = Math.floor(h);
        let fract = h - sextant;
        let vsf = v * sv * fract;
        let mid1 = m + vsf;
        let mid2 = v - vsf;

        switch (sextant) {
            case 0:
                r = v;
                g = mid1;
                b = m;
                break;
            case 1:
                r = mid2;
                g = v;
                b = m;
                break;
            case 2:
                r = m;
                g = v;
                b = mid1;
                break;
            case 3:
                r = m;
                g = mid2;
                b = v;
                break;
            case 4:
                r = mid1;
                g = m;
                b = v;
                break;
            case 5:
                r = v;
                g = m;
                b = mid2;
                break;
        }
    }

    const values = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];

    if (a != null && a != 1) {

        values.push(Math.round(a * 255));
    }

    return values;
}