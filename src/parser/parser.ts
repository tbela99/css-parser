import {Tokenizer} from "./tokenizer";
import {AstNode, AstRule, AstRuleList, AstRuleStyleSheet, AstTraverserHandler, ParserOptions} from "../@types";
import {Observer} from "@tbela99/observer";
import {Renderer} from "../renderer";

export class Parser {

    #options: ParserOptions;
    #observer: Observer;
    #tokenizer: Tokenizer;
    #root: AstRuleStyleSheet;
    #errors: Error[] = [];

    constructor(options: ParserOptions = {
        strict: false
    }) {

        this.#options = {strict: false, ...options};
        this.#observer = new Observer();
        this.#root = this.#createRoot();
        this.#tokenizer = new Tokenizer(this.#root);
    }

    parse(css: string) {

        this.#errors = [];
        const stack: AstRuleList[] = [];
        const hasListeners = this.#observer.hasListeners('traverse');
        let context:AstRuleStyleSheet = this.#root;

        for (const {node, direction, error} of this.#tokenizer.parse([...css])) {

            if (error) {

                if (this.#options.strict) {

                    throw error;
                }

                this.#observer.trigger('error', error, node);
                this.#errors.push(error);
                continue;
            }

            if (direction == 'enter') {

                // @ts-ignore
                if (node.type == 'StyleSheet') {

                    // @ts-ignore
                    context.children.push(...node.children);
                }

                else {

                    // @ts-ignore
                    context.children.push(node);
                }

                // @ts-ignore
                if ('children' in node) {

                    // @ts-ignore
                    stack.push(node);
                    // @ts-ignore
                    context = node;
                }
            } else if (direction == 'exit') {

                stack.pop();
                // @ts-ignore
                context = stack[stack.length - 1] || this.#root;
            }

            if (hasListeners) {

                this.#observer.trigger('traverse', node, direction, context);
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

            // if

            // @ts-ignore
            if (previous?.type == node.type && node.type == 'Rule' && "selector" in previous && previous.selector == node.selector) {

                // console.log({previous})

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
          else  if (node.type == 'AtRule' && node.name == 'media' && node.value == 'all') {

                // @ts-ignore
                this.#root.children.splice(i, 1, ...node.children);
                i+= node.children.length;
            }

            // @ts-ignore
            previous = node;
        }

        return this;
    }

    #compactRule(node: AstRule) {

    }

    getAst() {

        return this.#root;
    }

    getErrors(): Error[] {

        return this.#errors;
    }

    #createRoot(): AstRuleStyleSheet {

        return {
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
                }
            },
            children: []
        }
    }

    toString() {

        return new Renderer().render(this);
    }
}