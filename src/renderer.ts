import {AstAtRule, AstComment, AstDeclaration, AstNode, AstRule, AstRuleStyleSheet, RenderOptions} from "./@types";
import {Parser} from "./parser";

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

            console.log(this.#options);
            this.#indents.push((<string>this.#options.indent).repeat(level))
        }

        if (this.#indents.length < level + 2) {

            this.#indents.push((<string>this.#options.indent).repeat(level + 1));
        }

        const indent: string = this.#indents[level];
        const indentSub: string = this.#indents[level + 1];

        switch (data.type) {

            case 'StyleSheet':

                return (<AstRuleStyleSheet>data).children.reduce((css: string, node) => {

                    const str = this.#doRender(node, 0);

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

                    return `${indent}@${(<AstAtRule>data).name} ${(<AstAtRule>data).value};`;
                }

                const children = (<AstRule> data).children.reduce((css: string, node) => {

                    let str;

                    if (node.type == 'Comment') {

                        str = this.#options.removeComments ? '' : (<AstComment>node).value;
                    }

                    else if (node.type == 'Declaration') {

                        str = `${(<AstDeclaration>node).name}:${this.#options.indent}${(<AstDeclaration>node).value};`;
                    }

                    else if (node.type == 'AtRule' && !('children' in node)) {

                        str = `@${(<AstAtRule>node).name}${this.#options.indent}${this.#options.indent}${(<AstAtRule>node).value};`;
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

                    return indent + '@' + (<AstAtRule>data).name +  `${this.#options.indent}${(<AstAtRule>data).value ? (<AstAtRule>data).value + this.#options.indent : ''}{${this.#options.newLine}` + (children === '' ? '' : indentSub + children + this.#options.newLine)  + indent + `}`
                }

                return indent + (<AstRule>data).selector +  `${this.#options.indent}{${this.#options.newLine}` + (children === '' ? '' : indentSub + children + this.#options.newLine)  + indent + `}`
        }

        return '';
    }
}