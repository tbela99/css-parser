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

export class Renderer {

    #options: RenderOptions;

    #indents: string[] = [];

    constructor(options: RenderOptions = {}) {

        this.#options = Object.assign({
            indent: ' ',
            newLine: '\n',
            compress: false,
            removeComments: false
        }, options);
    }

    render(data: Parser | AstNode) {

        if (data instanceof Parser) {

            data = data.getAst();
        }

        return this.#doRender(data);
    }

    #doRender(data: AstNode, level: number = 0): string {

        if (this.#indents.length < level + 1) {

            this.#indents.push((<string>this.#options.indent).repeat(level))
        }

        if (this.#indents.length < level + 2) {

            this.#indents.push((<string>this.#options.indent).repeat(level + 1));
        }

        const indent: string = this.#indents[level];
        const indentSub: string = this.#indents[level + 1];
        const reducer = (acc: string, curr: Token) => {

            acc += this.renderToken(curr);
            return acc;
        };

        switch (data.type) {

            case 'Comment':

                return this.#options.removeComments ? '' : (<AstComment>data).value;

            case 'StyleSheet':

                return (<AstRuleStyleSheet>data).children.reduce((css: string, node) => {

                    const str: string = this.#doRender(node, 0);

                    if (str === '') {

                        return css;
                    }

                    if (css === '') {

                        return str;
                    }

                    return `${css}${this.#options.newLine}${str}`;

                }, '');

            case 'AtRule':
            case 'Rule':

                if (data.type == 'AtRule' && !('children' in data)) {

                    return `${indent}@${(<AstAtRule>data).name.reduce(reducer, '')} ${(<AstAtRule>data).value.reduce(reducer, '')};`;
                }

                const children: string = (<AstRule> data).children.reduce((css: string, node) => {

                    let str;

                    if (node.type == 'Comment') {

                        str = this.#options.removeComments ? '' : (<AstComment>node).value;
                    }

                    else if (node.type == 'Declaration') {

                        str = `${(<AstDeclaration>node).name.reduce(reducer, '')}:${this.#options.indent}${(<AstDeclaration>node).value.reduce(reducer, '')};`;
                    }

                    else if (node.type == 'AtRule' && !('children' in node)) {

                        str = `@${(<AstAtRule>node).name.reduce(reducer, '')}${this.#options.indent}${this.#options.indent}${(<AstAtRule>node).value.reduce(reducer, '')};`;
                    }

                    else {

                        str = this.#doRender(node, level + 1);
                    }

                    if (css === '') {

                        return str;
                    }

                    if (str === '') {

                        return css;
                    }

                    return `${css}${this.#options.newLine}${indentSub}${str}`;
                }, '');

                if (data.type == 'AtRule') {

                    return indent + '@' + (<AstAtRule>data).name.reduce(reducer, '') +  `${this.#options.indent}${(<AstAtRule>data).value ? (<AstAtRule>data).value.reduce(reducer, '') + this.#options.indent : ''}{${this.#options.newLine}` + (children === '' ? '' : indentSub + children + this.#options.newLine)  + indent + `}`
                }

                return indent + (<AstRule>data).selector.reduce(reducer, '') +  `${this.#options.indent}{${this.#options.newLine}` + (children === '' ? '' : indentSub + children + this.#options.newLine)  + indent + `}`
        }

        return '';
    }

    renderToken(token: Token) {

        /*
        |
     | FunctionToken |
    | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | GreaterThanToken;
         */

        switch (token.type ) {

            case 'function':
                return token.value + '(';

            case 'includes':
                return '~=';

            case 'dash-match':
                return '|=';

            case 'less-than':
                return '<';

            case 'greater-than':
                return '>';

            case 'start-parens':
                return '(';

            case 'end-parens':
                return ')';

            case 'attr-start':
                return '[';

            case 'attr-end':
                return ']';

            case 'whitespace':
                return ' ';

            case 'colon':
                return ':';

            case 'semi-colon':
                return ';';

            case 'comma':
                return ',';

            case 'dimension':
                return token.value + (<DimensionToken>token).unit;

            case 'percentage':
                return token.value + '%';

            case 'at-rule':
            case 'number':

            case 'hash':
            case 'pseudo-selector':
            case 'comment':
            case 'literal':
            case 'string':
            case 'ident':
                return token.value;
        }

        throw  new Error(`unexpected token ${JSON.stringify(token, null, 1)}`);
    }
}