import {EnumToken} from "../types.ts";
import type {AstAtRule, AstDeclaration, AstRule, IdentToken, ParserOptions, Token} from "../../../@types/index.d.ts";
import {
    getSyntaxConfig,
    ValidationAmpersandToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationKeywordToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationToken,
    ValidationTokenEnum
} from '../../validation/index.ts'
import {walkValues} from "../walk.ts";
import {webkitPseudoAliasMap} from "../../syntax";
import {splitRule} from "../minify.ts";

const config = getSyntaxConfig();

function replacePseudo(tokens: string[][]): string[][] {

    return tokens.map((raw) => raw.map(r => {

        if (r.startsWith(':-')) {

            const i: number = r.indexOf('(');
            let key: string = i != -1 ? r.slice(1, i) + '()' : r.slice(1);

            if (key in webkitPseudoAliasMap) {

                return ':' + webkitPseudoAliasMap[key] + (i == -1 ? '' : r.slice(i));
            }
        }

        return r;
    }));
}

function replaceAstNodes(tokens: Token[]) {

    for (const {value} of walkValues(tokens!)) {

        if (value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType) {

            if (value.val.startsWith(':-')) {

                let key: string = value.val.slice(1) + (value.typ == EnumToken.PseudoClassFuncTokenType ? '()' : '');

                if (key in webkitPseudoAliasMap) {

                    value.val = ':' + webkitPseudoAliasMap[key];
                }
            }
        }
    }
}

export class ComputePrefixFeature {

     get ordering() {
        return 2;
    }

    get preProcess(): boolean {
        return true;
    }

    get postProcess(): boolean {
        return false;
    }

    static register(options: ParserOptions) {

        if (options.removePrefix) {

            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }

    run(node: AstRule | AstAtRule | AstDeclaration) {

        if (node.typ == EnumToken.RuleNodeType) {

            (node as AstRule).sel = replacePseudo(splitRule((node as AstRule).sel)).reduce((acc, curr, index) => acc + (index > 0 ? ',' : '') + curr.join(''), '');

            if ((node as AstRule).raw != null) {

                (node as AstRule).raw = replacePseudo((node as AstRule).raw as string[][]);
            }

            if ((node as AstRule).optimized != null) {

                (node as AstRule).optimized!.selector = replacePseudo((node as AstRule).optimized!.selector as string[][]);
            }

            if ((node as AstRule).tokens != null) {

                replaceAstNodes((node as AstRule).tokens as Token[]);
            }

        } else if (node.typ == EnumToken.DeclarationNodeType) {

            if ((<AstDeclaration>node).nam.charAt(0) == '-') {

                const match = (<AstDeclaration>node).nam.match(/^-([^-]+)-(.+)$/);

                if (match != null) {

                    const nam: string = match[2];

                    if (nam.toLowerCase() in config.declarations) {

                        (<AstDeclaration>node).nam = nam;
                        replaceAstNodes((<AstDeclaration>node).val);
                    }
                }
            }
        }

        return node;
    }
}

function matchToken(token: Token, matches: ValidationToken[]): null | Token {

    let result: null | Token;
    for (let i = 0; i < matches.length; i++) {

        switch (matches[i].typ) {

            case ValidationTokenEnum.Whitespace:
            case ValidationTokenEnum.Comma:

                break;

            case ValidationTokenEnum.Keyword:

                if (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val == (matches[i] as ValidationKeywordToken).val) {

                    return token;
                }

                break;

            case ValidationTokenEnum.PropertyType:

                if (['ident', 'custom-ident'].includes((matches[i] as ValidationPropertyToken).val)) {

                    if (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val == (matches[i] as ValidationPropertyToken).val) {

                        return token;
                    }
                } else {

                    const val: string = (matches[i] as ValidationPropertyToken).val as string;

                    if (val in config.declarations || val in config.syntaxes) {

                        // @ts-ignore
                        result = matchToken(token, ((config.syntaxes[val] ?? config.declarations[val]) as ValidationToken[]).ast.slice());

                        if (result != null) {

                            return result;
                        }
                    }
                }

                break;

            case ValidationTokenEnum.PipeToken:

                for (let j = 0; j < (<ValidationPipeToken>matches[i]).chi.length; j++) {

                    result = matchToken(token, (<ValidationPipeToken>matches[i]).chi[j]);

                    if (result != null) {

                        return result;
                    }
                }

                break;
            case ValidationTokenEnum.ColumnToken:
            case ValidationTokenEnum.AmpersandToken:

                result = matchToken(token, (<ValidationColumnToken | ValidationAmpersandToken>matches[i]).l);

                if (result == null) {

                    result = matchToken(token, (<ValidationColumnToken | ValidationAmpersandToken>matches[i]).r);
                }

                if (result != null) {

                    return result;
                }

                break;

            case ValidationTokenEnum.Bracket:

                result = matchToken(token, (<ValidationBracketToken>matches[i]).chi);

                if (result != null) {

                    return result;
                }

                break;
        }
    }

    return null;
}