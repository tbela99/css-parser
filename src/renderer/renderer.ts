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

            acc += Renderer.renderToken(curr);
            return acc;
        };

        switch (data.typ) {

            case 'Comment':

                return this.#options.removeComments ? '' : (<AstComment>data).val;

            case 'StyleSheet':

                return (<AstRuleStyleSheet>data).chi.reduce((css: string, node) => {

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

                if (data.typ == 'AtRule' && !('chi' in data)) {

                    return `${indent}@${(<AstAtRule>data).nam} ${(<AstAtRule>data).val.reduce(reducer, '')};`;
                }

                const children: string = (<AstRule> data).chi.reduce((css: string, node) => {

                    let str;

                    if (node.typ == 'Comment') {

                        str = this.#options.removeComments ? '' : (<AstComment>node).val;
                    }

                    else if (node.typ == 'Declaration') {

                        str = `${(<AstDeclaration>node).nam}:${this.#options.indent}${(<AstDeclaration>node).val.reduce(reducer, '')};`;
                    }

                    else if (node.typ == 'AtRule' && !('children' in node)) {

                        str = `@${(<AstAtRule>node).nam}${this.#options.indent}${this.#options.indent}${(<AstAtRule>node).val.reduce(reducer, '')};`;
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

                if (data.typ == 'AtRule') {

                    return indent + '@' + (<AstAtRule>data).nam +  `${this.#options.indent}${(<AstAtRule>data).val ? (<AstAtRule>data).val.reduce(reducer, '') + this.#options.indent : ''}{${this.#options.newLine}` + (children === '' ? '' : indentSub + children + this.#options.newLine)  + indent + `}`
                }

                return indent + (<AstRule>data).sel.reduce(reducer, '') +  `${this.#options.indent}{${this.#options.newLine}` + (children === '' ? '' : indentSub + children + this.#options.newLine)  + indent + `}`
        }

        return '';
    }

    static renderToken(token: Token) {

        /*
        |
     | FunctionToken |
    | CDOCommentToken |
    BadCDOCommentToken | CommentToken | BadCommentToken | WhitespaceToken | IncludesToken |
    DashMatchToken | LessThanToken | GreaterThanToken;
         */

        switch (token.typ ) {

            case 'Function':
                return token.val + '(';

            case 'Includes':
                return '~=';

            case 'Dash-match':
                return '|=';

            case 'Less-than':
                return '<';

            case 'Greater-than':
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

            case 'Dimension':
                return token.val + (<DimensionToken>token).unit;

            case 'Percentage':
                return token.val + '%';

            case 'At-rule':
            case 'Number':

            case 'Hash':
            case 'Pseudo-selector':
            case 'Comment':
            case 'Literal':
            case 'String':
            case 'Iden':
            case 'Delim':
                return token.val;
        }

        throw  new Error(`unexpected token ${JSON.stringify(token, null, 1)}`);
    }
}