import {
    AstComment, AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AstTraverserHandler, ErrorDescription,
    ParserOptions, Position, Token
} from "../@types";
import {Observer} from "@tbela99/observer";
import {Renderer} from "../renderer";
import {tokenize} from "./tokenize";

export class Parser {

    #options: ParserOptions;
    #observer: Observer;
    // @ts-ignore
    #src: string = '';
    // @ts-ignore
    #root: AstRuleStyleSheet;
    #errors: ErrorDescription[] = [];

    constructor(options: ParserOptions = {
        strict: false,
        location: false,
        processImport: false
    }) {

        // @ts-ignore
        this.#options = {strict: false, location: false, processImport: false, ...options};
        this.#observer = new Observer();
    }

    parse(css: string) {

        this.#errors = [];
        this.#createRoot();

        if (css.length == 0) {

            return this;
        }

        // const hasListeners = this.#observer.hasListeners('traverse');
        // @ts-ignore
        this.#root = tokenize(css, this.#errors, this.#observer.getListeners('enter', 'exit'),  <boolean>this.#options.location, this.#src);

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

    getAst() {

        if (this.#root == null) {

            this.#createRoot();
        }

        return this.#root;
    }

    getErrors(): ErrorDescription[] {

        return this.#errors;
    }

    #createRoot(): this {

        this.#root = {
            typ: "StyleSheet",
            chi: [],
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
            }
        }

        return this;
    }

    toString() {

        return new Renderer().render(this);
    }
}