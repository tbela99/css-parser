import {
    AstAtRule, AstDeclaration,
    AstNode, AstRule,
    AstRuleStyleSheet,
    AstTraverserHandler, ErrorDescription,
    ParserOptions
} from "../@types";
import {Observer} from "@tbela99/observer";
import {Renderer} from "../renderer";
import {tokenize} from "./tokenize";

export class Parser {

    #options: ParserOptions;
    #observer: Observer;
    // @ts-ignore
    #root: AstRuleStyleSheet;
    #errors: ErrorDescription[] = [];

    constructor(options: ParserOptions = {
        // strict: false,
        // location: false,
        // processImport: false,
        // dedup: false,
        // removeEmpty: false
    }) {

        // @ts-ignore
        this.#options = {
            strict: false,
            location: false,
            processImport: false,
            dedup: false, removeEmpty: false, ...options};
        this.#observer = new Observer();
    }

    parse(css: string, src: string = ''): this {

        this.#errors = [];
        this.#createRoot();

        if (css.length == 0) {

            return this;
        }

        // @ts-ignore
        this.#root = tokenize(css, this.#errors, this.#observer.getListeners('enter', 'exit'),  this.#options, src);

        if (this.#options.dedup) {

            deduplicate(this.#root);
        }

        return this;
    }

    on(name: string, handler: AstTraverserHandler, signal?: AbortSignal): this {

        this.#observer.on(name, handler, signal);
        return this;
    }

    off(name: string, handler?: AstTraverserHandler): this {

        this.#observer.off(name, handler);
        return this;
    }

    getAst(): AstRuleStyleSheet {

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

    toString(): string {

        return new Renderer().render(this);
    }
}

function deduplicate(ast: AstNode) {

    if ('chi' in ast) {

        // @ts-ignore
        let i: number = <number>ast.chi.length;
        let previous: AstNode;
        let node: AstNode;

        while (i--) {

            // @ts-ignore
            node = <AstNode>ast.chi[i];

            // @ts-ignore
            if (node.typ == 'Comment') {

                continue;
            }

            // @ts-ignore
            if (node.typ == previous?.typ) {

                if ((node.typ == 'Rule' && (<AstRule>node).sel == (<AstRule> previous).sel) || ('chi' in node && node.typ == 'AtRule' && (<AstAtRule> node).nam == (<AstAtRule> previous).nam)) {

                    // @ts-ignore
                    previous.chi = node.chi.concat(...previous.chi);

                    // @ts-ignore
                    ast.chi.splice(i, 1);

                    // @ts-ignore
                    if (previous.typ == 'Rule' || previous.chi.some(n => n.typ == 'Declaration')) {

                        deduplicateRule(previous);
                    }

                    else {

                        deduplicate(previous);
                    }

                    continue;
                }

                else if (node.typ == 'Declaration' && (<AstDeclaration>node).nam == (<AstDeclaration>previous).nam) {

                    // @ts-ignore
                    ast.chi.splice(i, 1);
                    continue;
                }
            }

            if (!('chi' in node)) {

                continue;
            }

            // @ts-ignore
            if (node.typ == 'Rule' || node.chi.some(n => n.typ == 'Declaration')) {

                deduplicateRule(node);
            }

            else {

                deduplicate(node);
            }

            previous = node;
        }
    }

    return ast;
}

function deduplicateRule(ast: AstNode): AstNode {

    if (!('chi' in ast) || ast.chi?.length == 0) {

        return ast;
    }

    const set: Set<string> = new Set;

    // @ts-ignore
    let i: number = <number>ast.chi.length;
    let node: AstNode;

    while (i--) {

        // @ts-ignore
        node = <AstDeclaration>ast.chi[i];

        if (node.typ != 'Declaration') {

            continue;
        }

        // @ts-ignore
        if (set.has(node.nam)) {

            // @ts-ignore
            ast.chi.splice(i, 1);
            continue;
        }

        // @ts-ignore
        set.add(node.nam);
    }

    return ast;
}