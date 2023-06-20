import {
    AstAtRule, AstComment, AstDeclaration, AstNode, AstRule,
    AstRuleStyleSheet,
    ErrorDescription,
    ParserOptions, Token
} from "../@types";
import {tokenize} from "./tokenize";
import {PropertyList} from "./declaration";
import {eq} from "./utils/eq";

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

function diff(node1: AstRule, node2: AstRule) {

    // @ts-ignore
    return node1.chi.every((val: AstDeclaration | AstComment) => {

        if (val.typ == 'Comment') {

            return true;
        }

        if (val.typ != 'Declaration') {

            return false;
        }

        return node2.chi.some(v => eq(v, val))
    })
}

export function deduplicate(ast: AstNode) {

    // @ts-ignore
    if (('chi' in ast) && ast.chi?.length > 0) {

        let i: number = 0;
        let previous: AstNode;
        let node: AstNode;
        let nodeIndex: number;

        // @ts-ignore
        for (; i < <number>ast.chi.length; i++) {

            // @ts-ignore
            if (ast.chi[i].typ == 'Comment') {

                continue;
            }

            // @ts-ignore
            node = ast.chi[i];

            if (node.typ == 'AtRule' && (<AstAtRule>node).nam == 'font-face') {

                continue;
            }

            if (node.typ == 'AtRule' && (<AstAtRule>node).val == 'all') {

                // @ts-ignore
                ast.chi?.splice(i, 1, ...(<AstAtRule>node).chi);
                i--;
                continue;
            }

            // @ts-ignore
            if (previous != null && 'chi' in previous && ('chi' in node)) {

                // @ts-ignore
                if (previous.typ == node.typ) {

                    let shouldMerge = true;

                    // @ts-ignore
                    let k = previous.chi.length;

                    while (k-- > 0) {

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
                        if ((node.typ == 'Rule' && (<AstRule>node).sel == (<AstAtRule>previous).sel) ||
                            // @ts-ignore
                            (node.typ == 'AtRule') && (<AstRule>node).val == (<AstRule>previous).val) {

                            // @ts-ignore
                            node.chi.unshift(...previous.chi);
                            // @ts-ignore
                            ast.chi.splice(nodeIndex, 1);
                            i--;
                            previous = node;
                            nodeIndex = i;
                            continue;
                        } else if (node.typ == 'Rule') {

                            if (diff(<AstRule>node, <AstRule>previous) && diff(<AstRule>previous, <AstRule>node)) {

                                if (node.typ == 'Rule') {

                                    (<AstRule>previous).sel += ',' + (<AstRule>node).sel;
                                }

                                // @ts-ignore
                                ast.chi.splice(i, 1);
                                i--;
                                // previous = node;
                                // nodeIndex = i;
                            }
                        }
                    }
                }

                // @ts-ignore
                if (previous != node) {

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

    return ast;
}