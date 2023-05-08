import {
    AstComment, AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AstTraverserHandler,
    ParserOptions, Position, Token
} from "../@types";
import {Observer} from "@tbela99/observer";
import {Renderer} from "../renderer";
import {tokenize} from "./tokenize";

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

        // @ts-ignore
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
        // const hasListeners = this.#observer.hasListeners('traverse');
        // @ts-ignore
        const position: Position = this.#root.loc.end;

        tokenize(css, this.#root, position, <boolean>this.#options.location);

        if (this.#options.location) {

            for (const context of stack) {

                // @ts-ignore
                context.loc.end = {...position};
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

        let i = this.#root.chi.length;
        let previous: AstNode | null = null;

        while (i--) {

            const node = this.#root.chi[i];

            // @ts-ignore
            if (previous?.type == node.type && node.type == 'Rule' && "selector" in previous && previous.selector == node.selector) {

                if (!('chi' in node)) {

                    // @ts-ignore
                    node.chi = []
                }

                if ('chi' in previous) {

                    // @ts-ignore
                    node.chi.push(...previous.chi);
                }

                this.#root.chi.splice(i, 1);
            }

            // @ts-ignore
            else if (node.type == 'AtRule' && node.name == 'media' && node.value == 'all') {

                // @ts-ignore
                this.#root.chi.splice(i, 1, ...node.chi);
                // @ts-ignore
                i += node.chi.length;
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
            typ: "StyleSheet",
            loc: {

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
            },
            chi: []
        }

        return this;
    }

    toString() {

        return new Renderer().render(this);
    }
}