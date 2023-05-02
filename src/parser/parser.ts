import {
    AstAtRule,
    AstComment, AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AstTraverserHandler,
    ParserOptions, Token
} from "../@types";
import {Observer} from "@tbela99/observer";
import {Renderer} from "../renderer";
import {tokenize} from "./tokenize";
import {update} from "./utils";
import {matchComponents} from "./utils/components";

export class Parser {

    #options: ParserOptions;
    #observer: Observer;
    // @ts-ignore
    #root: AstRuleStyleSheet;
    #errors: Error[] = [];

    constructor(options: ParserOptions = {
        strict: false,
        location: false
    }) {

        this.#options = {strict: false, location: false, ...options};
        this.#observer = new Observer();
    }

    parse(css: string) {

        this.#errors = [];
        this.#createRoot();

        if (css.length == 0) {

            return this;
        }

        const stack: Array<AstNode | AstComment> = [];
        const hasListeners = this.#observer.hasListeners('traverse');
        // @ts-ignore
        const position = this.#root.location.end;
        // @ts-ignore
        const src = this.#root.location.src;
        const location: boolean = <boolean>this.#options.location;
        let context: AstNode | AstComment | AstRuleStyleSheet = this.#root;
        let iterator: IterableIterator<string> = css[Symbol.iterator]();

        const generator: Generator<Token> = tokenize(iterator, position);
        let result: IteratorResult<Token>;
        let token: AstNode;

        while (true) {

            result = generator.next();

            if (result.done) {

                break;
            }

            if (result.value.type == 'block-end') {

                // @ts-ignore
                context = stack.pop();

                //@ts-ignore
                if (this.#options.location && context != null && context != this.#root) {

                    // @ts-ignore
                    context.location.end = {...position};
                }

                context = stack[stack.length - 1] || this.#root;
                continue;
            }

            switch (context.type) {

                case 'AtRule':
                case 'Rule':
                case "StyleSheet":

                    if (result.value.type == 'whitespace') {

                        continue;
                    }

                    if (result.value.type == 'bad-comment' || result.value.type == 'bad-cdo-comment') {

                        this.#errors.push(SyntaxError(`unexpected token ${result.value.type} at ${src}:${position.line}:${position.column}`));
                        break;
                    }

                    if (result.value.type == 'cdo-comment' || result.value.type == 'comment') {

                        if (result.value.type == 'cdo-comment' && context.type != 'StyleSheet') {

                            this.#errors.push(SyntaxError(`unexpected CDO token at ${src}:${position.line}:${position.column}`))
                            break;
                        }

                        const token: AstComment = <AstComment>{type: 'Comment', value: result.value.value};

                        if (location) {

                            token.location = {
                                start: {...position},
                                end: update({...position}, [...result.value.value]),
                                src
                            }

                            if (token.location.start.column == 0) {

                                token.location.start.column = 1;
                            }
                        }

                        // @ts-ignore
                        context.children.push(token);
                        continue;
                    }

                    if (result.value.type == 'at-rule') {

                        token = <AstAtRule>{type: 'AtRule'};

                        if (this.#options.location) {

                            token.location = {
                                start: {...position},
                                end: update({...position}, [...result.value.value]),
                                src
                            }
                        }

                        const {
                            tokens, errors
                        } = matchComponents(generator, position, src, ['semi-colon', 'block-start'], [])

                        // @ts-ignore
                        context.children.push(token);

                        const end: Token = tokens[tokens.length - 1];

                        if (end?.type == 'block-start') {

                            while (['block-start', 'whitespace'].includes(tokens[tokens.length - 1]?.type)) {

                                tokens.pop();
                            }

                            token.children = [];

                            stack.push(token);
                            context = token;
                        } else {

                            while (['semi-colon', 'whitespace'].includes(tokens[tokens.length - 1]?.type)) {

                                tokens.pop();
                            }

                            if (this.#options.location) {

                                // @ts-ignore
                                token.location.end = {...position};
                            }
                        }

                        token.name = [result.value];
                        token.value = tokens;

                        while (token.value[0]?.type == 'whitespace') {

                            token.value.shift();
                        }

                        break;
                    } else {

                        // Rule or declaration

                        // @ts-ignore
                        const token: AstNode = {type: ''};

                        if (location) {

                            token.location = {
                                start: {...position},
                                end: {...position},
                                src
                            }
                        }

                        const {
                            tokens, errors
                        } = matchComponents(generator, position, src, context.type == 'StyleSheet' ? ['block-start'] : ['block-start', 'semi-colon', 'block-end'], [result.value])

                        tokens.unshift(result.value);

                        if (tokens[tokens.length - 1]?.type == 'block-start') {

                            while (['whitespace', 'block-start'].includes(tokens[tokens.length - 1]?.type)) {

                                tokens.pop();
                            }

                            stack.push(token);
                            Object.assign(token, {type: 'Rule', selector: tokens, children: []});

                            // @ts-ignore
                            context.children.push(token);
                            context = token;
                            break;
                        } else {

                            let index: number = -1;

                            const parent = context;

                            if (tokens[tokens.length - 1]?.type == 'block-end') {

                                stack.pop();
                                context = stack[stack.length - 1] || this.#root;
                            }

                            while (['semi-colon', 'block-end', 'whitespace'].includes(tokens[tokens.length - 1]?.type)) {

                                tokens.pop();
                            }

                            tokens.some((t, key) => {

                                if (t.type == 'colon') {

                                    index = key;
                                    return true
                                }

                                return false;
                            });

                            if (index == -1) {

                                this.#errors.push(new SyntaxError(`invalid declaration at ${src}:${position.line}:${position.column}`))
                                break;
                            } else {

                                Object.assign(token, {
                                    type: 'Declaration',
                                    name: tokens.slice(0, index),
                                    value: tokens.slice(index + 1)
                                });

                                // @ts-ignore
                                while (token.value[0]?.type == 'whitespace') {

                                    // @ts-ignore
                                    token.value.shift();
                                }

                                let validDeclaration: boolean = true;

                                for (const val of (<AstDeclaration>token).value) {

                                    if (val.type == 'unclosed-string') {

                                        // recoverable
                                        this.#errors.push(SyntaxError(`unclosed string at ${src}:${position.line}:${position.column}`));

                                        // @ts-ignore
                                        val.type = 'string';
                                        val.value += val.value.charAt(0);
                                    } else if (['bad-string'].includes(val.type)) {

                                        validDeclaration = false;
                                        this.#errors.push(SyntaxError(`invalid declaration at ${src}:${position.line}:${position.column}`))
                                        break;
                                    }
                                }

                                if (validDeclaration) {

                                    // @ts-ignore
                                    parent.children.push(token);
                                }
                            }
                        }
                    }

                    break;

            }

            // if (hasListeners) {
            //
            //     this.#observer.trigger('traverse', result, 'enter', context);
            // }
        }

        if (this.#options.location) {

            for (const context of stack) {

                // @ts-ignore
                context.location.end = {...position};
            }
        }

        return this;
    }

    on(name: string, handler: AstTraverserHandler, signal?: AbortSignal) {

        this.#observer.on(name, handler, signal);
        return this;
    }

    off(name: string, handler?: AstTraverserHandler) {

        this.#observer.off(name, handler);
        return this;
    }

    #compactRuleList(node: AstRuleList) {


    }

    compact() {

        let i = this.#root.children.length;
        let previous: AstNode | null = null;

        while (i--) {

            const node = this.#root.children[i];

            // @ts-ignore
            if (previous?.type == node.type && node.type == 'Rule' && "selector" in previous && previous.selector == node.selector) {

                if (!('children' in node)) {

                    // @ts-ignore
                    node.children = []
                }

                if ('children' in previous) {

                    // @ts-ignore
                    node.children.push(...previous.children);
                }

                this.#root.children.splice(i, 1);
            }

            // @ts-ignore
            else if (node.type == 'AtRule' && node.name == 'media' && node.value == 'all') {

                // @ts-ignore
                this.#root.children.splice(i, 1, ...node.children);
                i += node.children.length;
            }

            // @ts-ignore
            previous = node;
        }

        return this;
    }

    #compactRule(node: AstRule) {

    }

    getAst() {

        if (this.#root == null) {

            this.#createRoot();
        }

        return this.#root;
    }

    getErrors(): Error[] {

        return this.#errors;
    }

    #createRoot(): this {

        this.#root = {
            type: "StyleSheet",
            location: {

                start: {

                    index: 0,
                    line: 1,
                    column: 1
                },

                end: {

                    index: -1,
                    line: 1,
                    column: 0
                },
                src: ''
            },
            children: []
        }

        return this;
    }

    toString() {

        return new Renderer().render(this);
    }
}