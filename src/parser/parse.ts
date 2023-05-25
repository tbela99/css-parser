import {
    AstAtRule, AstDeclaration,
    AstNode, AstRule,
    AstRuleStyleSheet,
    ErrorDescription,
    ParserOptions
} from "../@types";
import {tokenize} from "./tokenize";

export function parse(css: string, opt: ParserOptions = {}): { ast: AstRuleStyleSheet; errors: ErrorDescription[] } {

    const errors: ErrorDescription[] = [];
    const options: ParserOptions = {
        src: '',
        location: false,
        processImport: false,
        deduplicate: false,
        removeEmpty: false,
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

            if (node.typ == 'AtRule' && (<AstAtRule>node).nam == 'media' && (<AstAtRule>node).val == 'all') {

                // @ts-ignore
                ast.chi.splice(i, 1, ...node.chi);
                // @ts-ignore
                i += node.chi.length;
                continue;
            }

            // @ts-ignore
            if (node.typ == previous?.typ) {

                if ((node.typ == 'Rule' && (<AstRule>node).sel == (<AstRule>previous).sel) ||
                    (node.typ == 'AtRule' &&
                        (<AstAtRule>node).nam == (<AstAtRule>previous).nam &&
                        (<AstAtRule>node).val == (<AstAtRule>previous).val
                    )) {

                    if ('chi' in node) {

                        // @ts-ignore
                        previous.chi = node.chi.concat(...(previous.chi || []));
                    }

                    // @ts-ignore
                    ast.chi.splice(i, 1);

                    if (!('chi' in previous)) {

                        continue;
                    }

                    // @ts-ignore
                    if (previous.typ == 'Rule' || previous.chi.some(n => n.typ == 'Declaration')) {

                        deduplicateRule(previous);
                    } else {

                        deduplicate(previous);
                    }

                    continue;
                } else if (node.typ == 'Declaration' && (<AstDeclaration>node).nam == (<AstDeclaration>previous).nam) {

                    // @ts-ignore
                    ast.chi.splice(i, 1);
                    continue;
                }
            }

            previous = node;

            if (!('chi' in node)) {

                continue;
            }

            // @ts-ignore
            if (node.typ == 'AtRule' || node.chi.some(n => n.typ == 'Declaration')) {

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