import {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleStyleSheet, DimensionToken,
    RenderOptions,
    Token
} from "../@types";
import {Parser} from "../parser";

const indents: string[] = [];

function reducer (acc: string, curr: Token) {

    acc += renderToken(curr);
    return acc;
}

export function render(data: Parser | AstNode, options: RenderOptions = {compress: true}) {

    if (data instanceof Parser) {

        data = data.getAst();
    }

    return doRender(data, Object.assign(options.compress ? {
        indent: '',
        newLine: '',
        removeComments: true
    } : {
        indent: ' ',
        newLine: '\n',
        compress: false,
        removeComments: false
    }, options));
}

function doRender(data: AstNode, options: RenderOptions, level: number = 0): string {

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

                const str: string = doRender(node, options);

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

            const children: string = (<AstRule> data).chi.reduce((css: string, node) => {

                let str;

                if (node.typ == 'Comment') {

                    str = options.removeComments ? '' : (<AstComment>node).val;
                }

                else if (node.typ == 'Declaration') {

                    str = `${(<AstDeclaration>node).nam}:${options.indent}${(<AstDeclaration>node).val.reduce(reducer, '')};`;
                }

                else if (node.typ == 'AtRule' && !('children' in node)) {

                    str = `@${(<AstAtRule>node).nam}${options.indent}${(<AstAtRule>node).val};`;
                }

                else {

                    str = doRender(node, options, level + 1);
                }

                if (css === '') {

                    return str;
                }

                if (str === '') {

                    return css;
                }

                return `${css}${options.newLine}${indentSub}${str}`;
            }, '');

            if (data.typ == 'AtRule') {

                return '@' + (<AstAtRule>data).nam +  `${options.indent}${(<AstAtRule>data).val ? (<AstAtRule>data).val + options.indent : ''}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine)  + indent + `}`
            }

            return (<AstRule>data).sel +  `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine)  + indent + `}`
    }

    return '';
}

export function renderToken(token: Token) {

    switch (token.typ ) {

        case 'Func':
            return token.val + '(';

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

        case 'Url-token':
        case 'At-rule':
        case 'Number':

        case 'Hash':
        case 'Pseudo-class':
        case 'Pseudo-class-func':
        case 'Comment':
        case 'Literal':
        case 'String':
        case 'Iden':
        case 'Delim':
            return token.val;
    }

    throw  new Error(`unexpected token ${JSON.stringify(token, null, 1)}`);
}