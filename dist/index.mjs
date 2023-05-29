// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
// export const num = `(((\\+|-)?(?=\\d*[.eE])([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE](\\+|-)?[0-9]+)?)|(\\d+|(\\d*\\.\\d+)))`;
// export const nl = `\n|\r\n|\r|\f`;
// export const nonascii = `[^\u{0}-\u{0ed}]`;
// export const unicode = `\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?`;
// export const escape = `(${unicode})|(\\[^\n\r\f0-9a-f])`;
// export const nmstart = `[_a-z]|${nonascii}|${escape}`;
// export const nmchar = `[_a-z0-9-]|${nonascii}|${escape}`
// export const ident = `[-]{0,2}(${nmstart})(${nmchar})*`;
// export const string1 	= `\"([^\n\r\f\\"]|\\${nl}|${escape})*\"`;
// export const string2 =	`\'([^\n\r\f\\']|\\${nl}|${escape})*\'`;
// export const string =	`(${string1})|(${string2})`;
//
// const name = `${nmchar}+`;
// const hash = `#${name}`;
// '\\'
const REVERSE_SOLIDUS = 0x5c;
function isLetter(codepoint) {
    // lowercase
    return (codepoint >= 0x61 && codepoint <= 0x7a) ||
        // uppercase
        (codepoint >= 0x41 && codepoint <= 0x5a);
}
function isNonAscii(codepoint) {
    return codepoint >= 0x80;
}
function isIdentStart(codepoint) {
    // _
    return codepoint == 0x5f || isLetter(codepoint) || isNonAscii(codepoint);
}
function isDigit(codepoint) {
    return codepoint >= 0x30 && codepoint <= 0x39;
}
function isIdentCodepoint(codepoint) {
    // -
    return codepoint == 0x2d || isDigit(codepoint) || isIdentStart(codepoint);
}
function isIdent(name) {
    const j = name.length - 1;
    let i = 0;
    let codepoint = name.codePointAt(0);
    // -
    if (codepoint == 0x2d) {
        const nextCodepoint = name.codePointAt(1);
        if (nextCodepoint == null) {
            return false;
        }
        // -
        if (nextCodepoint == 0x2d) {
            return true;
        }
        if (nextCodepoint == REVERSE_SOLIDUS) {
            return name.length > 2 && !isNewLine(name.codePointAt(2));
        }
        return true;
    }
    if (!isIdentStart(codepoint)) {
        return false;
    }
    while (i < j) {
        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = name.codePointAt(i);
        if (!isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
}
function isPseudo(name) {
    if (name.charAt(0) != ':') {
        return false;
    }
    if (name.endsWith('(')) {
        return isIdent(name.charAt(1) == ':' ? name.slice(2, -1) : name.slice(1, -1));
    }
    return isIdent(name.charAt(1) == ':' ? name.slice(2) : name.slice(1));
}
function isHash(name) {
    if (name.charAt(0) != '#') {
        return false;
    }
    if (isIdent(name.charAt(1))) {
        return true;
    }
    return true;
}
function isNumber(name) {
    if (name.length == 0) {
        return false;
    }
    let codepoint = name.codePointAt(0);
    let i = 0;
    const j = name.length;
    // '+' '-'
    if ([0x2b, 0x2d].includes(codepoint)) {
        i++;
    }
    // consume digits
    while (i < j) {
        codepoint = name.codePointAt(i);
        if (isDigit(codepoint)) {
            i++;
            continue;
        }
        // '.' 'E' 'e'
        if (codepoint == 0x2e || codepoint == 0x45 || codepoint == 0x65) {
            break;
        }
        return false;
    }
    // '.'
    if (codepoint == 0x2e) {
        if (!isDigit(name.codePointAt(++i))) {
            return false;
        }
    }
    while (++i < j) {
        codepoint = name.codePointAt(i);
        if (isDigit(codepoint)) {
            continue;
        }
        // 'E' 'e'
        if (codepoint == 0x45 || codepoint == 0x65) {
            break;
        }
        return false;
    }
    // 'E' 'e'
    if (codepoint == 0x45 || codepoint == 0x65) {
        if (i == j) {
            return false;
        }
        codepoint = name.codePointAt(i + 1);
        // '+' '-'
        if ([0x2b, 0x2d].includes(codepoint)) {
            i++;
        }
        codepoint = name.codePointAt(i + 1);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    while (++i < j) {
        codepoint = name.codePointAt(i);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    return true;
}
function isDimension(name) {
    let index = 0;
    while (index++ < name.length) {
        if (isDigit(name.codePointAt(name.length - index))) {
            index--;
            break;
        }
        if (index == 3) {
            break;
        }
    }
    if (index == 0 || index > 3) {
        return false;
    }
    const number = name.slice(0, -index);
    return number.length > 0 && isIdentStart(name.codePointAt(name.length - index)) && isNumber(number);
}
function isPercentage(name) {
    return name.endsWith('%') && isNumber(name.slice(0, -1));
}
function parseDimension(name) {
    let index = 0;
    while (index++ < name.length) {
        if (isDigit(name.codePointAt(name.length - index))) {
            index--;
            break;
        }
        if (index == 3) {
            break;
        }
    }
    return { typ: 'Dimension', val: name.slice(0, -index), unit: name.slice(-index) };
}
function isHexColor(name) {
    if (name.charAt(0) != '#' || ![4, 5, 7, 9].includes(name.length)) {
        return false;
    }
    for (let chr of name.slice(1)) {
        let codepoint = chr.codePointAt(0);
        if (!isDigit(codepoint) &&
            // A-F
            !(codepoint >= 0x41 && codepoint <= 0x46) &&
            // a-f
            !(codepoint >= 0x61 && codepoint <= 0x66)) {
            return false;
        }
    }
    return true;
}
function isFunction(name) {
    return name.endsWith('(') && isIdent(name.slice(0, -1));
}
function isAtKeyword(name) {
    return name.codePointAt(0) == 0x40 && isIdent(name.slice(1));
}
function isNewLine(codepoint) {
    // \n \r \f
    return codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}
function isWhiteSpace(codepoint) {
    return codepoint == 0x9 || codepoint == 0x20 || isNewLine(codepoint);
}

function update(location, css) {
    if (css === '') {
        return location;
    }
    let i = 0;
    let codepoint;
    let offset;
    const j = css.length - 1;
    if (location.lin == 0) {
        location.lin = 1;
    }
    while (i <= j) {
        codepoint = css.codePointAt(i);
        offset = codepoint < 256 ? 1 : String.fromCodePoint(codepoint).length;
        if (isNewLine(codepoint)) {
            location.lin++;
            location.col = 0;
            // \r\n
            if (codepoint == 0xd && css.codePointAt(i + 1) == 0xa) {
                offset++;
                location.ind++;
            }
        }
        else {
            location.col++;
        }
        location.ind++;
        i += offset;
    }
    return location;
}

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
function rgb2Hex(token) {
    let value = '#';
    let t;
    // @ts-ignore
    for (let i = 0; i < 6; i += 2) {
        // @ts-ignore
        t = token.chi[i];
        if (t == null) {
            console.debug({ token });
        }
        // @ts-ignore
        value += Math.round(t.typ == 'Perc' ? 255 * t.val / 100 : t.val).toString(16).padStart(2, '0');
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
            value += Math.round(255 * (t.typ == 'Perc' ? t.val / 100 : t.val)).toString(16).padStart(2, '0');
        }
    }
    return value;
}
function hsl2Hex(token) {
    let t;
    // @ts-ignore
    let h = getAngle(token.chi[0]);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    let s = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = token.chi[4];
    // @ts-ignore
    let l = t.typ == 'Perc' ? t.val / 100 : t.val;
    let a = null;
    if (token.chi?.length == 7) {
        // @ts-ignore
        t = token.chi[6];
        // @ts-ignore
        if ((t.typ == 'Perc' && t.val < 100) ||
            // @ts-ignore
            (t.typ == 'Number' && t.val < 1)) {
            // @ts-ignore
            a = (t.typ == 'Perc' ? t.val / 100 : t.val);
        }
    }
    return `#${hsl2rgb(h, s, l, a).reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function hwb2hex(token) {
    let t;
    // @ts-ignore
    let h = getAngle(token.chi[0]);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    let white = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = token.chi[4];
    // @ts-ignore
    let black = t.typ == 'Perc' ? t.val / 100 : t.val;
    let a = null;
    if (token.chi?.length == 7) {
        // @ts-ignore
        t = token.chi[6];
        // @ts-ignore
        if ((t.typ == 'Perc' && t.val < 100) ||
            // @ts-ignore
            (t.typ == 'Number' && t.val < 1)) {
            // @ts-ignore
            a = (t.typ == 'Perc' ? t.val / 100 : t.val);
        }
    }
    const rgb = hsl2rgb(h, 1, .5, a);
    let value;
    for (let i = 0; i < 3; i++) {
        value = rgb[i] / 255;
        value *= (1 - white - black);
        value += white;
        rgb[i] = Math.round(value * 255);
    }
    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function cmyk2hex(token) {
    // @ts-ignore
    let t = token.chi[0];
    // @ts-ignore
    const c = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    const m = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = token.chi[4];
    // @ts-ignore
    const y = t.typ == 'Perc' ? t.val / 100 : t.val;
    // @ts-ignore
    t = token.chi[6];
    // @ts-ignore
    const k = t.typ == 'Perc' ? t.val / 100 : t.val;
    const rgb = [
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];
    // @ts-ignore
    if (token.chi.length >= 9) {
        // @ts-ignore
        t = token.chi[8];
        // @ts-ignore
        rgb.push(Math.round(255 * (t.typ == 'Perc' ? t.val / 100 : t.val)));
    }
    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function getAngle(token) {
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
    return token.val / 360;
}
function hsl2rgb(h, s, l, a = null) {
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

const indents = [];
function render(data, opt = {}) {
    const options = Object.assign(opt.compress ? {
        indent: '',
        newLine: '',
        removeComments: true,
        colorConvert: true
    } : {
        indent: ' ',
        newLine: '\n',
        compress: false,
        removeComments: false,
        colorConvert: true
    }, opt);
    function reducer(acc, curr) {
        if (curr.typ == 'Comment' && options.removeComments) {
            return acc;
        }
        acc += renderToken(curr, options);
        return acc;
    }
    return doRender(data, options, reducer);
}
function doRender(data, options, reducer, level = 0) {
    if (indents.length < level + 1) {
        indents.push(options.indent.repeat(level));
    }
    if (indents.length < level + 2) {
        indents.push(options.indent.repeat(level + 1));
    }
    const indent = indents[level];
    const indentSub = indents[level + 1];
    switch (data.typ) {
        case 'Comment':
            return options.removeComments ? '' : data.val;
        case 'StyleSheet':
            return data.chi.reduce((css, node) => {
                const str = doRender(node, options, reducer);
                if (str === '') {
                    return css;
                }
                if (css === '') {
                    return str;
                }
                return `${css}${options.newLine}${str}`;
            }, '');
        case 'AtRule':
        case 'Rule':
            if (data.typ == 'AtRule' && !('chi' in data)) {
                return `${indent}@${data.nam} ${data.val};`;
            }
            // @ts-ignore
            let children = data.chi.reduce((css, node) => {
                let str;
                if (node.typ == 'Comment') {
                    str = options.removeComments ? '' : node.val;
                }
                else if (node.typ == 'Declaration') {
                    str = `${node.nam}:${options.indent}${node.val.reduce(reducer, '').trimEnd()};`;
                }
                else if (node.typ == 'AtRule' && !('chi' in node)) {
                    str = `@${node.nam} ${node.val};`;
                }
                else {
                    str = doRender(node, options, reducer, level + 1);
                }
                if (css === '') {
                    return str;
                }
                if (str === '') {
                    return css;
                }
                if (str !== '')
                    return `${css}${options.newLine}${indentSub}${str}`;
            }, '');
            if (children.endsWith(';')) {
                children = children.slice(0, -1);
            }
            if (data.typ == 'AtRule') {
                return `@${data.nam} ${data.val ? data.val + options.indent : ''}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            }
            return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
    }
    return '';
}
function renderToken(token, options = {}) {
    switch (token.typ) {
        case 'Color':
            if (options.compress || options.colorConvert) {
                let value = token.kin == 'hex' ? token.val.toLowerCase() : '';
                if (token.val == 'rgb' || token.val == 'rgba') {
                    value = rgb2Hex(token);
                }
                else if (token.val == 'hsl' || token.val == 'hsla') {
                    value = hsl2Hex(token);
                }
                else if (token.val == 'hwb') {
                    value = hwb2hex(token);
                }
                else if (token.val == 'device-cmyk') {
                    value = cmyk2hex(token);
                }
                const named_color = NAMES_COLORS[value];
                if (value !== '') {
                    if (value.length == 7) {
                        if (value[1] == value[2] &&
                            value[3] == value[4] &&
                            value[5] == value[6]) {
                            value = `#${value[1]}${value[3]}${value[5]}`;
                        }
                    }
                    else if (value.length == 9) {
                        if (value[1] == value[2] &&
                            value[3] == value[4] &&
                            value[5] == value[6] &&
                            value[7] == value[8]) {
                            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
                        }
                    }
                    return named_color != null && named_color.length <= value.length ? named_color : value;
                }
            }
            if (token.kin == 'hex') {
                return token.val;
            }
        case 'Func':
            // @ts-ignore
            return token.val + '(' + token.chi.reduce((acc, curr) => {
                if (options.removeComments && curr.typ == 'Comment') {
                    return acc;
                }
                acc += renderToken(curr, options);
                return acc;
            }, '') + ')';
        case 'Includes':
            return '~=';
        case 'Dash-match':
            return '|=';
        case 'Lt':
            return '<';
        case 'Gt':
            return '>';
        case 'Start-parens':
            return '(';
        case 'End-parens':
            return ')';
        case 'Attr-start':
            return '[';
        case 'Attr-end':
            return ']';
        case 'Whitespace':
            return ' ';
        case 'Colon':
            return ':';
        case 'Semi-colon':
            return ';';
        case 'Comma':
            return ',';
        case 'Important':
            return '!important';
        case 'Dimension':
            return token.val + token.unit;
        case 'Perc':
            return token.val + '%';
        case 'Comment':
            if (options.removeComments) {
                return '';
            }
        case 'Number':
            if (options.compress) {
                if (token.val.charAt(0) === '0' && token.val.length > 1) {
                    return token.val.slice(1);
                }
            }
        case 'Url-token':
        case 'At-rule':
        case 'Hash':
        case 'Pseudo-class':
        case 'Pseudo-class-func':
        case 'Literal':
        case 'String':
        case 'Iden':
        case 'Delim':
            return token.val;
    }
    throw new Error(`unexpected token ${JSON.stringify(token, null, 1)}`);
}

function tokenize(iterator, errors, options) {
    const tokens = [];
    const src = options.src;
    const stack = [];
    const root = {
        typ: "StyleSheet",
        chi: []
    };
    const position = {
        ind: 0,
        lin: 1,
        col: 1
    };
    let value;
    let buffer = '';
    let ind = -1;
    let lin = 1;
    let col = 0;
    let total = iterator.length;
    let map = new Map;
    let context = root;
    if (options.location) {
        root.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1
            },
            end: {
                ind: -1,
                lin: 1,
                col: 0
            },
            src: ''
        };
    }
    function getType(val) {
        if (val === '') {
            throw new Error('empty string?');
        }
        if (val == ':') {
            return { typ: 'Colon' };
        }
        if (val == '=') {
            return { typ: 'Delim', val };
        }
        if (val == ';') {
            return { typ: 'Semi-colon' };
        }
        if (val == ',') {
            return { typ: 'Comma' };
        }
        if (val == '<') {
            return { typ: 'Lt' };
        }
        if (val == '>') {
            return { typ: 'Gt' };
        }
        if (isPseudo(val)) {
            return {
                typ: val.endsWith('(') ? 'Pseudo-class-func' : 'Pseudo-class',
                val
                // buffer: buffer.slice()
            };
        }
        if (isAtKeyword(val)) {
            return {
                typ: 'At-rule',
                val: val.slice(1)
                // buffer: buffer.slice()
            };
        }
        if (isFunction(val)) {
            return {
                typ: 'Func',
                val: val.slice(0, -1),
                chi: []
            };
        }
        if (isNumber(val)) {
            return {
                typ: 'Number',
                val
            };
        }
        if (isDimension(val)) {
            return parseDimension(val);
        }
        if (isPercentage(val)) {
            return {
                typ: 'Perc',
                val: val.slice(0, -1)
            };
        }
        if (isIdent(val)) {
            return {
                typ: 'Iden',
                val
            };
        }
        if (val.charAt(0) == '#' && isHash(val)) {
            return {
                typ: 'Hash',
                val
            };
        }
        if ('"\''.includes(val.charAt(0))) {
            return {
                typ: 'Unclosed-string',
                val
            };
        }
        return {
            typ: 'Literal',
            val
        };
    }
    // consume and throw away
    function consume(open, close) {
        let count = 1;
        let chr;
        while (true) {
            chr = next();
            if (chr == '\\') {
                if (next() === '') {
                    break;
                }
                continue;
            }
            else if (chr == '/' && peek() == '*') {
                next();
                while (true) {
                    chr = next();
                    if (chr === '') {
                        break;
                    }
                    if (chr == '*' && peek() == '/') {
                        next();
                        break;
                    }
                }
            }
            else if (chr == close) {
                count--;
            }
            else if (chr == open) {
                count++;
            }
            if (chr === '' || count == 0) {
                break;
            }
        }
    }
    function parseNode(tokens) {
        let i = 0;
        let loc;
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == 'Comment') {
                // @ts-ignore
                context.chi.push(tokens[i]);
                const position = map.get(tokens[i]);
                loc = {
                    sta: position,
                    // @ts-ignore
                    end: update({ ...position }, tokens[i].val),
                    src
                };
                if (options.location) {
                    tokens[i].loc = loc;
                }
            }
            else if (tokens[i].typ != 'Whitespace') {
                break;
            }
        }
        tokens = tokens.slice(i);
        const delim = tokens.pop();
        while (['Whitespace', 'Bad-string', 'Bad-comment'].includes(tokens[tokens.length - 1]?.typ)) {
            tokens.pop();
        }
        if (tokens.length == 0) {
            return null;
        }
        if (tokens[0]?.typ == 'At-rule') {
            const atRule = tokens.shift();
            const position = map.get(atRule);
            if (atRule.val == 'charset' && position.ind > 0) {
                // console.debug({position, atRule});
                errors.push({ action: 'drop', message: 'invalid @charset', location: { src, ...position } });
                return null;
            }
            while (['Whitespace'].includes(tokens[0]?.typ)) {
                tokens.shift();
            }
            if (atRule.val == 'import') {
                // only @charset and @layer are accepted before @import
                if (context.chi.length > 0) {
                    let i = context.chi.length;
                    while (i--) {
                        const type = context.chi[i].typ;
                        if (type == 'Comment') {
                            continue;
                        }
                        if (type != 'AtRule') {
                            errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                            return null;
                        }
                        const name = context.chi[i].nam;
                        if (name != 'charset' && name != 'import' && name != 'layer') {
                            errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                            return null;
                        }
                        break;
                    }
                }
                // @ts-ignore
                if (tokens[0]?.typ != 'String' && tokens[0]?.typ != 'Func') {
                    errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == 'Func' && tokens[1]?.typ != 'Url-token' && tokens[1]?.typ != 'String') {
                    errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                    return null;
                }
            }
            if (atRule.val == 'import') {
                // @ts-ignore
                if (tokens[0].typ == 'Func' && tokens[1].typ == 'Url-token') {
                    tokens.shift();
                    const token = tokens.shift();
                    token.typ = 'String';
                    token.val = `"${token.val}"`;
                    tokens[0] = token;
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack
            const node = {
                typ: 'AtRule',
                nam: renderToken(atRule, { removeComments: true }),
                val: tokens.reduce((acc, curr) => acc + renderToken(curr, { removeComments: true }), '')
            };
            if (node.nam == 'import') {
                if (options.processImport) {
                    // @ts-ignore
                    let fileToken = tokens[tokens[0].typ == 'Func' ? 1 : 0];
                    let file = fileToken.typ == 'String' ? fileToken.val.slice(1, -1) : fileToken.val;
                    if (!file.startsWith('data:')) ;
                }
            }
            if (delim.typ == 'Block-start') {
                node.chi = [];
            }
            loc = {
                sta: position,
                src
            };
            if (options.location) {
                node.loc = loc;
            }
            // @ts-ignore
            context.chi.push(node);
            // console.debug({after: node});
            return delim.typ == 'Block-start' ? node : null;
        }
        else {
            // rule
            if (delim.typ == 'Block-start') {
                let inAttr = 0;
                const position = map.get(tokens[0]);
                if (context.typ == 'Rule') {
                    if (tokens[0]?.typ == 'Iden') {
                        errors.push({ action: 'drop', message: 'invalid nesting rule', location: { src, ...position } });
                        return null;
                    }
                }
                const node = {
                    typ: 'Rule',
                    sel: tokens.reduce((acc, curr) => {
                        if (acc[acc.length - 1].length == 0 && curr.typ == 'Whitespace') {
                            return acc;
                        }
                        if (curr.typ == 'Attr-start') {
                            inAttr++;
                        }
                        else if (curr.typ == 'Attr-end') {
                            inAttr--;
                        }
                        if (inAttr == 0 && curr.typ == "Comma") {
                            acc.push([]);
                        }
                        else {
                            acc[acc.length - 1].push(curr);
                        }
                        return acc;
                    }, [[]]).map(part => part.map(p => renderToken(p, { removeComments: true })).join('')).join(),
                    chi: []
                };
                loc = {
                    sta: position,
                    src
                };
                if (options.location) {
                    node.loc = loc;
                }
                // @ts-ignore
                context.chi.push(node);
                return node;
            }
            else {
                // declaration
                // @ts-ignore
                let name = null;
                // @ts-ignore
                let value = null;
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i].typ == 'Comment') {
                        continue;
                    }
                    if (tokens[i].typ == 'Colon') {
                        name = tokens.slice(0, i);
                        value = tokens.slice(i + 1);
                    }
                    else if (['Func', 'Pseudo-class'].includes(tokens[i].typ) && tokens[i].val.startsWith(':')) {
                        tokens[i].val = tokens[i].val.slice(1);
                        if (tokens[i].typ == 'Pseudo-class') {
                            tokens[i].typ = 'Iden';
                        }
                        name = tokens.slice(0, i);
                        value = tokens.slice(i);
                    }
                }
                if (name == null) {
                    name = tokens;
                }
                const position = map.get(name[0]);
                // const rawName: string = (<IdentToken>name.shift())?.val;
                if (name.length > 0) {
                    for (let i = 1; i < name.length; i++) {
                        if (name[i].typ != 'Whitespace' && name[i].typ != 'Comment') {
                            errors.push({
                                action: 'drop',
                                message: 'invalid declaration',
                                location: { src, ...position }
                            });
                            return null;
                        }
                    }
                }
                // if (name.length == 0) {
                //
                //     errors.push({action: 'drop', message: 'invalid declaration', location: {src, ...position}});
                //     return null;
                // }
                // console.error(name[0]);
                if (value == null) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                let j = value.length;
                let i = j;
                let t;
                while (i--) {
                    t = value[i];
                    if (t.typ == 'Iden') {
                        // named color
                        const value = t.val.toLowerCase();
                        if (COLORS_NAMES[value] != null) {
                            Object.assign(t, {
                                typ: 'Color',
                                val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                                kin: 'hex'
                            });
                        }
                        continue;
                    }
                    if (t.typ == 'Hash' && isHexColor(t.val)) {
                        // hex color
                        // @ts-ignore
                        t.typ = 'Color';
                        // @ts-ignore
                        t.kin = 'hex';
                        continue;
                    }
                    if (t.typ == 'Func') {
                        // func color
                        let parens = 1;
                        let k = i;
                        let j = value.length;
                        let isScalar = true;
                        while (++k < j) {
                            switch (value[k].typ) {
                                case 'Start-parens':
                                case 'Func':
                                    parens++;
                                    isScalar = false;
                                    break;
                                case 'End-parens':
                                    parens--;
                                    break;
                            }
                            if (parens == 0) {
                                break;
                            }
                        }
                        t.chi = value.splice(i + 1, k);
                        if (t.chi[t.chi.length - 1].typ == 'End-parens') {
                            t.chi.pop();
                        }
                        if (isScalar && ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk'].includes(t.val)) {
                            // @ts-ignore
                            t.typ = 'Color';
                            // @ts-ignore
                            t.kin = t.val;
                            let i = t.chi.length;
                            while (i-- > 0) {
                                if (t.chi[i].typ == 'Literal') {
                                    if (t.chi[i + 1]?.typ == 'Whitespace') {
                                        t.chi.splice(i + 1, 1);
                                    }
                                    if (t.chi[i - 1]?.typ == 'Whitespace') {
                                        t.chi.splice(i - 1, 1);
                                        i--;
                                    }
                                }
                            }
                        }
                        continue;
                    }
                    if (t.typ == 'Whitespace' || t.typ == 'Comment') {
                        value.slice(i, 1);
                    }
                }
                if (value.length == 0) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                const node = {
                    typ: 'Declaration',
                    // @ts-ignore
                    nam: renderToken(name.shift(), { removeComments: true }),
                    // @ts-ignore
                    val: value
                };
                while (node.val[0]?.typ == 'Whitespace') {
                    node.val.shift();
                }
                if (node.val.length == 0) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                loc = {
                    sta: position,
                    src
                };
                if (options.location) {
                    node.loc = loc;
                }
                // @ts-ignore
                context.chi.push(node);
                return null;
            }
        }
    }
    function peek(count = 1) {
        if (count == 1) {
            return iterator.charAt(ind + 1);
        }
        return iterator.slice(ind + 1, ind + count + 1);
    }
    function prev(count = 1) {
        if (count == 1) {
            return ind == 0 ? '' : iterator.charAt(ind - 1);
        }
        return iterator.slice(ind - 1 - count, ind - 1);
    }
    function next(count = 1) {
        let char = '';
        while (count-- > 0 && ind < total) {
            const codepoint = iterator.codePointAt(++ind);
            if (codepoint == null) {
                return char;
            }
            // if (codepoint < 0x80) {
            char += iterator.charAt(ind);
            // }
            // else {
            //
            //     const chr: string = String.fromCodePoint(codepoint);
            //
            //     ind += chr.length - 1;
            //     char += chr;
            // }
            // ind += codepoint < 256 ? 1 : String.fromCodePoint(codepoint).length;
            if (isNewLine(codepoint)) {
                lin++;
                col = 0;
                // \r\n
                // if (codepoint == 0xd && iterator.codePointAt(i + 1) == 0xa) {
                // offset++;
                // ind++;
                // }
            }
            else {
                col++;
            }
            // ind++;
            // i += offset;
        }
        return char;
    }
    function pushToken(token) {
        tokens.push(token);
        map.set(token, { ...position });
        position.ind = ind;
        position.lin = lin;
        position.col = col == 0 ? 1 : col;
        // }
    }
    function consumeWhiteSpace() {
        let count = 0;
        while (isWhiteSpace(iterator.charAt(count + ind + 1).codePointAt(0))) {
            count++;
        }
        next(count);
        return count;
    }
    function consumeString(quoteStr) {
        const quote = quoteStr;
        let value;
        let hasNewLine = false;
        if (buffer.length > 0) {
            pushToken(getType(buffer));
            buffer = '';
        }
        buffer += quoteStr;
        while (ind < total) {
            value = peek();
            if (ind >= total) {
                pushToken({ typ: hasNewLine ? 'Bad-string' : 'Unclosed-string', val: buffer });
                break;
            }
            if (value == '\\') {
                // buffer += value;
                if (ind >= total) {
                    // drop '\\' at the end
                    pushToken(getType(buffer));
                    break;
                }
                buffer += next(2);
                continue;
            }
            if (value == quote) {
                buffer += value;
                pushToken({ typ: hasNewLine ? 'Bad-string' : 'String', val: buffer });
                next();
                // i += value.length;
                buffer = '';
                break;
            }
            if (isNewLine(value.codePointAt(0))) {
                hasNewLine = true;
            }
            if (hasNewLine && value == ';') {
                pushToken({ typ: 'Bad-string', val: buffer });
                buffer = '';
                break;
            }
            buffer += value;
            // i += value.length;
            next();
        }
    }
    while (ind < total) {
        value = next();
        if (ind >= total) {
            if (buffer.length > 0) {
                pushToken(getType(buffer));
                buffer = '';
            }
            break;
        }
        if (isWhiteSpace(value.codePointAt(0))) {
            if (buffer.length > 0) {
                pushToken(getType(buffer));
                buffer = '';
            }
            while (ind < total) {
                value = next();
                if (ind >= total) {
                    break;
                }
                if (!isWhiteSpace(value.codePointAt(0))) {
                    break;
                }
            }
            pushToken({ typ: 'Whitespace' });
            buffer = '';
            if (ind >= total) {
                break;
            }
        }
        switch (value) {
            case '/':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                if (peek() == '*') {
                    buffer += '*';
                    // i++;
                    next();
                    while (ind < total) {
                        value = next();
                        if (ind >= total) {
                            pushToken({
                                typ: 'Bad-comment', val: buffer
                            });
                            break;
                        }
                        if (value == '\\') {
                            buffer += value;
                            value = next();
                            if (ind >= total) {
                                pushToken({
                                    typ: 'Bad-comment',
                                    val: buffer
                                });
                                break;
                            }
                            buffer += value;
                            continue;
                        }
                        if (value == '*') {
                            buffer += value;
                            value = next();
                            if (ind >= total) {
                                pushToken({
                                    typ: 'Bad-comment', val: buffer
                                });
                                break;
                            }
                            buffer += value;
                            if (value == '/') {
                                pushToken({ typ: 'Comment', val: buffer });
                                buffer = '';
                                break;
                            }
                        }
                        else {
                            buffer += value;
                        }
                    }
                }
                break;
            case '<':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= total) {
                    break;
                }
                if (peek(3) == '!--') {
                    while (ind < total) {
                        value = next();
                        if (ind >= total) {
                            break;
                        }
                        buffer += value;
                        if (value == '>' && prev(2) == '--') {
                            pushToken({
                                typ: 'CDOCOMM',
                                val: buffer
                            });
                            buffer = '';
                            break;
                        }
                    }
                }
                if (ind >= total) {
                    pushToken({ typ: 'BADCDO', val: buffer });
                    buffer = '';
                }
                break;
            case '\\':
                value = next();
                // EOF
                if (ind + 1 >= total) {
                    // end of stream ignore \\
                    pushToken(getType(buffer));
                    buffer = '';
                    break;
                }
                buffer += value;
                break;
            case '"':
            case "'":
                consumeString(value);
                break;
            case '~':
            case '|':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= total) {
                    pushToken(getType(buffer));
                    buffer = '';
                    break;
                }
                if (value == '=') {
                    buffer += value;
                    pushToken({
                        typ: buffer[0] == '~' ? 'Includes' : 'Dash-matches',
                        val: buffer
                    });
                    buffer = '';
                    break;
                }
                pushToken(getType(buffer));
                buffer = value;
                break;
            case '>':
                if (tokens[tokens.length - 1]?.typ == 'Whitespace') {
                    tokens.pop();
                }
                pushToken({ typ: 'Gt' });
                consumeWhiteSpace();
                break;
            case ':':
            case ',':
            case '=':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                if (value == ':' && isIdent(peek())) {
                    buffer += value;
                    break;
                }
                pushToken(getType(value));
                buffer = '';
                while (isWhiteSpace(peek().codePointAt(0))) {
                    next();
                }
                break;
            case ')':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken({ typ: 'End-parens' });
                break;
            case '(':
                if (buffer.length == 0) {
                    pushToken({ typ: 'Start-parens' });
                }
                else {
                    buffer += value;
                    pushToken(getType(buffer));
                    buffer = '';
                    const token = tokens[tokens.length - 1];
                    if (token.typ == 'Func' && token.val == 'url') {
                        // consume either string or url token
                        let whitespace = '';
                        value = peek();
                        while (isWhiteSpace(value.codePointAt(0))) {
                            whitespace += value;
                        }
                        if (whitespace.length > 0) {
                            next(whitespace.length);
                        }
                        value = peek();
                        if (value == '"' || value == "'") {
                            consumeString(next());
                            let token = tokens[tokens.length - 1];
                            if (token.typ == 'String' && /^("|')[a-zA-Z0-9_/-][a-zA-Z0-9_/:.-]+("|')$/.test(token.val)) {
                                // @ts-ignore
                                token.typ = 'Url-token';
                                token.val = token.val.slice(1, -1);
                            }
                            break;
                        }
                        else {
                            buffer = '';
                            do {
                                let cp = value.codePointAt(0);
                                // EOF -
                                if (cp == null) {
                                    pushToken({ typ: 'Bad-url-token', val: buffer });
                                    break;
                                }
                                // ')'
                                if (cp == 0x29 || cp == null) {
                                    if (buffer.length == 0) {
                                        pushToken({ typ: 'Bad-url-token', val: '' });
                                    }
                                    else {
                                        pushToken({ typ: 'Url-token', val: buffer });
                                    }
                                    if (cp != null) {
                                        pushToken(getType(next()));
                                    }
                                    break;
                                }
                                if (isWhiteSpace(cp)) {
                                    whitespace = next();
                                    while (true) {
                                        value = peek();
                                        cp = value.codePointAt(0);
                                        if (isWhiteSpace(cp)) {
                                            whitespace += value;
                                            continue;
                                        }
                                        break;
                                    }
                                    if (cp == null || cp == 0x29) {
                                        continue;
                                    }
                                    // bad url token
                                    buffer += next(whitespace.length);
                                    do {
                                        value = peek();
                                        cp = value.codePointAt(0);
                                        if (cp == null || cp == 0x29) {
                                            break;
                                        }
                                        buffer += next();
                                    } while (true);
                                    pushToken({ typ: 'Bad-url-token', val: buffer });
                                    continue;
                                }
                                buffer += next();
                                value = peek();
                            } while (true);
                            buffer = '';
                        }
                    }
                }
                break;
            case '[':
            case ']':
            case '{':
            case '}':
            case ';':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken(getBlockType(value));
                let node = null;
                if (value == '{' || value == ';') {
                    node = parseNode(tokens);
                    if (node != null) {
                        stack.push(node);
                        // @ts-ignore
                        context = node;
                    }
                    else if (value == '{') {
                        // node == null
                        // consume and throw away until the closing '}' or EOF
                        consume('{', '}');
                    }
                    tokens.length = 0;
                    map.clear();
                }
                else if (value == '}') {
                    node = parseNode(tokens);
                    const previousNode = stack.pop();
                    // @ts-ignore
                    context = stack[stack.length - 1] || root;
                    if (options.location && context != root) {
                        // @ts-ignore
                        context.loc.end = { ind, lin, col: col == 0 ? 1 : col };
                    }
                    // @ts-ignore
                    if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                        context.chi.pop();
                    }
                    tokens.length = 0;
                    map.clear();
                    buffer = '';
                }
                // @ts-ignore
                if (node != null && options.location && ['}', ';'].includes(value) && context.chi[context.chi.length - 1].loc.end == null) {
                    // @ts-ignore
                    context.chi[context.chi.length - 1].loc.end = { ind, lin, col };
                }
                break;
            case '!':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                const important = peek(9);
                if (important == 'important') {
                    if (tokens[tokens.length - 1]?.typ == 'Whitespace') {
                        tokens.pop();
                    }
                    pushToken({ typ: 'Important' });
                    next(9);
                    buffer = '';
                    break;
                }
                buffer = '!';
                break;
            default:
                buffer += value;
                break;
        }
    }
    if (buffer.length > 0) {
        pushToken(getType(buffer));
    }
    // pushToken({typ: 'EOF'});
    //
    if (col == 0) {
        col = 1;
    }
    if (options.location) {
        // @ts-ignore
        root.loc.end = { ind, lin, col };
        for (const context of stack) {
            // @ts-ignore
            context.loc.end = { ind, lin, col };
        }
    }
    return root;
}
function getBlockType(chr) {
    if (chr == ';') {
        return { typ: 'Semi-colon' };
    }
    if (chr == '{') {
        return { typ: 'Block-start' };
    }
    if (chr == '}') {
        return { typ: 'Block-end' };
    }
    if (chr == '[') {
        return { typ: 'Attr-start' };
    }
    if (chr == ']') {
        return { typ: 'Attr-end' };
    }
    throw new Error(`unhandled token: '${chr}'`);
}

function parse(css, opt = {}) {
    const errors = [];
    const options = {
        src: '',
        location: false,
        processImport: false,
        deduplicate: false,
        removeEmpty: false,
        ...opt
    };
    if (css.length == 0) {
        // @ts-ignore
        return null;
    }
    // @ts-ignore
    const ast = tokenize(css, errors, options);
    if (options.deduplicate) {
        deduplicate(ast);
    }
    return { ast, errors };
}
function deduplicate(ast) {
    if ('chi' in ast) {
        // @ts-ignore
        let i = ast.chi.length;
        let previous;
        let node;
        while (i--) {
            // @ts-ignore
            node = ast.chi[i];
            // @ts-ignore
            if (node.typ == 'Comment') {
                continue;
            }
            if (node.typ == 'AtRule' && node.nam == 'media' && node.val == 'all') {
                // merge only if the previous rule contains only declarations
                let shouldMerge = true;
                // @ts-ignore
                let i = node.chi.length;
                while (i--) {
                    // @ts-ignore
                    if (node.chi[i].typ == 'Comment') {
                        continue;
                    }
                    // @ts-ignore
                    shouldMerge = node.chi[i].typ == 'Declaration';
                    break;
                }
                if (!shouldMerge) {
                    continue;
                }
                // @ts-ignore
                ast.chi.splice(i, 1, ...node.chi);
                // @ts-ignore
                i += node.chi.length;
                continue;
            }
            // @ts-ignore
            if (node.typ == previous?.typ) {
                if ((node.typ == 'Rule' && node.sel == previous.sel) ||
                    (node.typ == 'AtRule' &&
                        node.nam == previous.nam &&
                        node.val == previous.val)) {
                    if ('chi' in node) {
                        let shouldMerge = true;
                        // @ts-ignore
                        let i = node.chi.length;
                        while (i--) {
                            // @ts-ignore
                            if (node.chi[i].typ == 'Comment') {
                                continue;
                            }
                            // @ts-ignore
                            shouldMerge = node.chi[i].typ == 'Declaration';
                            break;
                        }
                        if (!shouldMerge) {
                            continue;
                        }
                        // @ts-ignore
                        previous.chi = node.chi.concat(...(previous.chi || []));
                    }
                    // @ts-ignore
                    ast.chi.splice(i, 1);
                    if (!('chi' in previous)) {
                        continue;
                    }
                    // @ts-ignore
                    if (previous.typ == 'Rule' || previous.chi.some(n => n.typ == 'Declaration')) {
                        deduplicateRule(previous);
                    }
                    else {
                        deduplicate(previous);
                    }
                    continue;
                }
                else if (node.typ == 'Declaration' && node.nam == previous.nam) {
                    // @ts-ignore
                    ast.chi.splice(i, 1);
                    continue;
                }
            }
            previous = node;
            if (!('chi' in node)) {
                continue;
            }
            // @ts-ignore
            if (node.typ == 'AtRule' || node.chi.some(n => n.typ == 'Declaration')) {
                deduplicateRule(node);
            }
            else {
                deduplicate(node);
            }
        }
    }
    return ast;
}
function deduplicateRule(ast) {
    if (!('chi' in ast) || ast.chi?.length == 0) {
        return ast;
    }
    const map = new Map;
    // @ts-ignore
    let i = ast.chi.length;
    let node;
    while (i--) {
        // @ts-ignore
        node = ast.chi[i];
        if (node.typ != 'Declaration') {
            continue;
        }
        // @ts-ignore
        if (map.has(node.nam)) {
            // @ts-ignore
            ast.chi.splice(i, 1);
            continue;
        }
        // @ts-ignore
        map.set(node.nam, node);
    }
    return ast;
}

export { deduplicate, deduplicateRule, parse, render, renderToken };
