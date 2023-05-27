import {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleStyleSheet, ColorToken, DimensionToken,
    RenderOptions,
    Token
} from "../@types";
import {cmyk2hex, hsl2Hex, hwb2hex, NAMES_COLORS, rgb2Hex} from "./utils";

const indents: string[] = [];

export function render(data: AstNode, opt: RenderOptions = {}) {

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

    function reducer (acc: string, curr: Token): string {

        if (curr.typ == 'Comment' && options.removeComments) {

            return acc;
        }

        acc += renderToken(curr, options);
        return acc;
    }

    return doRender(data, options, reducer);
}

function doRender(data: AstNode, options: RenderOptions, reducer: Function, level: number = 0): string {

    if (indents.length < level + 1) {

        indents.push((<string>options.indent).repeat(level))
    }

    if (indents.length < level + 2) {

        indents.push((<string>options.indent).repeat(level + 1));
    }

    const indent: string = indents[level];
    const indentSub: string = indents[level + 1];

    switch (data.typ) {

        case 'Comment':

            return options.removeComments ? '' : (<AstComment>data).val;

        case 'StyleSheet':

            return (<AstRuleStyleSheet>data).chi.reduce((css: string, node) => {

                const str: string = doRender(node, options, reducer);

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

                return `${indent}@${(<AstAtRule>data).nam} ${(<AstAtRule>data).val};`;
            }

            // @ts-ignore
            let children: string = (<AstRule> data).chi.reduce((css: string, node: AstNode) => {

                let str: string;

                if (node.typ == 'Comment') {

                    str = options.removeComments ? '' : (<AstComment>node).val;
                }

                else if (node.typ == 'Declaration') {

                    str = `${(<AstDeclaration>node).nam}:${options.indent}${(<AstDeclaration>node).val.reduce(<() => string>reducer, '').trimEnd()};`;
                }

                else if (node.typ == 'AtRule' && !('chi' in node)) {

                    str = `@${(<AstAtRule>node).nam} ${(<AstAtRule>node).val};`;
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

                return `@${(<AstAtRule>data).nam} ${(<AstAtRule>data).val ? (<AstAtRule>data).val + options.indent : ''}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine)  + indent + `}`
            }

            return (<AstRule>data).sel +  `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine)  + indent + `}`
    }

    return '';
}

export function renderToken(token: Token, options: RenderOptions = {}) {

    switch (token.typ ) {


        case 'Color':

            if (options.compress || options.colorConvert) {

                let value: string = token.kin == 'hex' ? token.val.toLowerCase() : '';

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

                            return `#${value[1]}${value[3]}${value[5]}`;
                        }
                    }

                    if (value.length == 9) {

                        if (value[1] == value[2] &&
                            value[3] == value[4] &&
                            value[5] == value[6] &&
                            value[7] == value[8]) {

                            return `#${value[1]}${value[3]}${value[5]}${value[7]}`;
                        }
                    }

                    return named_color != null && named_color.length <= value.length ? named_color : value;
                }
            }

            if ((<ColorToken>token).kin == 'hex') {

                return token.val;
            }

        case 'Func':
            // @ts-ignore
            return token.val + '(' + token.chi.reduce((acc: string, curr: Token) => {

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
            return token.val + (<DimensionToken>token).unit;

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

    throw  new Error(`unexpected token ${JSON.stringify(token, null, 1)}`);
}