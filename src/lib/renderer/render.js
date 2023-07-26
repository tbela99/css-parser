import { cmyk2hex, hsl2Hex, hwb2hex, NAMES_COLORS, rgb2Hex } from "./utils";
export function render(data, opt = {}) {
    const options = Object.assign(opt.compress ? {
        indent: '',
        newLine: '',
        removeComments: true
    } : {
        indent: ' ',
        newLine: '\n',
        compress: false,
        removeComments: false,
    }, { colorConvert: true, preserveLicense: false }, opt);
    function reducer(acc, curr, index, original) {
        if (curr.typ == 'Comment' && options.removeComments) {
            if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                return acc;
            }
        }
        return acc + renderToken(curr, options);
    }
    return { code: doRender(data, options, reducer, 0) };
}
// @ts-ignore
function doRender(data, options, reducer, level = 0, indents = []) {
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
                const str = doRender(node, options, reducer, level, indents);
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
                    str = doRender(node, options, reducer, level + 1, indents);
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
                return `@${data.nam}${data.val ? ' ' + data.val + options.indent : ''}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
            }
            return data.sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;
    }
    return '';
}
export function renderToken(token, options = {}) {
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
            return ( /* options.compress && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/token.val ?? '') + '(' + token.chi.reduce((acc, curr) => {
                if (options.removeComments && curr.typ == 'Comment') {
                    if (!options.preserveLicense || !curr.val.startsWith('/*!')) {
                        return acc;
                    }
                }
                return acc + renderToken(curr, options);
            }, '') + ')';
        case 'Includes':
            return '~=';
        case 'Dash-match':
            return '|=';
        case 'Lt':
            return '<';
        case 'Gt':
            return '>';
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
            return '[' + token.chi.reduce((acc, curr) => acc + renderToken(curr, options), '') + ']';
        case 'Time':
        case 'Frequency':
        case 'Angle':
        case 'Length':
        case 'Dimension':
            const val = (+token.val).toString();
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
            const chr = val.charAt(0);
            if (chr == '-') {
                const slice = val.slice(0, 2);
                if (slice == '-0') {
                    return (val.length == 2 ? '0' : '-' + val.slice(2)) + token.unit;
                }
            }
            else if (chr == '0') {
                return val.slice(1) + token.unit;
            }
            return val + token.unit;
        case 'Perc':
            return token.val + '%';
        case 'Number':
            const num = (+token.val).toString();
            if (token.val.length < num.length) {
                return token.val;
            }
            if (num.charAt(0) === '0' && num.length > 1) {
                return num.slice(1);
            }
            const slice = num.slice(0, 2);
            if (slice == '-0') {
                return '-' + num.slice(2);
            }
            return num;
        case 'Comment':
            if (options.removeComments) {
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
            return /* options.compress && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */ token.val;
    }
    throw new Error(`unexpected token ${JSON.stringify(token, null, 1)}`);
}