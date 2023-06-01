import {
    AstAtRule, AstNode, AstRule,
    AstRuleStyleSheet,
    ErrorDescription,
    ParserOptions
} from "../@types";
import {tokenize} from "./tokenize";
import {PropertyList} from "./declaration";

export function parse(css: string, opt: ParserOptions = {}): { ast: AstRuleStyleSheet; errors: ErrorDescription[] } {

    const errors: ErrorDescription[] = [];
    const options: ParserOptions = {
        src: '',
        location: false,
        processImport: false,
        deduplicate: false,
        removeEmpty: true,
        ...opt
    };

    if (css.length == 0) {

        // @ts-ignore
        return null;
    }

    // @ts-ignore
    const ast: AstRuleStyleSheet = tokenize(css, errors, options);

    if (options.deduplicate) {

        deduplicate(ast);
    }

    return {ast, errors};
}

export function deduplicate(ast: AstNode) {

    // @ts-ignore
    if (('chi' in ast) && ast.chi?.length > 0) {

        // @ts-ignore
        let i: number = 0;
        let previous: AstNode;
        let node: AstNode;
        let nodeIndex: number;

        // @ts-ignore
        for (; i < <number>ast.chi.length; i++) {

            // @ts-ignore
            node = ast.chi[i];

            if (node.typ == 'Comment') {

                continue;
            }

            if (node.typ == 'AtRule' && (<AstAtRule>node).val == 'all') {

                // @ts-ignore
                ast.chi?.splice(i, 1, ...(<AstAtRule>node).chi);
                i--;
                continue;
            }

            if (('chi' in node)) {

                // @ts-ignore
                if (previous != null && previous.typ == node.typ) {

                    // @ts-ignore
                    if ((node.typ == 'Rule' && (<AstRule>node).sel == (<AstAtRule>previous).sel) ||
                        // @ts-ignore
                        (node.typ == 'AtRule') && (<AstRule>node).val == (<AstRule>previous).val) {

                        let shouldMerge = true;
                        // @ts-ignore
                        let k = previous.chi.length;

                        while (k--) {

                            // @ts-ignore
                            if (previous.chi[k].typ == 'Comment') {

                                continue;
                            }

                            // @ts-ignore
                            shouldMerge = previous.chi[k].typ == 'Declaration';
                            break;
                        }

                        if (shouldMerge) {

                            // @ts-ignore
                            node.chi.unshift(...previous.chi);
                            // @ts-ignore
                            ast.chi.splice(nodeIndex, 1);
                            i--;
                            previous = node;
                            nodeIndex = i;
                            continue;
                        }
                    }
                }

                // @ts-ignore
                if (previous != null && previous != node && 'chi' in previous) {

                    // @ts-ignore
                    if (previous.chi.some(n => n.typ == 'Declaration')) {

                        deduplicateRule(previous);
                    } else {

                        deduplicate(previous);
                    }
                }
            }

            previous = node;
            nodeIndex = i;
        }

        // @ts-ignore
        if (node != null && ('chi' in node)) {

            // @ts-ignore
            if (node.chi.some(n => n.typ == 'Declaration')) {

                deduplicateRule(node);
            } else {

                deduplicate(node);
            }
        }
    }

    return ast;
}

export function deduplicateRule(ast: AstNode): AstNode {

    if (!('chi' in ast) || ast.chi?.length == 0) {

        return ast;
    }

    // @ts-ignore
    const j: number = <number>ast.chi.length;
    let k: number = 0;

    const properties: PropertyList = new PropertyList();

    for (; k < j; k++) {

        // @ts-ignore
        if ('Comment' == ast.chi[k].typ || 'Declaration' == ast.chi[k].typ) {

            // @ts-ignore
            properties.add(ast.chi[k]);
            continue;
        }

        break;
    }

    // @ts-ignore
    ast.chi = [...properties].concat(ast.chi.slice(k));

    // @ts-ignore
    // ast.chi.splice(0, k - 1, ...properties);

    // console.debug({k, removed});
    return ast;
}