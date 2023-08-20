'use strict';

var promises = require('fs/promises');

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
    if (token.typ == 'Angle') {
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

const colorsFunc = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk'];
function reduceNumber(val) {
    val = (+val).toString();
    if (val === '0') {
        return '0';
    }
    const chr = val.charAt(0);
    if (chr == '-') {
        const slice = val.slice(0, 2);
        if (slice == '-0') {
            return val.length == 2 ? '0' : '-' + val.slice(2);
        }
    }
    if (chr == '0') {
        return val.slice(1);
    }
    return val;
}
function render(data, opt = {}) {
    const startTime = performance.now();
    const errors = [];
    const options = Object.assign(opt.minify ?? true ? {
        indent: '',
        newLine: '',
        removeComments: true
    } : {
        indent: ' ',
        newLine: '\n',
        compress: false,
        removeComments: false,
    }, { colorConvert: true, expandNestingRules: false, preserveLicense: false }, opt);
    return {
        code: doRender(options.expandNestingRules ? expand(data) : data, options, errors, function reducer(acc, curr) {
            if (curr.typ == 'Comment' && options.removeComments) {
                if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                    return acc;
                }
                return acc + curr.val;
            }
            return acc + renderToken(curr, options, reducer, errors);
        }, 0), errors, stats: {
            total: `${(performance.now() - startTime).toFixed(2)}ms`
        }
    };
}
// @ts-ignore
function doRender(data, options, errors, reducer, level = 0, indents = []) {
    if (indents.length < level + 1) {
        indents.push(options.indent.repeat(level));
    }
    if (indents.length < level + 2) {
        indents.push(options.indent.repeat(level + 1));
    }
    const indent = indents[level];
    const indentSub = indents[level + 1];
    switch (data.typ) {
        case 'Declaration':
            return `${data.nam}:${options.indent}${data.val.reduce(reducer, '')}`;
        case 'Comment':
        case 'CDOCOMM':
            return !options.removeComments || (options.preserveLicense && data.val.startsWith('/*!')) ? data.val : '';
        case 'StyleSheet':
            return data.chi.reduce((css, node) => {
                const str = doRender(node, options, errors, reducer, level, indents);
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
                return `${indent}@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val};`;
            }
            // @ts-ignore
            let children = data.chi.reduce((css, node) => {
                let str;
                if (node.typ == 'Comment') {
                    str = options.removeComments && (!options.preserveLicense || !node.val.startsWith('/*!')) ? '' : node.val;
                }
                else if (node.typ == 'Declaration') {
                    if (node.val.length == 0) {
                        // @ts-ignore
                        errors.push({ action: 'ignore', message: `render: invalid declaration ${JSON.stringify(node)}`, location: node.loc });
                        return '';
                    }
                    str = `${node.nam}:${options.indent}${node.val.reduce(reducer, '').trimEnd()};`;
                }
                else if (node.typ == 'AtRule' && !('chi' in node)) {
                    str = `${data.val === '' ? '' : options.indent || ' '}${data.val};`;
                }
                else {
                    str = doRender(node, options, errors, reducer, level + 1, indents);
                }
                if (css === '') {
                    return str;
                }
                if (str === '') {
                    return css;
                }
                return `${css}${options.newLine}${indentSub}${str}`;
            }, '');
            if (children.endsWith(';')) {
                children = children.slice(0, -1);
            }
            if (data.typ == 'AtRule') {
                return `@${data.nam}${data.val === '' ? '' : options.indent || ' '}${data.val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            }
            return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
    }
    return '';
}
function renderToken(token, options = {}, reducer, errors) {
    if (reducer == null) {
        reducer = function (acc, curr) {
            if (curr.typ == 'Comment' && options.removeComments) {
                if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                    return acc;
                }
                return acc + curr.val;
            }
            return acc + renderToken(curr, options, reducer, errors);
        };
    }
    switch (token.typ) {
        case 'Color':
            if (options.minify || options.colorConvert) {
                if (token.kin == 'lit' && token.val.toLowerCase() == 'currentcolor') {
                    return 'currentcolor';
                }
                let value = token.kin == 'hex' ? token.val.toLowerCase() : (token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : '');
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
            if (token.kin == 'hex' || token.kin == 'lit') {
                return token.val;
            }
        case 'Start-parens':
            if (!('chi' in token)) {
                return '(';
            }
        case 'Func':
        case 'UrlFunc':
        case 'Pseudo-class-func':
            // @ts-ignore
            return ( /* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/token.val ?? '') + '(' + token.chi.reduce(reducer, '') + ')';
        case 'Includes':
            return '~=';
        case 'Dash-match':
            return '|=';
        case 'Lt':
            return '<';
        case 'Lte':
            return '<=';
        case 'Gt':
            return '>';
        case 'Gte':
            return '>=';
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
        case 'Attr':
            return '[' + token.chi.reduce(reducer, '') + ']';
        case 'Time':
        case 'Angle':
        case 'Length':
        case 'Dimension':
        case 'Frequency':
        case 'Resolution':
            let val = reduceNumber(token.val);
            let unit = token.unit;
            if (token.typ == 'Angle') {
                const angle = getAngle(token);
                let v;
                let value = val + unit;
                for (const u of ['turn', 'deg', 'rad', 'grad']) {
                    if (token.unit == u) {
                        continue;
                    }
                    switch (u) {
                        case 'turn':
                            v = reduceNumber(angle);
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'deg':
                            v = reduceNumber(angle * 360);
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'rad':
                            v = reduceNumber(angle * (2 * Math.PI));
                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                        case 'grad':
                            v = reduceNumber(angle * 400);
                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }
                            break;
                    }
                }
            }
            if (val === '0') {
                if (token.typ == 'Time') {
                    return '0s';
                }
                if (token.typ == 'Frequency') {
                    return '0Hz';
                }
                // @ts-ignore
                if (token.typ == 'Resolution') {
                    return '0x';
                }
                return '0';
            }
            return val + unit;
        case 'Perc':
            return token.val + '%';
        case 'Number':
            return reduceNumber(token.val);
        case 'Comment':
            if (options.removeComments && (!options.preserveLicense || !token.val.startsWith('/*!'))) {
                return '';
            }
        case 'Url-token':
        case 'At-rule':
        case 'Hash':
        case 'Pseudo-class':
        case 'Literal':
        case 'String':
        case 'Iden':
        case 'Delim':
            return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */ token.val;
    }
    errors?.push({ action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    return '';
}

// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
// '\\'
const REVERSE_SOLIDUS = 0x5c;
const dimensionUnits = [
    'q', 'cap', 'ch', 'cm', 'cqb', 'cqh', 'cqi', 'cqmax', 'cqmin', 'cqw', 'dvb',
    'dvh', 'dvi', 'dvmax', 'dvmin', 'dvw', 'em', 'ex', 'ic', 'in', 'lh', 'lvb',
    'lvh', 'lvi', 'lvmax', 'lvw', 'mm', 'pc', 'pt', 'px', 'rem', 'rlh', 'svb',
    'svh', 'svi', 'svmin', 'svw', 'vb', 'vh', 'vi', 'vmax', 'vmin', 'vw'
];
function isLength(dimension) {
    return 'unit' in dimension && dimensionUnits.includes(dimension.unit.toLowerCase());
}
function isResolution(dimension) {
    return 'unit' in dimension && ['dpi', 'dpcm', 'dppx', 'x'].includes(dimension.unit.toLowerCase());
}
function isAngle(dimension) {
    return 'unit' in dimension && ['rad', 'turn', 'deg', 'grad'].includes(dimension.unit.toLowerCase());
}
function isTime(dimension) {
    return 'unit' in dimension && ['ms', 's'].includes(dimension.unit.toLowerCase());
}
function isFrequency(dimension) {
    return 'unit' in dimension && ['hz', 'khz'].includes(dimension.unit.toLowerCase());
}
function isColor(token) {
    if (token.typ == 'Color') {
        return true;
    }
    if (token.typ == 'Iden') {
        // named color
        return token.val.toLowerCase() in COLORS_NAMES;
    }
    if (token.typ == 'Func' && token.chi.length > 0 && colorsFunc.includes(token.val)) {
        // @ts-ignore
        for (const v of token.chi) {
            if (!['Number', 'Perc', 'Comma', 'Whitespace'].includes(v.typ)) {
                return false;
            }
        }
        return true;
    }
    return false;
}
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
    let codepoint = name.charCodeAt(0);
    // -
    if (codepoint == 0x2d) {
        const nextCodepoint = name.charCodeAt(1);
        if (Number.isNaN(nextCodepoint)) {
            return false;
        }
        // -
        if (nextCodepoint == 0x2d) {
            return true;
        }
        if (nextCodepoint == REVERSE_SOLIDUS) {
            return name.length > 2 && !isNewLine(name.charCodeAt(2));
        }
        return true;
    }
    if (!isIdentStart(codepoint)) {
        return false;
    }
    while (i < j) {
        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = name.charCodeAt(i);
        if (!isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
}
function isNonPrintable(codepoint) {
    // null -> backspace
    return (codepoint >= 0 && codepoint <= 0x8) ||
        // tab
        codepoint == 0xb ||
        // delete
        codepoint == 0x7f ||
        (codepoint >= 0xe && codepoint <= 0x1f);
}
function isPseudo(name) {
    return name.charAt(0) == ':' &&
        ((name.endsWith('(') && isIdent(name.charAt(1) == ':' ? name.slice(2, -1) : name.slice(1, -1))) ||
            isIdent(name.charAt(1) == ':' ? name.slice(2) : name.slice(1)));
}
function isHash(name) {
    return name.charAt(0) == '#' && isIdent(name.charAt(1));
}
function isNumber(name) {
    if (name.length == 0) {
        return false;
    }
    let codepoint = name.charCodeAt(0);
    let i = 0;
    const j = name.length;
    if (j == 1 && !isDigit(codepoint)) {
        return false;
    }
    // '+' '-'
    if ([0x2b, 0x2d].includes(codepoint)) {
        i++;
    }
    // consume digits
    while (i < j) {
        codepoint = name.charCodeAt(i);
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
        if (!isDigit(name.charCodeAt(++i))) {
            return false;
        }
    }
    while (i < j) {
        codepoint = name.charCodeAt(i);
        if (isDigit(codepoint)) {
            i++;
            continue;
        }
        // 'E' 'e'
        if (codepoint == 0x45 || codepoint == 0x65) {
            i++;
            break;
        }
        return false;
    }
    // 'E' 'e'
    if (codepoint == 0x45 || codepoint == 0x65) {
        if (i == j) {
            return false;
        }
        codepoint = name.charCodeAt(i + 1);
        // '+' '-'
        if ([0x2b, 0x2d].includes(codepoint)) {
            i++;
        }
        codepoint = name.charCodeAt(i + 1);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    while (++i < j) {
        codepoint = name.charCodeAt(i);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    return true;
}
function isDimension(name) {
    let index = name.length;
    while (index--) {
        if (isLetter(name.charCodeAt(index))) {
            continue;
        }
        index++;
        break;
    }
    const number = name.slice(0, index);
    return number.length > 0 && isIdentStart(name.charCodeAt(index)) && isNumber(number);
}
function isPercentage(name) {
    return name.endsWith('%') && isNumber(name.slice(0, -1));
}
function parseDimension(name) {
    let index = name.length;
    while (index--) {
        if (isLetter(name.charCodeAt(index))) {
            continue;
        }
        index++;
        break;
    }
    const dimension = { typ: 'Dimension', val: name.slice(0, index), unit: name.slice(index) };
    if (isAngle(dimension)) {
        // @ts-ignore
        dimension.typ = 'Angle';
    }
    else if (isLength(dimension)) {
        // @ts-ignore
        dimension.typ = 'Length';
    }
    else if (isTime(dimension)) {
        // @ts-ignore
        dimension.typ = 'Time';
    }
    else if (isResolution(dimension)) {
        // @ts-ignore
        dimension.typ = 'Resolution';
        if (dimension.unit == 'dppx') {
            dimension.unit = 'x';
        }
    }
    else if (isFrequency(dimension)) {
        // @ts-ignore
        dimension.typ = 'Frequency';
    }
    return dimension;
}
function isHexColor(name) {
    if (name.charAt(0) != '#' || ![4, 5, 7, 9].includes(name.length)) {
        return false;
    }
    for (let chr of name.slice(1)) {
        let codepoint = chr.charCodeAt(0);
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
    return name.charCodeAt(0) == 0x40 && isIdent(name.slice(1));
}
function isNewLine(codepoint) {
    // \n \r \f
    return codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}
function isWhiteSpace(codepoint) {
    return codepoint == 0x9 || codepoint == 0x20 ||
        // isNewLine
        codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}

var properties = {
	inset: {
		shorthand: "inset",
		properties: [
			"top",
			"right",
			"bottom",
			"left"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: false,
		separator: null,
		keywords: [
			"auto"
		]
	},
	top: {
		shorthand: "inset"
	},
	right: {
		shorthand: "inset"
	},
	bottom: {
		shorthand: "inset"
	},
	left: {
		shorthand: "inset"
	},
	margin: {
		shorthand: "margin",
		properties: [
			"margin-top",
			"margin-right",
			"margin-bottom",
			"margin-left"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: false,
		separator: null,
		keywords: [
			"auto"
		]
	},
	"margin-top": {
		shorthand: "margin"
	},
	"margin-right": {
		shorthand: "margin"
	},
	"margin-bottom": {
		shorthand: "margin"
	},
	"margin-left": {
		shorthand: "margin"
	},
	padding: {
		shorthand: "padding",
		properties: [
			"padding-top",
			"padding-right",
			"padding-bottom",
			"padding-left"
		],
		types: [
			"Length",
			"Perc"
		],
		keywords: [
		]
	},
	"padding-top": {
		shorthand: "padding"
	},
	"padding-right": {
		shorthand: "padding"
	},
	"padding-bottom": {
		shorthand: "padding"
	},
	"padding-left": {
		shorthand: "padding"
	},
	"border-radius": {
		shorthand: "border-radius",
		properties: [
			"border-top-left-radius",
			"border-top-right-radius",
			"border-bottom-right-radius",
			"border-bottom-left-radius"
		],
		types: [
			"Length",
			"Perc"
		],
		multiple: true,
		separator: "/",
		keywords: [
		]
	},
	"border-top-left-radius": {
		shorthand: "border-radius"
	},
	"border-top-right-radius": {
		shorthand: "border-radius"
	},
	"border-bottom-right-radius": {
		shorthand: "border-radius"
	},
	"border-bottom-left-radius": {
		shorthand: "border-radius"
	},
	"border-width": {
		shorthand: "border-width",
		map: "border",
		properties: [
			"border-top-width",
			"border-right-width",
			"border-bottom-width",
			"border-left-width"
		],
		types: [
			"Length",
			"Perc"
		],
		"default": [
			"medium"
		],
		keywords: [
			"thin",
			"medium",
			"thick"
		]
	},
	"border-top-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-right-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-bottom-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-left-width": {
		map: "border",
		shorthand: "border-width"
	},
	"border-style": {
		shorthand: "border-style",
		map: "border",
		properties: [
			"border-top-style",
			"border-right-style",
			"border-bottom-style",
			"border-left-style"
		],
		types: [
		],
		"default": [
			"none"
		],
		keywords: [
			"none",
			"hidden",
			"dotted",
			"dashed",
			"solid",
			"double",
			"groove",
			"ridge",
			"inset",
			"outset"
		]
	},
	"border-top-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-right-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-bottom-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-left-style": {
		map: "border",
		shorthand: "border-style"
	},
	"border-color": {
		shorthand: "border-color",
		map: "border",
		properties: [
			"border-top-color",
			"border-right-color",
			"border-bottom-color",
			"border-left-color"
		],
		types: [
			"Color"
		],
		"default": [
			"currentcolor"
		],
		keywords: [
		]
	},
	"border-top-color": {
		map: "border",
		shorthand: "border-color"
	},
	"border-right-color": {
		map: "border",
		shorthand: "border-color"
	},
	"border-bottom-color": {
		map: "border",
		shorthand: "border-color"
	},
	"border-left-color": {
		map: "border",
		shorthand: "border-color"
	}
};
var map = {
	border: {
		shorthand: "border",
		pattern: "border-color border-style border-width",
		keywords: [
			"none"
		],
		"default": [
			"0",
			"none"
		],
		properties: {
			"border-color": {
				types: [
					"Color"
				],
				"default": [
					"currentcolor"
				],
				keywords: [
				]
			},
			"border-style": {
				types: [
				],
				"default": [
					"none"
				],
				keywords: [
					"none",
					"hidden",
					"dotted",
					"dashed",
					"solid",
					"double",
					"groove",
					"ridge",
					"inset",
					"outset"
				]
			},
			"border-width": {
				types: [
					"Length",
					"Perc"
				],
				"default": [
					"medium"
				],
				keywords: [
					"thin",
					"medium",
					"thick"
				]
			}
		}
	},
	"border-color": {
		shorthand: "border"
	},
	"border-style": {
		shorthand: "border"
	},
	"border-width": {
		shorthand: "border"
	},
	overflow: {
		shorthand: "overflow",
		pattern: "overflow-x overflow-y",
		keywords: [
			"auto",
			"visible",
			"hidden",
			"clip",
			"scroll"
		],
		"default": [
		],
		mapping: {
			"visible visible": "visible",
			"auto auto": "auto",
			"hidden hidden": "hidden",
			"scroll scroll": "scroll"
		},
		properties: {
			"overflow-x": {
				"default": [
				],
				keywords: [
					"auto",
					"visible",
					"hidden",
					"clip",
					"scroll"
				]
			},
			"overflow-y": {
				"default": [
				],
				keywords: [
					"auto",
					"visible",
					"hidden",
					"clip",
					"scroll"
				]
			}
		}
	},
	"overflow-x": {
		shorthand: "overflow"
	},
	"overflow-y": {
		shorthand: "overflow"
	},
	outline: {
		shorthand: "outline",
		pattern: "outline-color outline-style outline-width",
		keywords: [
			"none"
		],
		"default": [
			"0",
			"none"
		],
		properties: {
			"outline-color": {
				types: [
					"Color"
				],
				"default": [
					"currentColor"
				],
				keywords: [
					"currentColor"
				]
			},
			"outline-style": {
				types: [
				],
				"default": [
					"none"
				],
				keywords: [
					"auto",
					"none",
					"dotted",
					"dashed",
					"solid",
					"double",
					"groove",
					"ridge",
					"inset",
					"outset"
				]
			},
			"outline-width": {
				types: [
					"Length",
					"Perc"
				],
				"default": [
					"medium"
				],
				keywords: [
					"thin",
					"medium",
					"thick"
				]
			}
		}
	},
	"outline-color": {
		shorthand: "outline"
	},
	"outline-style": {
		shorthand: "outline"
	},
	"outline-width": {
		shorthand: "outline"
	},
	font: {
		shorthand: "font",
		pattern: "font-weight font-style font-size line-height font-stretch font-variant font-family",
		keywords: [
			"caption",
			"icon",
			"menu",
			"message-box",
			"small-caption",
			"status-bar",
			"-moz-window, ",
			"-moz-document, ",
			"-moz-desktop, ",
			"-moz-info, ",
			"-moz-dialog",
			"-moz-button",
			"-moz-pull-down-menu",
			"-moz-list",
			"-moz-field"
		],
		"default": [
		],
		properties: {
			"font-weight": {
				types: [
					"Number"
				],
				"default": [
					"normal",
					"400"
				],
				keywords: [
					"normal",
					"bold",
					"lighter",
					"bolder"
				],
				constraints: {
					value: {
						min: "1",
						max: "1000"
					}
				},
				mapping: {
					thin: "100",
					hairline: "100",
					"extra light": "200",
					"ultra light": "200",
					light: "300",
					normal: "400",
					regular: "400",
					medium: "500",
					"semi bold": "600",
					"demi bold": "600",
					bold: "700",
					"extra bold": "800",
					"ultra bold": "800",
					black: "900",
					heavy: "900",
					"extra black": "950",
					"ultra black": "950"
				}
			},
			"font-style": {
				types: [
					"Angle"
				],
				"default": [
					"normal"
				],
				keywords: [
					"normal",
					"italic",
					"oblique"
				]
			},
			"font-size": {
				types: [
					"Length",
					"Perc"
				],
				"default": [
				],
				keywords: [
					"xx-small",
					"x-small",
					"small",
					"medium",
					"large",
					"x-large",
					"xx-large",
					"xxx-large",
					"larger",
					"smaller"
				],
				required: true
			},
			"line-height": {
				types: [
					"Length",
					"Perc",
					"Number"
				],
				"default": [
					"normal"
				],
				keywords: [
					"normal"
				],
				previous: "font-size",
				prefix: {
					typ: "Literal",
					val: "/"
				}
			},
			"font-stretch": {
				types: [
					"Perc"
				],
				"default": [
					"normal"
				],
				keywords: [
					"ultra-condensed",
					"extra-condensed",
					"condensed",
					"semi-condensed",
					"normal",
					"semi-expanded",
					"expanded",
					"extra-expanded",
					"ultra-expanded"
				],
				mapping: {
					"ultra-condensed": "50%",
					"extra-condensed": "62.5%",
					condensed: "75%",
					"semi-condensed": "87.5%",
					normal: "100%",
					"semi-expanded": "112.5%",
					expanded: "125%",
					"extra-expanded": "150%",
					"ultra-expanded": "200%"
				}
			},
			"font-variant": {
				types: [
				],
				"default": [
					"normal"
				],
				keywords: [
					"normal",
					"none",
					"common-ligatures",
					"no-common-ligatures",
					"discretionary-ligatures",
					"no-discretionary-ligatures",
					"historical-ligatures",
					"no-historical-ligatures",
					"contextual",
					"no-contextual",
					"historical-forms",
					"small-caps",
					"all-small-caps",
					"petite-caps",
					"all-petite-caps",
					"unicase",
					"titling-caps",
					"ordinal",
					"slashed-zero",
					"lining-nums",
					"oldstyle-nums",
					"proportional-nums",
					"tabular-nums",
					"diagonal-fractions",
					"stacked-fractions",
					"ordinal",
					"slashed-zero",
					"ruby",
					"jis78",
					"jis83",
					"jis90",
					"jis04",
					"simplified",
					"traditional",
					"full-width",
					"proportional-width",
					"ruby",
					"sub",
					"super",
					"text",
					"emoji",
					"unicode"
				]
			},
			"font-family": {
				types: [
					"String",
					"Iden"
				],
				"default": [
				],
				keywords: [
					"serif",
					"sans-serif",
					"monospace",
					"cursive",
					"fantasy",
					"system-ui",
					"ui-serif",
					"ui-sans-serif",
					"ui-monospace",
					"ui-rounded",
					"math",
					"emoji",
					"fangsong"
				],
				required: true,
				multiple: true,
				separator: {
					typ: "Comma"
				}
			}
		}
	},
	"font-weight": {
		shorthand: "font"
	},
	"font-style": {
		shorthand: "font"
	},
	"font-size": {
		shorthand: "font"
	},
	"line-height": {
		shorthand: "font"
	},
	"font-stretch": {
		shorthand: "font"
	},
	"font-variant": {
		shorthand: "font"
	},
	"font-family": {
		shorthand: "font"
	},
	background: {
		shorthand: "background",
		pattern: "background-repeat background-color background-image background-attachment background-clip background-origin background-position background-size",
		keywords: [
			"none"
		],
		"default": [
		],
		multiple: true,
		separator: {
			typ: "Comma"
		},
		properties: {
			"background-repeat": {
				types: [
				],
				"default": [
					"repeat"
				],
				multiple: true,
				keywords: [
					"repeat-x",
					"repeat-y",
					"repeat",
					"space",
					"round",
					"no-repeat"
				],
				mapping: {
					"repeat no-repeat": "repeat-x",
					"no-repeat repeat": "repeat-y",
					"repeat repeat": "repeat",
					"space space": "space",
					"round round": "round",
					"no-repeat no-repeat": "no-repeat"
				}
			},
			"background-color": {
				types: [
					"Color"
				],
				"default": [
					"transparent"
				],
				multiple: true,
				keywords: [
				]
			},
			"background-image": {
				types: [
					"UrlFunc"
				],
				"default": [
					"none"
				],
				keywords: [
					"none"
				]
			},
			"background-attachment": {
				types: [
				],
				"default": [
					"scroll"
				],
				multiple: true,
				keywords: [
					"scroll",
					"fixed",
					"local"
				]
			},
			"background-clip": {
				types: [
				],
				"default": [
					"border-box"
				],
				multiple: true,
				keywords: [
					"border-box",
					"padding-box",
					"content-box",
					"text"
				]
			},
			"background-origin": {
				types: [
				],
				"default": [
					"padding-box"
				],
				multiple: true,
				keywords: [
					"border-box",
					"padding-box",
					"content-box"
				]
			},
			"background-position": {
				multiple: true,
				types: [
					"Perc",
					"Length"
				],
				"default": [
					"0 0",
					"top left",
					"left top"
				],
				keywords: [
					"top",
					"left",
					"center",
					"bottom",
					"right"
				],
				mapping: {
					left: "0",
					top: "0",
					center: "50%",
					bottom: "100%",
					right: "100%"
				},
				constraints: {
					mapping: {
						max: 2
					}
				}
			},
			"background-size": {
				multiple: true,
				previous: "background-position",
				prefix: {
					typ: "Literal",
					val: "/"
				},
				types: [
					"Perc",
					"Length"
				],
				"default": [
					"auto",
					"auto auto"
				],
				keywords: [
					"auto",
					"cover",
					"contain"
				],
				mapping: {
					"auto auto": "auto"
				}
			}
		}
	},
	"background-repeat": {
		shorthand: "background"
	},
	"background-color": {
		shorthand: "background"
	},
	"background-image": {
		shorthand: "background"
	},
	"background-attachment": {
		shorthand: "background"
	},
	"background-clip": {
		shorthand: "background"
	},
	"background-origin": {
		shorthand: "background"
	},
	"background-position": {
		shorthand: "background"
	},
	"background-size": {
		shorthand: "background"
	}
};
var config$1 = {
	properties: properties,
	map: map
};

const getConfig = () => config$1;

const funcList = ['clamp', 'calc'];
function matchType(val, properties) {
    if (val.typ == 'Iden' && properties.keywords.includes(val.val) ||
        (properties.types.includes(val.typ))) {
        return true;
    }
    if (val.typ == 'Number' && val.val == '0') {
        return properties.types.some(type => type == 'Length' || type == 'Angle');
    }
    if (val.typ == 'Func' && funcList.includes(val.val)) {
        return val.chi.every((t => ['Literal', 'Comma', 'Whitespace', 'Start-parens', 'End-parens'].includes(t.typ) || matchType(t, properties)));
    }
    return false;
}

function eq(a, b) {
    if (a == null || b == null) {
        return a == b;
    }
    if (typeof a != 'object' || typeof b != 'object') {
        return a === b;
    }
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
        return false;
    }
    if (Array.isArray(a)) {
        if (a.length != b.length) {
            return false;
        }
        let i = 0;
        for (; i < a.length; i++) {
            if (!eq(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    const k1 = Object.keys(a);
    const k2 = Object.keys(b);
    if (k1.length != k2.length) {
        return false;
    }
    let key;
    for (key of k1) {
        if (!eq(a[key], b[key])) {
            return false;
        }
    }
    return true;
}

class PropertySet {
    config;
    declarations;
    constructor(config) {
        this.config = config;
        this.declarations = new Map;
    }
    add(declaration) {
        if (declaration.nam == this.config.shorthand) {
            this.declarations = new Map;
        }
        else {
            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                let isValid = true;
                let current = -1;
                const tokens = [];
                // @ts-ignore
                for (let token of this.declarations.get(this.config.shorthand).val) {
                    if (this.config.types.includes(token.typ) || (token.typ == 'Number' && token.val == '0' &&
                        (this.config.types.includes('Length') ||
                            this.config.types.includes('Angle') ||
                            this.config.types.includes('Dimension')))) {
                        if (tokens.length == 0) {
                            tokens.push([]);
                            current++;
                        }
                        tokens[current].push(token);
                        continue;
                    }
                    if (token.typ != 'Whitespace' && token.typ != 'Comment') {
                        if (token.typ == 'Iden' && this.config.keywords.includes(token.val)) {
                            if (tokens.length == 0) {
                                tokens.push([]);
                                current++;
                            }
                            tokens[current].push(token);
                        }
                        if (token.typ == 'Literal' && token.val == this.config.separator) {
                            tokens.push([]);
                            current++;
                            continue;
                        }
                        isValid = false;
                        break;
                    }
                }
                if (isValid && tokens.length > 0) {
                    this.declarations.delete(this.config.shorthand);
                    for (const values of tokens) {
                        this.config.properties.forEach((property, index) => {
                            if (!this.declarations.has(property)) {
                                this.declarations.set(property, {
                                    typ: 'Declaration',
                                    nam: property,
                                    val: []
                                });
                            }
                            while (index > 0 && index >= values.length) {
                                if (index > 1) {
                                    index %= 2;
                                }
                                else {
                                    index = 0;
                                    break;
                                }
                            }
                            // @ts-ignore
                            const val = this.declarations.get(property).val;
                            if (val.length > 0) {
                                val.push({ typ: 'Whitespace' });
                            }
                            val.push({ ...values[index] });
                        });
                    }
                }
                this.declarations.set(declaration.nam, declaration);
                return this;
            }
        }
        this.declarations.set(declaration.nam, declaration);
        return this;
    }
    isShortHand() {
        if (this.declarations.has(this.config.shorthand)) {
            return this.declarations.size == 1;
        }
        return this.config.properties.length == this.declarations.size;
    }
    [Symbol.iterator]() {
        let iterator;
        const declarations = this.declarations;
        if (declarations.size < this.config.properties.length) {
            iterator = declarations.values();
        }
        else {
            const values = [];
            this.config.properties.forEach((property) => {
                let index = 0;
                // @ts-ignore
                for (const token of this.declarations.get(property).val) {
                    if (token.typ == 'Whitespace') {
                        continue;
                    }
                    if (values.length == index) {
                        values.push([]);
                    }
                    values[index].push(token);
                    index++;
                }
            });
            for (const value of values) {
                let i = value.length;
                while (i-- > 1) {
                    const t = value[i];
                    const k = value[i == 1 ? 0 : i % 2];
                    if (t.val == k.val && t.val == '0') {
                        if ((t.typ == 'Number' && isLength(k)) ||
                            (k.typ == 'Number' && isLength(t)) ||
                            (isLength(k) || isLength(t))) {
                            value.splice(i, 1);
                            continue;
                        }
                    }
                    if (eq(t, k)) {
                        value.splice(i, 1);
                        continue;
                    }
                    break;
                }
            }
            iterator = [{
                    typ: 'Declaration',
                    nam: this.config.shorthand,
                    val: values.reduce((acc, curr) => {
                        if (curr.length > 1) {
                            const k = curr.length * 2 - 1;
                            let i = 1;
                            while (i < k) {
                                curr.splice(i, 0, { typ: 'Whitespace' });
                                i += 2;
                            }
                        }
                        if (acc.length > 0) {
                            acc.push({ typ: 'Literal', val: this.config.separator });
                        }
                        acc.push(...curr);
                        return acc;
                    }, [])
                }][Symbol.iterator]();
            // return {
            //     next() {
            //
            //         return iterator.next();
            //     }
            // }
        }
        return iterator;
        // return {
        //     next() {
        //
        //         return iterator.next();
        //     }
        // }
    }
}

function* tokenize(iterator) {
    let ind = -1;
    let lin = 1;
    let col = 0;
    const position = {
        ind: Math.max(ind, 0),
        lin: lin,
        col: Math.max(col, 1)
    };
    let value;
    let buffer = '';
    function consumeWhiteSpace() {
        let count = 0;
        while (isWhiteSpace(iterator.charAt(count + ind + 1).charCodeAt(0))) {
            count++;
        }
        next(count);
        return count;
    }
    function pushToken(token, hint) {
        const result = { token, hint, position: { ...position }, bytesIn: ind };
        position.ind = ind;
        position.lin = lin;
        position.col = col == 0 ? 1 : col;
        return result;
    }
    function* consumeString(quoteStr) {
        const quote = quoteStr;
        let value;
        let hasNewLine = false;
        if (buffer.length > 0) {
            yield pushToken(buffer);
            buffer = '';
        }
        buffer += quoteStr;
        while (value = peek()) {
            if (value == '\\') {
                const sequence = peek(6);
                let escapeSequence = '';
                let codepoint;
                let i;
                for (i = 1; i < sequence.length; i++) {
                    codepoint = sequence.charCodeAt(i);
                    if (codepoint == 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)) {
                        escapeSequence += sequence[i];
                        if (codepoint == 0x20) {
                            break;
                        }
                        continue;
                    }
                    break;
                }
                if (i == 1) {
                    buffer += value + sequence[i];
                    next(2);
                    continue;
                }
                if (escapeSequence.trimEnd().length > 0) {
                    const codepoint = Number(`0x${escapeSequence.trimEnd()}`);
                    if (codepoint == 0 ||
                        // leading surrogate
                        (0xD800 <= codepoint && codepoint <= 0xDBFF) ||
                        // trailing surrogate
                        (0xDC00 <= codepoint && codepoint <= 0xDFFF)) {
                        buffer += String.fromCodePoint(0xFFFD);
                    }
                    else {
                        buffer += String.fromCodePoint(codepoint);
                    }
                    next(escapeSequence.length + 1 + (isWhiteSpace(peek()?.charCodeAt(0)) ? 1 : 0));
                    continue;
                }
                buffer += next(2);
                continue;
            }
            if (value == quote) {
                buffer += value;
                yield pushToken(buffer, hasNewLine ? 'Bad-string' : 'String');
                next();
                // i += value.length;
                buffer = '';
                return;
            }
            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }
            if (hasNewLine && value == ';') {
                yield pushToken(buffer + value, 'Bad-string');
                buffer = '';
                next();
                break;
            }
            buffer += value;
            next();
        }
        if (hasNewLine) {
            yield pushToken(buffer, 'Bad-string');
        }
        else {
            // EOF - 'Unclosed-string' fixed
            yield pushToken(buffer + quote, 'String');
        }
        buffer = '';
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
        while (count-- > 0 && ind < iterator.length) {
            const codepoint = iterator.charCodeAt(++ind);
            if (isNaN(codepoint)) {
                return char;
            }
            char += iterator.charAt(ind);
            if (isNewLine(codepoint)) {
                lin++;
                col = 0;
            }
            else {
                col++;
            }
        }
        return char;
    }
    while (value = next()) {
        if (isWhiteSpace(value.charCodeAt(0))) {
            if (buffer.length > 0) {
                yield pushToken(buffer);
                buffer = '';
            }
            while (value = next()) {
                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }
            yield pushToken('', 'Whitespace');
            buffer = '';
        }
        switch (value) {
            case '/':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                    if (peek() != '*') {
                        yield pushToken(value);
                        break;
                    }
                }
                buffer += value;
                if (peek() == '*') {
                    buffer += next();
                    while (value = next()) {
                        if (value == '*') {
                            buffer += value;
                            if (peek() == '/') {
                                yield pushToken(buffer + next(), 'Comment');
                                buffer = '';
                                break;
                            }
                        }
                        else {
                            buffer += value;
                        }
                    }
                    yield pushToken(buffer, 'Bad-comment');
                    buffer = '';
                }
                break;
            case '<':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (peek() == '=') {
                    yield pushToken('', 'Lte');
                    next();
                    break;
                }
                buffer += value;
                if (peek(3) == '!--') {
                    buffer += next(3);
                    while (value = next()) {
                        buffer += value;
                        if (value == '-' && peek(2) == '->') {
                            break;
                        }
                    }
                    if (value === '') {
                        yield pushToken(buffer, 'Bad-cdo');
                    }
                    else {
                        yield pushToken(buffer + next(2), 'CDOCOMM');
                    }
                    buffer = '';
                }
                break;
            case '\\':
                // EOF
                if (!(value = next())) {
                    // end of stream ignore \\
                    yield pushToken(buffer);
                    buffer = '';
                    break;
                }
                buffer += prev() + value;
                break;
            case '"':
            case "'":
                yield* consumeString(value);
                break;
            case '~':
            case '|':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                buffer += value;
                if (!(value = next())) {
                    yield pushToken(buffer);
                    buffer = '';
                    break;
                }
                if (value == '=') {
                    buffer += value;
                    yield pushToken(buffer, buffer[0] == '~' ? 'Includes' : 'Dash-matches');
                    buffer = '';
                    break;
                }
                yield pushToken(buffer);
                while (isWhiteSpace(value.charCodeAt(0))) {
                    value = next();
                }
                buffer = value;
                break;
            case '>':
                if (buffer !== '') {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (peek() == '=') {
                    yield pushToken('', 'Gte');
                    next();
                }
                else {
                    yield pushToken('', 'Gt');
                }
                consumeWhiteSpace();
                break;
            case '.':
                const codepoint = peek().charCodeAt(0);
                if (!isDigit(codepoint) && buffer !== '') {
                    yield pushToken(buffer);
                    buffer = value;
                    break;
                }
                buffer += value;
                break;
            case '+':
            case ':':
            case ',':
            case '=':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (value == ':' && ':' == peek()) {
                    buffer += value + next();
                    break;
                }
                yield pushToken(value);
                buffer = '';
                if (value == '+' && isWhiteSpace(peek().charCodeAt(0))) {
                    yield pushToken(next());
                }
                while (isWhiteSpace(peek().charCodeAt(0))) {
                    next();
                }
                break;
            case ')':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                yield pushToken('', 'End-parens');
                break;
            case '(':
                if (buffer.length == 0) {
                    yield pushToken(value);
                    break;
                }
                buffer += value;
                // @ts-ignore
                if (buffer == 'url(') {
                    yield pushToken(buffer);
                    buffer = '';
                    consumeWhiteSpace();
                    value = peek();
                    let cp;
                    let whitespace = '';
                    let hasWhiteSpace = false;
                    let errorState = false;
                    if (value == '"' || value == "'") {
                        const quote = value;
                        let inquote = true;
                        let hasNewLine = false;
                        buffer = next();
                        while (value = next()) {
                            cp = value.charCodeAt(0);
                            // consume an invalid string
                            if (inquote) {
                                buffer += value;
                                if (isNewLine(cp)) {
                                    hasNewLine = true;
                                    while (value = next()) {
                                        buffer += value;
                                        if (value == ';') {
                                            inquote = false;
                                            break;
                                        }
                                    }
                                    if (value === '') {
                                        yield pushToken(buffer, 'Bad-string');
                                        buffer = '';
                                        break;
                                    }
                                    cp = value.charCodeAt(0);
                                }
                                // '\\'
                                if (cp == 0x5c) {
                                    buffer += next();
                                }
                                else if (value == quote) {
                                    inquote = false;
                                }
                                continue;
                            }
                            if (!inquote) {
                                if (isWhiteSpace(cp)) {
                                    whitespace += value;
                                    while (value = peek()) {
                                        hasWhiteSpace = true;
                                        if (isWhiteSpace(value?.charCodeAt(0))) {
                                            whitespace += next();
                                            continue;
                                        }
                                        break;
                                    }
                                    if (!(value = next())) {
                                        yield pushToken(buffer, hasNewLine ? 'Bad-url-token' : 'Url-token');
                                        buffer = '';
                                        break;
                                    }
                                }
                                cp = value.charCodeAt(0);
                                // ')'
                                if (cp == 0x29) {
                                    yield pushToken(buffer, hasNewLine ? 'Bad-string' : 'String');
                                    yield pushToken('', 'End-parens');
                                    buffer = '';
                                    break;
                                }
                                while (value = next()) {
                                    cp = value.charCodeAt(0);
                                    if (cp == 0x5c) {
                                        buffer += value + next();
                                        continue;
                                    }
                                    if (cp == 0x29) {
                                        yield pushToken(buffer, 'Bad-string');
                                        yield pushToken('', 'End-parens');
                                        buffer = '';
                                        break;
                                    }
                                    buffer += value;
                                }
                                if (hasNewLine) {
                                    yield pushToken(buffer, 'Bad-string');
                                    buffer = '';
                                }
                                break;
                            }
                            buffer += value;
                        }
                        break;
                    }
                    else {
                        buffer = '';
                        while (value = next()) {
                            cp = value.charCodeAt(0);
                            // ')'
                            if (cp == 0x29) {
                                yield pushToken(buffer, 'Url-token');
                                yield pushToken('', 'End-parens');
                                buffer = '';
                                break;
                            }
                            if (isWhiteSpace(cp)) {
                                hasWhiteSpace = true;
                                whitespace = value;
                                while (isWhiteSpace(peek()?.charCodeAt(0))) {
                                    whitespace += next();
                                }
                                continue;
                            }
                            if (isNonPrintable(cp) ||
                                // '"'
                                cp == 0x22 ||
                                // "'"
                                cp == 0x27 ||
                                // \('
                                cp == 0x28 ||
                                hasWhiteSpace) {
                                errorState = true;
                            }
                            if (errorState) {
                                buffer += whitespace + value;
                                while (value = peek()) {
                                    cp = value.charCodeAt(0);
                                    if (cp == 0x5c) {
                                        buffer += next(2);
                                        continue;
                                    }
                                    // ')'
                                    if (cp == 0x29) {
                                        break;
                                    }
                                    buffer += next();
                                }
                                yield pushToken(buffer, 'Bad-url-token');
                                buffer = '';
                                break;
                            }
                            buffer += value;
                        }
                    }
                    if (buffer !== '') {
                        yield pushToken(buffer, 'Url-token');
                        buffer = '';
                        break;
                    }
                    break;
                }
                yield pushToken(buffer);
                buffer = '';
                break;
            case '[':
            case ']':
            case '{':
            case '}':
            case ';':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                yield pushToken(value);
                break;
            case '!':
                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                if (peek(9) == 'important') {
                    yield pushToken('', 'Important');
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
        yield pushToken(buffer);
    }
    // yield pushToken('', 'EOF');
}

const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const trimWhiteSpace = ['Gt', 'Gte', 'Lt', 'Lte'];
const funcLike = ['Start-parens', 'Func', 'UrlFunc', 'Pseudo-class-func'];
/**
 *
 * @param iterator
 * @param opt
 */
async function parse$1(iterator, opt = {}) {
    const startTime = performance.now();
    const errors = [];
    const options = {
        src: '',
        sourcemap: false,
        minify: true,
        nestingRules: false,
        resolveImport: false,
        resolveUrls: false,
        removeEmpty: true,
        ...opt
    };
    if (options.resolveImport) {
        options.resolveUrls = true;
    }
    const src = options.src;
    const stack = [];
    const ast = {
        typ: "StyleSheet",
        chi: []
    };
    let tokens = [];
    let map = new Map;
    let bytesIn = 0;
    let context = ast;
    if (options.sourcemap) {
        ast.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1
            },
            src: ''
        };
    }
    async function parseNode(results) {
        let tokens = results.map(mapToken);
        let i;
        let loc;
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == 'Comment' || tokens[i].typ == 'CDOCOMM') {
                const position = map.get(tokens[i]);
                if (tokens[i].typ == 'CDOCOMM' && context.typ != 'StyleSheet') {
                    errors.push({ action: 'drop', message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`, location: { src, ...position } });
                    continue;
                }
                loc = {
                    sta: position,
                    src
                };
                // @ts-ignore
                context.chi.push(tokens[i]);
                if (options.sourcemap) {
                    tokens[i].loc = loc;
                }
            }
            else if (tokens[i].typ != 'Whitespace') {
                break;
            }
        }
        tokens = tokens.slice(i);
        if (tokens.length == 0) {
            return null;
        }
        let delim = tokens.at(-1);
        if (delim.typ == 'Semi-colon' || delim.typ == 'Block-start' || delim.typ == 'Block-end') {
            tokens.pop();
        }
        else {
            delim = { typ: 'Semi-colon' };
        }
        // @ts-ignore
        while (['Whitespace', 'Bad-string', 'Bad-comment'].includes(tokens.at(-1)?.typ)) {
            tokens.pop();
        }
        if (tokens.length == 0) {
            return null;
        }
        if (tokens[0]?.typ == 'At-rule') {
            const atRule = tokens.shift();
            const position = map.get(atRule);
            if (atRule.val == 'charset' && position.ind > 0) {
                errors.push({ action: 'drop', message: 'parse: invalid @charset', location: { src, ...position } });
                return null;
            }
            // @ts-ignore
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
                if (tokens[0]?.typ != 'String' && tokens[0]?.typ != 'UrlFunc') {
                    errors.push({ action: 'drop', message: 'parse: invalid @import', location: { src, ...position } });
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1]?.typ != 'Url-token' && tokens[1]?.typ != 'String') {
                    errors.push({ action: 'drop', message: 'parse: invalid @import', location: { src, ...position } });
                    return null;
                }
            }
            if (atRule.val == 'import') {
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1].typ == 'Url-token') {
                    tokens.shift();
                    // @ts-ignore
                    tokens[0].typ = 'String';
                    // @ts-ignore
                    tokens[0].val = `"${tokens[0].val}"`;
                }
                // @ts-ignore
                if (tokens[0].typ == 'String') {
                    if (options.resolveImport) {
                        const url = tokens[0].val.slice(1, -1);
                        try {
                            // @ts-ignore
                            const root = await options.load(url, options.src).then((src) => {
                                return parse$1(src, Object.assign({}, options, {
                                    minify: false,
                                    // @ts-ignore
                                    src: options.resolve(url, options.src).absolute
                                }));
                            });
                            bytesIn += root.stats.bytesIn;
                            if (root.ast.chi.length > 0) {
                                context.chi.push(...root.ast.chi);
                            }
                            if (root.errors.length > 0) {
                                errors.push(...root.errors);
                            }
                            return null;
                        }
                        catch (error) {
                            // @ts-ignore
                            errors.push({ action: 'ignore', message: 'parse: ' + error.message, error });
                        }
                    }
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack
            const raw = parseTokens(tokens, { minify: options.minify }).reduce((acc, curr) => {
                acc.push(renderToken(curr, { removeComments: true }));
                return acc;
            }, []);
            const node = {
                typ: 'AtRule',
                nam: renderToken(atRule, { removeComments: true }),
                val: raw.join('')
            };
            Object.defineProperty(node, 'raw', { enumerable: false, configurable: true, writable: true, value: raw });
            if (delim.typ == 'Block-start') {
                node.chi = [];
            }
            loc = {
                sta: position,
                src
            };
            if (options.sourcemap) {
                node.loc = loc;
            }
            // @ts-ignore
            context.chi.push(node);
            return delim.typ == 'Block-start' ? node : null;
        }
        else {
            // rule
            if (delim.typ == 'Block-start') {
                const position = map.get(tokens[0]);
                const uniq = new Map;
                parseTokens(tokens, { minify: options.minify }).reduce((acc, curr, index, array) => {
                    if (curr.typ == 'Whitespace') {
                        if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                            trimWhiteSpace.includes(array[index + 1]?.typ) ||
                            combinators.includes(array[index - 1]?.val) ||
                            combinators.includes(array[index + 1]?.val)) {
                            return acc;
                        }
                    }
                    let t = renderToken(curr, { minify: true });
                    if (t == ',') {
                        acc.push([]);
                    }
                    else {
                        acc[acc.length - 1].push(t);
                    }
                    return acc;
                }, [[]]).reduce((acc, curr) => {
                    acc.set(curr.join(''), curr);
                    return acc;
                }, uniq);
                const node = {
                    typ: 'Rule',
                    // @ts-ignore
                    sel: [...uniq.keys()].join(','),
                    chi: []
                };
                let raw = [...uniq.values()];
                Object.defineProperty(node, 'raw', { enumerable: false, configurable: true, writable: true, value: raw });
                loc = {
                    sta: position,
                    src
                };
                if (options.sourcemap) {
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
                        value = parseTokens(tokens.slice(i + 1), {
                            parseColor: true,
                            src: options.src,
                            resolveUrls: options.resolveUrls,
                            resolve: options.resolve,
                            cwd: options.cwd
                        });
                    }
                }
                if (name == null) {
                    name = tokens;
                }
                const position = map.get(name[0]);
                if (name.length > 0) {
                    for (let i = 1; i < name.length; i++) {
                        if (name[i].typ != 'Whitespace' && name[i].typ != 'Comment') {
                            errors.push({
                                action: 'drop',
                                message: 'parse: invalid declaration',
                                location: { src, ...position }
                            });
                            return null;
                        }
                    }
                }
                if (value == null) {
                    errors.push({
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: { src, ...position }
                    });
                    return null;
                }
                if (value.length == 0) {
                    errors.push({
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: { src, ...position }
                    });
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
                    errors.push({
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: { src, ...position }
                    });
                    return null;
                }
                // @ts-ignore
                context.chi.push(node);
                return null;
            }
        }
    }
    function mapToken(token) {
        const node = getTokenType(token.token, token.hint);
        map.set(node, token.position);
        return node;
    }
    const iter = tokenize(iterator);
    let item;
    while (item = iter.next().value) {
        bytesIn = item.bytesIn;
        // parse error
        if (item.hint != null && item.hint.startsWith('Bad-')) {
            // bad token
            continue;
        }
        tokens.push(item);
        if (item.token == ';' || item.token == '{') {
            let node = await parseNode(tokens);
            if (node != null) {
                stack.push(node);
                // @ts-ignore
                context = node;
            }
            else if (item.token == '{') {
                // node == null
                // consume and throw away until the closing '}' or EOF
                let inBlock = 1;
                do {
                    item = iter.next().value;
                    if (item == null) {
                        break;
                    }
                    if (item.token == '{') {
                        inBlock++;
                    }
                    else if (item.token == '}') {
                        inBlock--;
                    }
                } while (inBlock != 0);
            }
            tokens = [];
            map = new Map;
        }
        else if (item.token == '}') {
            await parseNode(tokens);
            const previousNode = stack.pop();
            // @ts-ignore
            context = stack[stack.length - 1] || ast;
            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }
            tokens = [];
            map = new Map;
        }
    }
    if (tokens.length > 0) {
        await parseNode(tokens);
    }
    while (stack.length > 0 && context != ast) {
        const previousNode = stack.pop();
        // @ts-ignore
        context = stack[stack.length - 1] || ast;
        // @ts-ignore
        if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
            context.chi.pop();
            continue;
        }
        break;
    }
    const endParseTime = performance.now();
    if (options.minify) {
        if (ast.chi.length > 0) {
            minify(ast, options, true, errors);
        }
    }
    const endTime = performance.now();
    return {
        ast,
        errors,
        stats: {
            bytesIn,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
}
function parseString(src, options = { location: false }) {
    return parseTokens([...tokenize(src)].map(t => {
        const token = getTokenType(t.token, t.hint);
        if (options.location) {
            Object.assign(token, { loc: t.position });
        }
        return token;
    }));
}
function getTokenType(val, hint) {
    if (val === '' && hint == null) {
        throw new Error('empty string?');
    }
    if (hint != null) {
        return ([
            'Whitespace', 'Semi-colon', 'Colon', 'Block-start',
            'Block-start', 'Attr-start', 'Attr-end', 'Start-parens', 'End-parens',
            'Comma', 'Gt', 'Lt', 'Gte', 'Lte', 'EOF'
        ].includes(hint) ? { typ: hint } : { typ: hint, val });
    }
    if (val == ' ') {
        return { typ: 'Whitespace' };
    }
    if (val == ';') {
        return { typ: 'Semi-colon' };
    }
    if (val == '{') {
        return { typ: 'Block-start' };
    }
    if (val == '}') {
        return { typ: 'Block-end' };
    }
    if (val == '[') {
        return { typ: 'Attr-start' };
    }
    if (val == ']') {
        return { typ: 'Attr-end' };
    }
    if (val == ':') {
        return { typ: 'Colon' };
    }
    if (val == ')') {
        return { typ: 'End-parens' };
    }
    if (val == '(') {
        return { typ: 'Start-parens' };
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
        return val.endsWith('(') ? {
            typ: 'Pseudo-class-func',
            val: val.slice(0, -1),
            chi: []
        }
            : {
                typ: 'Pseudo-class',
                val
            };
    }
    if (isAtKeyword(val)) {
        return {
            typ: 'At-rule',
            val: val.slice(1)
        };
    }
    if (isFunction(val)) {
        val = val.slice(0, -1);
        return {
            typ: val == 'url' ? 'UrlFunc' : 'Func',
            val,
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
    const v = val.toLowerCase();
    if (v == 'currentcolor' || val == 'transparent' || v in COLORS_NAMES) {
        return {
            typ: 'Color',
            val,
            kin: 'lit'
        };
    }
    if (isIdent(val)) {
        return {
            typ: 'Iden',
            val
        };
    }
    if (val.charAt(0) == '#' && isHexColor(val)) {
        return {
            typ: 'Color',
            val,
            kin: 'hex'
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
function parseTokens(tokens, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.typ == 'Whitespace' && ((i == 0 ||
            i + 1 == tokens.length ||
            ['Comma', 'Gte', 'Lte'].includes(tokens[i + 1].typ)) ||
            (i > 0 &&
                // tokens[i + 1]?.typ != 'Literal' ||
                // funcLike.includes(tokens[i - 1].typ) &&
                // !['var', 'calc'].includes((<FunctionToken>tokens[i - 1]).val)))) &&
                trimWhiteSpace.includes(tokens[i - 1].typ)))) {
            tokens.splice(i--, 1);
            continue;
        }
        if (t.typ == 'Colon') {
            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == 'Func') {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = 'Pseudo-class-func';
                }
                else if (typ == 'Iden') {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = 'Pseudo-class';
                }
                if (typ == 'Func' || typ == 'Iden') {
                    tokens.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        if (t.typ == 'Attr-start') {
            let k = i;
            let inAttr = 1;
            while (++k < tokens.length) {
                if (tokens[k].typ == 'Attr-end') {
                    inAttr--;
                }
                else if (tokens[k].typ == 'Attr-start') {
                    inAttr++;
                }
                if (inAttr == 0) {
                    break;
                }
            }
            Object.assign(t, { typ: 'Attr', chi: tokens.splice(i + 1, k - i) });
            // @ts-ignore
            if (t.chi.at(-1).typ == 'Attr-end') {
                // @ts-ignore
                t.chi.pop();
                // @ts-ignore
                if (t.chi.length > 1) {
                    /*(<AttrToken>t).chi =*/
                    // @ts-ignore
                    parseTokens(t.chi, t.typ);
                }
                // @ts-ignore
                t.chi.forEach(val => {
                    if (val.typ == 'String') {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: 'Iden', val: slice });
                        }
                    }
                });
            }
            continue;
        }
        if (funcLike.includes(t.typ)) {
            let parens = 1;
            let k = i;
            while (++k < tokens.length) {
                if (tokens[k].typ == 'Colon') {
                    const typ = tokens[k + 1]?.typ;
                    if (typ != null) {
                        if (typ == 'Iden') {
                            tokens[k + 1].typ = 'Pseudo-class';
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        else if (typ == 'Func') {
                            tokens[k + 1].typ = 'Pseudo-class-func';
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        if (typ == 'Func' || typ == 'Iden') {
                            tokens.splice(k, 1);
                            k--;
                            continue;
                        }
                    }
                }
                if (funcLike.includes(tokens[k].typ)) {
                    parens++;
                }
                else if (tokens[k].typ == 'End-parens') {
                    parens--;
                }
                if (parens == 0) {
                    break;
                }
            }
            // @ts-ignore
            t.chi = tokens.splice(i + 1, k - i);
            // @ts-ignore
            if (t.chi.at(-1)?.typ == 'End-parens') {
                // @ts-ignore
                t.chi.pop();
            }
            // @ts-ignore
            if (options.parseColor && t.typ == 'Func' && isColor(t)) {
                // if (isColor) {
                // @ts-ignore
                t.typ = 'Color';
                // @ts-ignore
                t.kin = t.val;
                // @ts-ignore
                let m = t.chi.length;
                while (m-- > 0) {
                    // @ts-ignore
                    if (['Literal'].concat(trimWhiteSpace).includes(t.chi[m].typ)) {
                        // @ts-ignore
                        if (t.chi[m + 1]?.typ == 'Whitespace') {
                            // @ts-ignore
                            t.chi.splice(m + 1, 1);
                        }
                        // @ts-ignore
                        if (t.chi[m - 1]?.typ == 'Whitespace') {
                            // @ts-ignore
                            t.chi.splice(m - 1, 1);
                            m--;
                        }
                    }
                }
                continue;
                // }
            }
            if (t.typ == 'UrlFunc') {
                // @ts-ignore
                if (t.chi[0]?.typ == 'String') {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);
                    // @ts-ignore
                    if (t.chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        t.chi[0].typ = 'Url-token';
                        // @ts-ignore
                        t.chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                    }
                }
                if (t.chi[0]?.typ == 'Url-token') {
                    if (options.src !== '' && options.resolveUrls) {
                        // @ts-ignore
                        t.chi[0].val = options.resolve(t.chi[0].val, options.src, options.cwd).relative;
                    }
                }
            }
            // @ts-ignore
            if (t.chi.length > 0) {
                // @ts-ignore
                parseTokens(t.chi, options);
                if (t.typ == 'Pseudo-class-func' && t.val == ':is' && options.minify) {
                    //
                    const count = t.chi.filter(t => t.typ != 'Comment').length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == 'Comma' || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == 'Comma' && (tokens[i + 1]?.typ == 'Comma' || tokens.length == i + 1))) {
                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }
            continue;
        }
        if (options.parseColor) {
            if (t.typ == 'Iden') {
                // named color
                const value = t.val.toLowerCase();
                if (value in COLORS_NAMES) {
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
            }
        }
    }
    return tokens;
}

const propertiesConfig = getConfig();
class PropertyMap {
    config;
    declarations;
    requiredCount;
    pattern;
    constructor(config) {
        const values = Object.values(config.properties);
        this.requiredCount = values.reduce((acc, curr) => curr.required ? ++acc : acc, 0) || values.length;
        this.config = config;
        this.declarations = new Map;
        this.pattern = config.pattern.split(/\s/);
    }
    add(declaration) {
        for (const val of declaration.val) {
            Object.defineProperty(val, 'propertyName', { enumerable: false, writable: true, value: declaration.nam });
        }
        if (declaration.nam == this.config.shorthand) {
            this.declarations = new Map;
            this.declarations.set(declaration.nam, declaration);
        }
        else {
            const separator = this.config.separator;
            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                const tokens = {};
                const values = [];
                // @ts-ignore
                this.declarations.get(this.config.shorthand).val.slice().reduce((acc, curr) => {
                    if (separator != null && separator.typ == curr.typ && eq(separator, curr)) {
                        acc.push([]);
                        return acc;
                    }
                    // else {
                    // @ts-ignore
                    acc.at(-1).push(curr);
                    // }
                    return acc;
                }, [[]]).
                    // @ts-ignore
                    reduce((acc, list, current) => {
                    values.push(...this.pattern.reduce((acc, property) => {
                        // let current: number = 0;
                        const props = this.config.properties[property];
                        for (let i = 0; i < acc.length; i++) {
                            if (acc[i].typ == 'Comment' || acc[i].typ == 'Whitespace') {
                                acc.splice(i, 1);
                                i--;
                                continue;
                            }
                            // @ts-ignore
                            if (('propertyName' in acc[i] && acc[i].propertyName == property) || matchType(acc[i], props)) {
                                if ('prefix' in props && props.previous != null && !(props.previous in tokens)) {
                                    return acc;
                                }
                                if (!(property in tokens)) {
                                    tokens[property] = [[acc[i]]];
                                }
                                else {
                                    if (current == tokens[property].length) {
                                        tokens[property].push([acc[i]]);
                                        // tokens[property][current].push();
                                    }
                                    else {
                                        tokens[property][current].push({ typ: 'Whitespace' }, acc[i]);
                                    }
                                }
                                acc.splice(i, 1);
                                i--;
                                // @ts-ignore
                                if ('prefix' in props && acc[i]?.typ == props.prefix.typ) {
                                    // @ts-ignore
                                    if (eq(acc[i], this.config.properties[property].prefix)) {
                                        acc.splice(i, 1);
                                        i--;
                                    }
                                }
                                if (props.multiple) {
                                    continue;
                                }
                                return acc;
                            }
                            else {
                                if (property in tokens && tokens[property].length > current) {
                                    return acc;
                                }
                            }
                        }
                        if (property in tokens && tokens[property].length > current) {
                            return acc;
                        }
                        // default
                        if (props.default.length > 0) {
                            const defaults = parseString(props.default[0]);
                            if (!(property in tokens)) {
                                tokens[property] = [
                                    [...defaults]
                                ];
                            }
                            else {
                                if (current == tokens[property].length) {
                                    tokens[property].push([]);
                                    tokens[property][current].push(...defaults);
                                }
                                else {
                                    tokens[property][current].push({ typ: 'Whitespace' }, ...defaults);
                                }
                            }
                        }
                        return acc;
                    }, list));
                    return values;
                }, []);
                if (values.length == 0) {
                    this.declarations = Object.entries(tokens).reduce((acc, curr) => {
                        acc.set(curr[0], {
                            typ: 'Declaration',
                            nam: curr[0],
                            val: curr[1].reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push({ ...separator });
                                }
                                acc.push(...curr);
                                return acc;
                            }, [])
                        });
                        return acc;
                    }, new Map);
                }
            }
            // @ts-ignore
            const config = propertiesConfig.properties[declaration.nam];
            let property = declaration.nam;
            if (config != null) {
                property = config.shorthand;
                let value = this.declarations.get(property);
                if (!(value instanceof PropertySet)) {
                    // @ts-ignore
                    this.declarations.set(property, new PropertySet(propertiesConfig.properties[config.shorthand]));
                    // Token[]
                    if (value != null) {
                        // @ts-ignore
                        this.declarations.get(property).add(value);
                    }
                }
                this.declarations.get(property).add(declaration);
            }
            else {
                this.declarations.set(declaration.nam, declaration);
            }
        }
        return this;
    }
    [Symbol.iterator]() {
        let iterable;
        let requiredCount = 0;
        let property;
        let isShorthand = true;
        for (property of Object.keys(this.config.properties)) {
            if (this.config.properties[property].required) {
                if (!this.declarations.has(property)) {
                    isShorthand = false;
                    break;
                }
                else {
                    const val = this.declarations.get(property);
                    if (val instanceof PropertySet && !val.isShortHand()) {
                        isShorthand = false;
                        break;
                    }
                    else {
                        requiredCount++;
                    }
                }
            }
        }
        if (requiredCount == 0) {
            requiredCount = this.declarations.size;
        }
        if (!isShorthand || requiredCount < this.requiredCount) {
            // @ts-ignore
            iterable = this.declarations.values();
        }
        else {
            let count = 0;
            let match;
            const separator = this.config.separator;
            const tokens = {};
            // @ts-ignore
            /* const valid: string[] =*/
            Object.entries(this.config.properties).reduce((acc, curr) => {
                if (!this.declarations.has(curr[0])) {
                    if (curr[1].required) {
                        acc.push(curr[0]);
                    }
                    return acc;
                }
                let current = 0;
                const props = this.config.properties[curr[0]];
                const properties = this.declarations.get(curr[0]);
                for (const declaration of [(properties instanceof PropertySet ? [...properties][0] : properties)]) {
                    // @ts-ignore
                    for (const val of declaration.val) {
                        if (separator != null && separator.typ == val.typ && eq(separator, val)) {
                            current++;
                            if (tokens[curr[0]].length == current) {
                                tokens[curr[0]].push([]);
                            }
                            continue;
                        }
                        if (val.typ == 'Whitespace' || val.typ == 'Comment') {
                            continue;
                        }
                        if (props.multiple && props.separator != null && props.separator.typ == val.typ && eq(props.separator, val)) {
                            continue;
                        }
                        // @ts-ignore
                        match = val.typ == 'Comment' || matchType(val, curr[1]);
                        if (isShorthand) {
                            isShorthand = match;
                        }
                        // @ts-ignore
                        if (('propertyName' in val && val.propertyName == property) || match) {
                            if (!(curr[0] in tokens)) {
                                tokens[curr[0]] = [[]];
                            }
                            // is default value
                            tokens[curr[0]][current].push(val);
                        }
                        else {
                            acc.push(curr[0]);
                            break;
                        }
                    }
                }
                if (count == 0) {
                    count = current;
                }
                return acc;
            }, []);
            count++;
            if (!isShorthand || Object.entries(this.config.properties).some(entry => {
                // missing required property
                return entry[1].required && !(entry[0] in tokens);
            }) ||
                // @ts-ignore
                !Object.values(tokens).every(v => v.filter(t => t.typ != 'Comment').length == count)) {
                // @ts-ignore
                iterable = this.declarations.values();
            }
            else {
                const values = Object.entries(tokens).reduce((acc, curr) => {
                    const props = this.config.properties[curr[0]];
                    for (let i = 0; i < curr[1].length; i++) {
                        if (acc.length == i) {
                            acc.push([]);
                        }
                        let values = curr[1][i].reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push({ typ: 'Whitespace' });
                            }
                            acc.push(curr);
                            return acc;
                        }, []);
                        // @todo remove renderToken call
                        if (props.default.includes(curr[1][i].reduce((acc, curr) => acc + renderToken(curr) + ' ', '').trimEnd())) {
                            continue;
                        }
                        let doFilterDefault = true;
                        if (curr[0] in propertiesConfig.properties) {
                            for (let v of values) {
                                if (!['Whitespace', 'Comment', 'Iden'].includes(v.typ)
                                    || (v.typ == 'Iden' && !this.config.properties[curr[0]].default.includes(v.val))) {
                                    doFilterDefault = false;
                                    break;
                                }
                            }
                        }
                        // remove default values
                        values = values.filter((val) => {
                            if (val.typ == 'Whitespace' || val.typ == 'Comment') {
                                return false;
                            }
                            return !doFilterDefault || !(val.typ == 'Iden' && props.default.includes(val.val));
                        });
                        if (values.length > 0) {
                            if ('mapping' in props) {
                                // @ts-ignore
                                if (!('constraints' in props) || !('max' in props.constraints) || values.length <= props.constraints.mapping.max) {
                                    let i = values.length;
                                    while (i--) {
                                        // @ts-ignore
                                        if (values[i].typ == 'Iden' && values[i].val in props.mapping) {
                                            // @ts-ignore
                                            values.splice(i, 1, ...parseString(props.mapping[values[i].val]));
                                        }
                                    }
                                }
                            }
                            if ('prefix' in props) {
                                // @ts-ignore
                                acc[i].push({ ...props.prefix });
                            }
                            else if (acc[i].length > 0) {
                                acc[i].push({ typ: 'Whitespace' });
                            }
                            acc[i].push(...values.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    // @ts-ignore
                                    acc.push({ ...(props.separator ?? { typ: 'Whitespace' }) });
                                }
                                // @ts-ignore
                                acc.push(curr);
                                return acc;
                            }, []));
                        }
                    }
                    return acc;
                }, []).reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push({ ...separator });
                    }
                    if (curr.length == 0 && this.config.default.length > 0) {
                        curr.push(...parseString(this.config.default[0]).reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push({ typ: 'Whitespace' });
                            }
                            acc.push(curr);
                            return acc;
                        }, []));
                    }
                    acc.push(...curr);
                    return acc;
                }, []);
                if (this.config.mapping != null) {
                    const val = values.reduce((acc, curr) => acc + renderToken(curr, { removeComments: true }), '');
                    if (val in this.config.mapping) {
                        values.length = 0;
                        // @ts-ignore
                        values.push({ typ: ['"', "'"].includes(val.charAt(0)) ? 'String' : 'Iden', val: this.config.mapping[val] });
                    }
                }
                iterable = [{
                        typ: 'Declaration',
                        nam: this.config.shorthand,
                        val: values
                    }][Symbol.iterator]();
            }
        }
        const iterators = [];
        return {
            // @ts-ignore
            next() {
                let v = iterable.next();
                while (v.done || v.value instanceof PropertySet) {
                    if (v.value instanceof PropertySet) {
                        // @ts-ignore
                        iterators.push(iterable);
                        iterable = v.value[Symbol.iterator]();
                        v = iterable.next();
                    }
                    if (v.done) {
                        if (iterators.length > 0) {
                            // @ts-ignore
                            iterable = iterators.pop();
                            v = iterable.next();
                        }
                        if (v.done && iterators.length == 0) {
                            break;
                        }
                    }
                }
                return v;
            }
        };
    }
}

const config = getConfig();
class PropertyList {
    declarations;
    constructor() {
        this.declarations = new Map;
    }
    set(nam, value) {
        return this.add({ typ: 'Declaration', nam, val: Array.isArray(value) ? value : parseString(String(value)) });
    }
    add(declaration) {
        if (declaration.typ != 'Declaration') {
            this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
            return this;
        }
        let propertyName = declaration.nam;
        let shortHandType;
        let shorthand;
        if (propertyName in config.properties) {
            // @ts-ignore
            if ('map' in config.properties[propertyName]) {
                shortHandType = 'map';
                // @ts-ignore
                shorthand = config.properties[propertyName].map;
            }
            else {
                shortHandType = 'set';
                // @ts-ignore
                shorthand = config.properties[propertyName].shorthand;
            }
        }
        else if (propertyName in config.map) {
            shortHandType = 'map';
            // @ts-ignore
            shorthand = config.map[propertyName].shorthand;
        }
        // @ts-ignore
        if (shortHandType == 'map') {
            // @ts-ignore
            if (!this.declarations.has(shorthand)) {
                // @ts-ignore
                this.declarations.set(shorthand, new PropertyMap(config.map[shorthand]));
            }
            // @ts-ignore
            this.declarations.get(shorthand).add(declaration);
            // return this;
        }
        // @ts-ignore
        else if (shortHandType == 'set') {
            // @ts-ignore
            // const shorthand: string = <string>config.properties[propertyName].shorthand;
            if (!this.declarations.has(shorthand)) {
                // @ts-ignore
                this.declarations.set(shorthand, new PropertySet(config.properties[shorthand]));
            }
            // @ts-ignore
            this.declarations.get(shorthand).add(declaration);
            // return this;
        }
        else {
            this.declarations.set(propertyName, declaration);
        }
        return this;
    }
    [Symbol.iterator]() {
        let iterator = this.declarations.values();
        const iterators = [];
        return {
            next() {
                let value = iterator.next();
                while ((value.done && iterators.length > 0) ||
                    value.value instanceof PropertySet ||
                    value.value instanceof PropertyMap) {
                    if (value.value instanceof PropertySet || value.value instanceof PropertyMap) {
                        iterators.unshift(iterator);
                        // @ts-ignore
                        iterator = value.value[Symbol.iterator]();
                        value = iterator.next();
                    }
                    if (value.done && iterators.length > 0) {
                        iterator = iterators.shift();
                        value = iterator.next();
                    }
                }
                return value;
            }
        };
    }
}

const combinators = ['+', '>', '~'];
const notEndingWith = ['(', '['].concat(combinators);
const definedPropertySettings = { configurable: true, enumerable: false, writable: true };
function minify(ast, options = {}, recursive = false, errors) {
    function wrapNodes(previous, node, match, ast, i, nodeIndex) {
        // @ts-ignore
        let pSel = match.selector1.reduce(reducer, []).join(',');
        // @ts-ignore
        let nSel = match.selector2.reduce(reducer, []).join(',');
        // @ts-ignore
        const wrapper = { ...previous, chi: [], sel: match.match.reduce(reducer, []).join(',') };
        // @ts-ignore
        Object.defineProperty(wrapper, 'raw', { ...definedPropertySettings,
            // @ts-ignore
            value: match.match.map(t => t.slice())
        });
        if (pSel == '&' || pSel === '') {
            // @ts-ignore
            wrapper.chi.push(...previous.chi);
            // @ts-ignore
            if ((nSel == '&' || nSel === '')) {
                // @ts-ignore
                wrapper.chi.push(...node.chi);
            }
            else {
                // @ts-ignore
                wrapper.chi.push(node);
            }
        }
        else {
            // @ts-ignore
            wrapper.chi.push(previous, node);
        }
        // @ts-ignore
        ast.chi.splice(i, 1, wrapper);
        // @ts-ignore
        ast.chi.splice(nodeIndex, 1);
        // @ts-ignore
        previous.sel = pSel;
        // @ts-ignore
        previous.raw = match.selector1;
        // @ts-ignore
        node.sel = nSel;
        // @ts-ignore
        node.raw = match.selector2;
        reduceRuleSelector(wrapper);
        return wrapper;
    }
    function reducer(acc, curr, index, array) {
        // trim :is()
        if (array.length == 1 && array[0][0] == ':is(' && array[0].at(-1) == ')') {
            curr = curr.slice(1, -1);
        }
        if (curr[0] == '&') {
            if (curr[1] == ' ' && !isIdent(curr[2]) && !isFunction(curr[2])) {
                curr.splice(0, 2);
            }
            else if (combinators.includes(curr[1])) {
                curr.splice(0, 1);
            }
        }
        else if (ast.typ == 'Rule' && (isIdent(curr[0]) || isFunction(curr[0]))) {
            curr.unshift('&', ' ');
        }
        acc.push(curr.join(''));
        return acc;
    }
    function diff(n1, n2, options = {}) {
        let node1 = n1;
        let node2 = n2;
        let exchanged = false;
        if (node1.chi.length > node2.chi.length) {
            const t = node1;
            node1 = node2;
            node2 = t;
            exchanged = true;
        }
        let i = node1.chi.length;
        let j = node2.chi.length;
        if (i == 0 || j == 0) {
            // @ts-ignore
            return null;
        }
        // @ts-ignore
        const raw1 = node1.raw;
        // @ts-ignore
        const raw2 = node2.raw;
        // @ts-ignore
        node1 = { ...node1, chi: node1.chi.slice() };
        node2 = { ...node2, chi: node2.chi.slice() };
        if (raw1 != null) {
            Object.defineProperty(node1, 'raw', { ...definedPropertySettings, value: raw1 });
        }
        if (raw2 != null) {
            Object.defineProperty(node2, 'raw', { ...definedPropertySettings, value: raw2 });
        }
        const intersect = [];
        while (i--) {
            if (node1.chi[i].typ == 'Comment') {
                continue;
            }
            j = node2.chi.length;
            if (j == 0) {
                break;
            }
            while (j--) {
                if (node2.chi[j].typ == 'Comment') {
                    continue;
                }
                if (node1.chi[i].nam == node2.chi[j].nam) {
                    if (eq(node1.chi[i], node2.chi[j])) {
                        intersect.push(node1.chi[i]);
                        node1.chi.splice(i, 1);
                        node2.chi.splice(j, 1);
                        break;
                    }
                }
            }
        }
        // @ts-ignore
        const result = (intersect.length == 0 ? null : {
            ...node1,
            // @ts-ignore
            sel: [...new Set([...(n1?.raw?.reduce(reducer, []) || splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) || splitRule(n2.sel))])].join(','),
            chi: intersect.reverse()
        });
        if (result == null || [n1, n2].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0) <= [node1, node2, result].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0)) {
            // @ts-ignore
            return null;
        }
        return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2 };
    }
    function matchSelectors(selector1, selector2, parentType) {
        let match = [[]];
        const j = Math.min(selector1.reduce((acc, curr) => Math.min(acc, curr.length), selector1.length > 0 ? selector1[0].length : 0), selector2.reduce((acc, curr) => Math.min(acc, curr.length), selector2.length > 0 ? selector2[0].length : 0));
        let i = 0;
        let k;
        let l;
        let token;
        let matching = true;
        let matchFunction = 0;
        let inAttr = 0;
        for (; i < j; i++) {
            k = 0;
            token = selector1[0][i];
            for (; k < selector1.length; k++) {
                if (selector1[k][i] != token) {
                    matching = false;
                    break;
                }
            }
            if (matching) {
                l = 0;
                for (; l < selector2.length; l++) {
                    if (selector2[l][i] != token) {
                        matching = false;
                        break;
                    }
                }
            }
            if (!matching) {
                break;
            }
            if (token == ',') {
                match.push([]);
            }
            else {
                if (token.endsWith('(')) {
                    matchFunction++;
                }
                if (token.endsWith('[')) {
                    inAttr++;
                }
                else if (token == ')') {
                    matchFunction--;
                }
                else if (token == ']') {
                    inAttr--;
                }
                match.at(-1).push(token);
            }
        }
        // invalid function
        if (matchFunction != 0 || inAttr != 0) {
            return null;
        }
        if (parentType != 'Rule') {
            for (const part of match) {
                if (part.length > 0 && combinators.includes(part[0].charAt(0))) {
                    return null;
                }
            }
        }
        if (match.length > 1) {
            errors?.push({ action: 'ignore', message: `minify: unsupported multilevel matching\n${JSON.stringify({ match, selector1, selector2 }, null, 1)}` });
            return null;
        }
        for (const part of match) {
            while (part.length > 0) {
                const token = part.at(-1);
                if (token == ' ' || combinators.includes(token) || notEndingWith.includes(token.at(-1))) {
                    part.pop();
                    continue;
                }
                break;
            }
        }
        if (match.every(t => t.length == 0)) {
            return null;
        }
        if (eq([['&']], match)) {
            return null;
        }
        function reduce(acc, curr) {
            if (acc === null) {
                return null;
            }
            let hasCompoundSelector = true;
            curr = curr.slice(match[0].length);
            while (curr.length > 0) {
                if (curr[0] == ' ') {
                    hasCompoundSelector = false;
                    curr.unshift('&');
                    continue;
                }
                break;
            }
            // invalid function match
            if (curr.length > 0 && curr[0].endsWith('(') && curr.at(-1) != ')') {
                return null;
            }
            if (curr.length == 1 && combinators.includes(curr[0].charAt(0))) {
                return null;
            }
            if (hasCompoundSelector && curr.length > 0) {
                hasCompoundSelector = !['&'].concat(combinators).includes(curr[0].charAt(0));
            }
            if (curr[0] == ':is(') {
                let inFunction = 0;
                let canReduce = true;
                const isCompound = curr.reduce((acc, token, index) => {
                    if (index == 0) {
                        inFunction++;
                        canReduce = curr[1] == '&';
                    }
                    else if (token.endsWith('(')) {
                        if (inFunction == 0) {
                            canReduce = false;
                        }
                        inFunction++;
                    }
                    else if (token == ')') {
                        inFunction--;
                    }
                    else if (token == ',') {
                        if (!canReduce) {
                            canReduce = curr[index + 1] == '&';
                        }
                        acc.push([]);
                    }
                    else
                        acc.at(-1)?.push(token);
                    return acc;
                }, [[]]);
                if (inFunction > 0) {
                    canReduce = false;
                }
                if (canReduce) {
                    curr = isCompound.reduce((acc, curr) => {
                        if (acc.length > 0) {
                            acc.push(',');
                        }
                        acc.push(...curr);
                        return acc;
                    }, []);
                }
            }
            // @todo: check hasCompoundSelector && curr[0] == '&' && curr[1] == ' '
            acc.push(match.length == 0 ? ['&'] : (hasCompoundSelector && curr[0] != '&' && (curr.length == 0 || !combinators.includes(curr[0].charAt(0))) ? ['&'].concat(curr) : curr));
            return acc;
        }
        // @ts-ignore
        selector1 = selector1.reduce(reduce, []);
        // @ts-ignore
        selector2 = selector2.reduce(reduce, []);
        return selector1 == null || selector2 == null ? null : {
            eq: eq(selector1, selector2),
            match,
            selector1,
            selector2
        };
    }
    // @ts-ignore
    if (('chi' in ast) && ast.chi?.length > 0) {
        let i = 0;
        let previous;
        let node;
        let nodeIndex;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            // @ts-ignore
            if (ast.chi[i].typ == 'Comment') {
                continue;
            }
            // @ts-ignore
            node = ast.chi[i];
            // @ts-ignore
            if (previous == node) {
                // console.error('idem!');
                // @ts-ignore
                ast.chi.splice(i, 1);
                i--;
                continue;
            }
            if (node.typ == 'AtRule' && node.nam == 'font-face') {
                continue;
            }
            if (node.typ == 'AtRule') {
                if (node.nam == 'media' && node.val == 'all') {
                    // @ts-ignore
                    ast.chi?.splice(i, 1, ...node.chi);
                    i--;
                    continue;
                }
                // console.debug({previous, node});
                // @ts-ignore
                if (previous?.typ == 'AtRule' &&
                    previous.nam == node.nam &&
                    previous.val == node.val) {
                    if ('chi' in node) {
                        // @ts-ignore
                        previous.chi.push(...node.chi);
                    }
                    // else {
                    ast?.chi?.splice(i--, 1);
                    continue;
                    // }
                }
                // @ts-ignore
                if (hasDeclaration(node)) {
                    // @ts-ignore
                    minifyRule(node);
                }
                else {
                    minify(node, options, recursive, errors);
                }
                previous = node;
                nodeIndex = i;
                continue;
            }
            // @ts-ignore
            if (node.typ == 'Rule') {
                reduceRuleSelector(node);
                let wrapper;
                let match;
                // @ts-ignore
                if (options.nestingRules) {
                    // @ts-ignore
                    if (previous?.typ == 'Rule') {
                        // @ts-ignore
                        reduceRuleSelector(previous);
                        // @ts-ignore
                        match = matchSelectors(previous.raw, node.raw, ast.typ);
                        // @ts-ignore
                        if (match != null) {
                            // @ts-ignore
                            wrapper = wrapNodes(previous, node, match, ast, i, nodeIndex);
                            nodeIndex = i - 1;
                            // @ts-ignore
                            previous = ast.chi[nodeIndex];
                        }
                    }
                    // @ts-ignore
                    if (wrapper != null) {
                        // @ts-ignore
                        while (i < ast.chi.length) {
                            // @ts-ignore
                            const nextNode = ast.chi[i];
                            // @ts-ignore
                            if (nextNode.typ != 'Rule') {
                                // i--;
                                // previous = wrapper;
                                // nodeIndex = i;
                                break;
                            }
                            reduceRuleSelector(nextNode);
                            // @ts-ignore
                            match = matchSelectors(wrapper.raw, nextNode.raw, ast.typ);
                            // @ts-ignore
                            if (match == null) {
                                break;
                            }
                            // @ts-ignore
                            wrapper = wrapNodes(wrapper, nextNode, match, ast, i, nodeIndex);
                        }
                        nodeIndex = --i;
                        // @ts-ignore
                        previous = ast.chi[nodeIndex];
                        minify(wrapper, options, recursive, errors);
                        continue;
                    }
                    // @ts-ignore
                    else if (node.optimized != null &&
                        // @ts-ignore
                        node.optimized.match &&
                        // @ts-ignore
                        node.optimized.selector.length > 1) {
                        // @ts-ignore
                        wrapper = { ...node, chi: [], sel: node.optimized.optimized[0] };
                        // @ts-ignore
                        Object.defineProperty(wrapper, 'raw', {
                            ...definedPropertySettings,
                            // @ts-ignore
                            value: [[node.optimized.optimized[0]]]
                        });
                        // @ts-ignore
                        node.sel = node.optimized.selector.reduce(reducer, []).join(',');
                        // @ts-ignore
                        node.raw = node.optimized.selector.slice();
                        // @ts-ignore
                        wrapper.chi.push(node);
                        // @ts-ignore
                        ast.chi.splice(i, 1, wrapper);
                        node = wrapper;
                    }
                }
                // @ts-ignore
                else if (node.optimized?.match) {
                    let wrap = true;
                    // @ts-ignore
                    const selector = node.optimized.selector.reduce((acc, curr) => {
                        if (curr[0] == '&') {
                            if (curr[1] == ' ') {
                                curr.splice(0, 2);
                            }
                            else {
                                if (ast.typ != 'Rule' && combinators.includes(curr[1])) {
                                    wrap = false;
                                }
                                else {
                                    curr.splice(0, 1);
                                }
                            }
                        }
                        else if (combinators.includes(curr[0])) {
                            curr.unshift('&');
                            wrap = false;
                        }
                        // @ts-ignore
                        acc.push(curr);
                        return acc;
                    }, []);
                    if (!wrap) {
                        wrap = selector.some(s => s[0] != '&');
                    }
                    const rule = selector.map(s => {
                        if (s[0] == '&') {
                            // @ts-ignore
                            s[0] = node.optimized.optimized[0];
                        }
                        return s.join('');
                    }).join(',');
                    // @ts-ignore
                    node.sel = wrap ? node.optimized.optimized[0] + `:is(${rule})` : rule;
                }
            }
            // @ts-ignore
            if (previous != null) {
                // @ts-ignore
                if ('chi' in previous && ('chi' in node)) {
                    // @ts-ignore
                    if (previous.typ == node.typ) {
                        let shouldMerge = true;
                        // @ts-ignore
                        let k = previous.chi.length;
                        while (k-- > 0) {
                            // @ts-ignore
                            if (previous.chi[k].typ == 'Comment') {
                                continue;
                            }
                            // @ts-ignore
                            shouldMerge = previous.chi[k].typ == 'Declaration';
                            break;
                        }
                        if (shouldMerge) {
                            // @ts-ignore
                            if ((node.typ == 'Rule' && node.sel == previous.sel) ||
                                // @ts-ignore
                                (node.typ == 'AtRule') && node.val != 'font-face' && node.val == previous.val) {
                                // @ts-ignore
                                node.chi.unshift(...previous.chi);
                                // @ts-ignore
                                ast.chi.splice(nodeIndex, 1);
                                // @ts-ignore
                                if (hasDeclaration(node)) {
                                    // @ts-ignore
                                    minifyRule(node);
                                }
                                else {
                                    minify(node, options, recursive, errors);
                                }
                                i--;
                                previous = node;
                                nodeIndex = i;
                                continue;
                            }
                            else if (node.typ == 'Rule' && previous?.typ == 'Rule') {
                                const intersect = diff(previous, node, options);
                                if (intersect != null) {
                                    if (intersect.node1.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(i--, 1);
                                        // @ts-ignore
                                        node = ast.chi[i];
                                    }
                                    else {
                                        // @ts-ignore
                                        ast.chi.splice(i, 1, intersect.node1);
                                        node = intersect.node1;
                                    }
                                    if (intersect.node2.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result);
                                        previous = intersect.result;
                                    }
                                    else {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                        previous = intersect.result;
                                        // @ts-ignore
                                        i = nodeIndex;
                                    }
                                }
                            }
                        }
                    }
                    // @ts-ignore
                    if (recursive && previous != node) {
                        // @ts-ignore
                        if (hasDeclaration(previous)) {
                            // @ts-ignore
                            minifyRule(previous);
                        }
                        else {
                            minify(previous, options, recursive, errors);
                        }
                    }
                }
                else {
                    if ('chi' in previous) {
                        // @ts-ignore
                        if (hasDeclaration(previous)) {
                            // @ts-ignore
                            minifyRule(previous);
                        }
                        else {
                            minify(previous, options, recursive, errors);
                        }
                    }
                }
            }
            previous = node;
            nodeIndex = i;
        }
        // @ts-ignore
        if (recursive && node != null && ('chi' in node)) {
            // @ts-ignore
            if (node.chi.some(n => n.typ == 'Declaration')) {
                minifyRule(node);
            }
            else {
                // @ts-ignore
                if (!(node.typ == 'AtRule' && node.nam != 'font-face')) {
                    minify(node, options, recursive, errors);
                }
            }
        }
    }
    return ast;
}
function reduceSelector(selector) {
    if (selector.length == 0) {
        return null;
    }
    const optimized = [];
    const k = selector.reduce((acc, curr) => acc == 0 ? curr.length : (curr.length == 0 ? acc : Math.min(acc, curr.length)), 0);
    let i = 0;
    let j;
    let match;
    for (; i < k; i++) {
        const item = selector[0][i];
        match = true;
        for (j = 1; j < selector.length; j++) {
            if (item != selector[j][i]) {
                match = false;
                break;
            }
        }
        if (!match) {
            break;
        }
        optimized.push(item);
    }
    while (optimized.length > 0) {
        const last = optimized.at(-1);
        if ((last == ' ' || combinators.includes(last))) {
            optimized.pop();
            continue;
        }
        break;
    }
    selector.forEach((selector) => selector.splice(0, optimized.length));
    // combinator
    if (combinators.includes(optimized.at(-1))) {
        const combinator = optimized.pop();
        selector.forEach(selector => selector.unshift(combinator));
    }
    let reducible = optimized.length == 1;
    if (optimized[0] == '&' && optimized[1] == ' ') {
        optimized.splice(0, 2);
    }
    if (optimized.length == 0 ||
        (optimized[0].charAt(0) == '&' ||
            selector.length == 1)) {
        return {
            match: false,
            optimized,
            selector: selector.map(selector => selector[0] == '&' && selector[1] == ' ' ? selector.slice(2) : selector),
            reducible: selector.length > 1 && selector.every((selector) => !combinators.includes(selector[0]))
        };
    }
    return {
        match: true,
        optimized,
        selector: selector.reduce((acc, curr) => {
            let hasCompound = true;
            if (hasCompound && curr.length > 0) {
                hasCompound = !['&'].concat(combinators).includes(curr[0].charAt(0));
            }
            // @ts-ignore
            if (hasCompound && curr[0] == ' ') {
                hasCompound = false;
                curr.unshift('&');
            }
            if (curr.length == 0) {
                curr.push('&');
                hasCompound = false;
            }
            if (reducible) {
                const chr = curr[0].charAt(0);
                // @ts-ignore
                reducible = chr == '.' || chr == ':' || isIdentStart(chr.codePointAt(0));
            }
            acc.push(hasCompound ? ['&'].concat(curr) : curr);
            return acc;
        }, []),
        reducible: selector.every((selector) => !['>', '+', '~', '&'].includes(selector[0]))
    };
}
function hasDeclaration(node) {
    // @ts-ignore
    for (let i = 0; i < node.chi?.length; i++) {
        // @ts-ignore
        if (node.chi[i].typ == 'Comment') {
            continue;
        }
        // @ts-ignore
        return node.chi[i].typ == 'Declaration';
    }
    return true;
}
function minifyRule(ast) {
    // @ts-ignore
    if (!('chi' in ast) || ast.chi?.length <= 1) {
        return ast;
    }
    // @ts-ignore
    const j = ast.chi.length;
    let k = 0;
    let properties = new PropertyList();
    // @ts-ignore
    for (; k < j; k++) {
        // @ts-ignore
        const node = ast.chi[k];
        if (node.typ == 'Comment' || node.typ == 'Declaration') {
            properties.add(node);
            continue;
        }
        break;
    }
    // @ts-ignore
    ast.chi = [...properties].concat(ast.chi.slice(k));
    return ast;
}
function splitRule(buffer) {
    const result = [[]];
    let str = '';
    for (let i = 0; i < buffer.length; i++) {
        let chr = buffer.charAt(i);
        if (isWhiteSpace(chr.charCodeAt(0))) {
            let k = i;
            while (k + 1 < buffer.length) {
                if (isWhiteSpace(buffer[k + 1].charCodeAt(0))) {
                    k++;
                    continue;
                }
                break;
            }
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            // @ts-ignore
            if (result.at(-1).length > 0) {
                // @ts-ignore
                result.at(-1).push(' ');
            }
            i = k;
            continue;
        }
        if (chr == ',') {
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            result.push([]);
            continue;
        }
        str += chr;
        if (chr == '\\') {
            str += buffer.charAt(++i);
            continue;
        }
        if (chr == '"' || chr == "'") {
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                str += chr;
                if (chr == '//') {
                    str += buffer.charAt(++k);
                    continue;
                }
                if (chr == buffer.charAt(i)) {
                    break;
                }
            }
            continue;
        }
        if (chr == '(' || chr == '[') {
            const open = chr;
            const close = chr == '(' ? ')' : ']';
            let inParens = 1;
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                if (chr == '\\') {
                    str += buffer.slice(k, k + 2);
                    k++;
                    continue;
                }
                str += chr;
                if (chr == open) {
                    inParens++;
                }
                else if (chr == close) {
                    inParens--;
                }
                if (inParens == 0) {
                    break;
                }
            }
            i = k;
        }
    }
    if (str !== '') {
        // @ts-ignore
        result.at(-1).push(str);
    }
    return result;
}
function reduceRuleSelector(node) {
    if (node.raw == null) {
        Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: splitRule(node.sel) });
    }
    // @ts-ignore
    // if (node.raw != null) {
    // @ts-ignore
    let optimized = reduceSelector(node.raw.reduce((acc, curr) => {
        acc.push(curr.slice());
        return acc;
    }, []));
    if (optimized != null) {
        Object.defineProperty(node, 'optimized', { ...definedPropertySettings, value: optimized });
    }
    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
        const raw = [
            [
                optimized.optimized[0], ':is('
            ].concat(optimized.selector.reduce((acc, curr) => {
                if (acc.length > 0) {
                    acc.push(',');
                }
                acc.push(...curr);
                return acc;
            }, [])).concat(')')
        ];
        const sel = raw[0].join('');
        if (sel.length < node.sel.length) {
            node.sel = sel;
            // node.raw = raw;
            Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: raw });
        }
    }
    // }
}

function* walk(node) {
    // @ts-ignore
    yield* doWalk(node, null, null);
}
function* doWalk(node, parent, root) {
    yield { node, parent, root };
    if ('chi' in node) {
        for (const child of node.chi) {
            yield* doWalk(child, node, (root ?? node));
        }
    }
}
function* walkValues(values, parent) {
    for (const value of values) {
        // @ts-ignore
        yield { value, parent };
        if ('chi' in value) {
            yield* walkValues(value.chi, value);
        }
    }
}

function expand(ast) {
    if (!['AstRule', 'AstRuleStyleSheet', 'AstAtRule'].includes(ast.typ)) {
        return ast;
    }
    if ('Rule' == ast.typ) {
        return {
            typ: 'StyleSheet',
            chi: expandRule(ast)
        };
    }
    if (!('chi' in ast)) {
        return { ...ast };
    }
    const result = { ...ast, chi: [] };
    // @ts-ignore
    for (let i = 0; i < ast.chi.length; i++) {
        // @ts-ignore
        const node = ast.chi[i];
        if (node.typ == 'Rule') {
            // @ts-ignore
            result.chi.push(...expandRule(node));
            // i += expanded.length - 1;
        }
        else if (node.typ == 'AtRule' && 'chi' in node) {
            let hasRule = false;
            let j = node.chi.length;
            while (j--) {
                if (node.chi[j].typ == 'Rule' || node.chi[j].typ == 'AtRule') {
                    hasRule = true;
                    break;
                }
            }
            // @ts-ignore
            result.chi.push({ ...(hasRule ? expand(node) : node) });
        }
        else {
            // @ts-ignore
            result.chi.push(node);
        }
    }
    return result;
}
function expandRule(node) {
    const ast = { ...node, chi: node.chi.slice() };
    const result = [];
    if (ast.typ == 'Rule') {
        let i = 0;
        // @ts-ignore
        delete ast.raw;
        // @ts-ignore
        delete ast.optimized;
        for (; i < ast.chi.length; i++) {
            if (ast.chi[i].typ == 'Rule') {
                const rule = ast.chi[i];
                if (!rule.sel.includes('&')) {
                    const selRule = splitRule(rule.sel);
                    selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(ast.sel) : arr.unshift(ast.sel, ' '));
                    rule.sel = selRule.reduce((acc, curr) => {
                        acc.push(curr.join(''));
                        return acc;
                    }, []).join(',');
                }
                else {
                    rule.sel = replaceCompount(rule.sel, ast.sel);
                }
                delete rule.raw;
                delete rule.optimized;
                ast.chi.splice(i--, 1);
                result.push(...expandRule(rule));
            }
            else if (ast.chi[i].typ == 'AtRule') {
                let astAtRule = ast.chi[i];
                const values = [];
                if (astAtRule.nam == 'scope') {
                    if (astAtRule.val.includes('&')) {
                        astAtRule.val = replaceCompount(astAtRule.val, ast.sel);
                    }
                    // @ts-ignore
                    astAtRule = expand(astAtRule);
                }
                else {
                    // @ts-ignore
                    const clone = { ...ast, chi: astAtRule.chi.slice() };
                    // @ts-ignore
                    astAtRule.chi.length = 0;
                    for (const r of expandRule(clone)) {
                        if (r.typ == 'AtRule' && 'chi' in r) {
                            if (astAtRule.val !== '' && r.val !== '') {
                                if (astAtRule.nam == 'media' && r.nam == 'media') {
                                    r.val = astAtRule.val + ' and ' + r.val;
                                }
                                else if (astAtRule.nam == 'layer' && r.nam == 'layer') {
                                    r.val = astAtRule.val + '.' + r.val;
                                }
                            }
                            // @ts-ignore
                            values.push(r);
                        }
                        else if (r.typ == 'Rule') {
                            // @ts-ignore
                            astAtRule.chi.push(...expandRule(r));
                        }
                        else {
                            // @ts-ignore
                            astAtRule.chi.push(r);
                        }
                    }
                }
                // @ts-ignore
                result.push(...(astAtRule.chi.length > 0 ? [astAtRule].concat(values) : values));
                ast.chi.splice(i--, 1);
            }
        }
    }
    // @ts-ignore
    return ast.chi.length > 0 ? [ast].concat(result) : result;
}
function replaceCompount(input, replace) {
    const tokens = parseString(input);
    for (const t of walkValues(tokens)) {
        if (t.value.typ == 'Literal') {
            if (t.value.val == '&') {
                t.value.val = replace;
            }
            else if (t.value.val.length > 1 && t.value.val.charAt(0) == '&') {
                t.value.val = replaceCompoundLiteral(t.value.val, replace);
            }
        }
    }
    return tokens.reduce((acc, curr) => acc + renderToken(curr), '');
}
function replaceCompoundLiteral(selector, replace) {
    const tokens = [''];
    let i = 0;
    for (; i < selector.length; i++) {
        if (selector.charAt(i) == '&') {
            tokens.push('&');
            tokens.push('');
        }
        else {
            tokens[tokens.length - 1] += selector.charAt(i);
        }
    }
    return tokens.sort((a, b) => {
        if (a == '&') {
            return 1;
        }
        return b == '&' ? -1 : 0;
    }).reduce((acc, curr) => acc + (curr == '&' ? replace : curr), '');
}

async function transform$1(css, options = {}) {
    options = { minify: true, removeEmpty: true, ...options };
    const startTime = performance.now();
    return parse$1(css, options).then((parseResult) => {
        const rendered = render(parseResult.ast, options);
        return {
            ...parseResult,
            ...rendered,
            errors: parseResult.errors.concat(rendered.errors),
            stats: {
                bytesOut: rendered.code.length,
                ...parseResult.stats,
                render: rendered.stats.total,
                total: `${(performance.now() - startTime).toFixed(2)}ms`
            }
        };
    });
}

const matchUrl = /^(https?:)?\/\//;
function dirname(path) {
    if (path == '/' || path === '') {
        return path;
    }
    let i = 0;
    let parts = [''];
    for (; i < path.length; i++) {
        const chr = path.charAt(i);
        if (chr == '/') {
            parts.push('');
        }
        else if (chr == '?' || chr == '#') {
            break;
        }
        else {
            parts[parts.length - 1] += chr;
        }
    }
    parts.pop();
    return parts.length == 0 ? '/' : parts.join('/');
}
function splitPath(result) {
    const parts = [''];
    let i = 0;
    for (; i < result.length; i++) {
        const chr = result.charAt(i);
        if (chr == '/') {
            parts.push('');
        }
        else if (chr == '?' || chr == '#') {
            break;
        }
        else {
            parts[parts.length - 1] += chr;
        }
    }
    let k = parts.length;
    while (k--) {
        if (parts[k] == '.') {
            parts.splice(k, 1);
        }
        else if (parts[k] == '..') {
            parts.splice(k - 1, 2);
        }
    }
    return { parts, i };
}
function resolve(url, currentDirectory, cwd) {
    if (matchUrl.test(url)) {
        return {
            absolute: url,
            relative: url
        };
    }
    if (matchUrl.test(currentDirectory)) {
        const path = new URL(url, currentDirectory).href;
        return {
            absolute: path,
            relative: path
        };
    }
    let result;
    if (url.charAt(0) == '/') {
        result = url;
    }
    else if (currentDirectory.charAt(0) == '/') {
        result = dirname(currentDirectory) + '/' + url;
    }
    else if (currentDirectory === '' || dirname(currentDirectory) === '') {
        result = url;
    }
    else {
        result = dirname(currentDirectory) + '/' + url;
    }
    let { parts, i } = splitPath(result);
    if (parts.length == 0) {
        const path = result.charAt(0) == '/' ? '/' : '';
        return {
            absolute: path,
            relative: path
        };
    }
    const absolute = parts.join('/');
    const { parts: dirs } = splitPath(cwd ?? currentDirectory);
    for (const p of dirs) {
        if (parts[0] == p) {
            parts.shift();
        }
        else {
            parts.unshift('..');
        }
    }
    return {
        absolute,
        relative: parts.join('/') + (i < result.length ? result.slice(i) : '')
    };
}

function parseResponse(response) {
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`);
    }
    return response.text();
}
async function load(url, currentFile) {
    const resolved = resolve(url, currentFile);
    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then(parseResponse) : promises.readFile(resolved.absolute, { encoding: 'utf-8' });
}

async function parse(iterator, opt = {}) {
    return parse$1(iterator, Object.assign(opt, { load, resolve, cwd: opt.cwd ?? process.cwd() }));
}
async function transform(css, options = {}) {
    return transform$1(css, Object.assign(options, { load, resolve, cwd: options.cwd ?? process.cwd() }));
}

exports.colorsFunc = colorsFunc;
exports.combinators = combinators;
exports.dirname = dirname;
exports.expand = expand;
exports.funcList = funcList;
exports.getConfig = getConfig;
exports.hasDeclaration = hasDeclaration;
exports.isAngle = isAngle;
exports.isAtKeyword = isAtKeyword;
exports.isColor = isColor;
exports.isDigit = isDigit;
exports.isDimension = isDimension;
exports.isFrequency = isFrequency;
exports.isFunction = isFunction;
exports.isHash = isHash;
exports.isHexColor = isHexColor;
exports.isIdent = isIdent;
exports.isIdentCodepoint = isIdentCodepoint;
exports.isIdentStart = isIdentStart;
exports.isLength = isLength;
exports.isNewLine = isNewLine;
exports.isNonPrintable = isNonPrintable;
exports.isNumber = isNumber;
exports.isPercentage = isPercentage;
exports.isPseudo = isPseudo;
exports.isResolution = isResolution;
exports.isTime = isTime;
exports.isWhiteSpace = isWhiteSpace;
exports.load = load;
exports.matchType = matchType;
exports.matchUrl = matchUrl;
exports.minify = minify;
exports.minifyRule = minifyRule;
exports.parse = parse;
exports.parseDimension = parseDimension;
exports.parseString = parseString;
exports.reduceSelector = reduceSelector;
exports.render = render;
exports.renderToken = renderToken;
exports.resolve = resolve;
exports.splitRule = splitRule;
exports.tokenize = tokenize;
exports.transform = transform;
exports.urlTokenMatcher = urlTokenMatcher;
exports.walk = walk;
exports.walkValues = walkValues;
