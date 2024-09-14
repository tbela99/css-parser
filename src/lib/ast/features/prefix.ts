import {EnumToken} from "../types";
import type {AstAtRule, AstDeclaration, AstRule, MinifyOptions, Token} from "../../../@types";
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
} from '../../validation'
import {walkValues} from "../walk";

const config = getSyntaxConfig();

export class ComputePrefixFeature {

    static get ordering() {
        return 2;
    }

    static register(options: MinifyOptions) {

        if (options.removePrefix) {

            for (const feature of options.features) {

                if (feature instanceof ComputePrefixFeature) {

                    return;
                }
            }

            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }

    run(ast: AstRule | AstAtRule) {

        // @ts-ignore
        const j: number = ast.chi.length;
        let k: number = 0;
        // @ts-ignore
        for (; k < j; k++) {

            // @ts-ignore
            const node = ast.chi[k];

            if (node.typ == EnumToken.DeclarationNodeType) {

                if ((<AstDeclaration>node).nam.charAt(0) == '-') {

                    const match = (<AstDeclaration>node).nam.match(/^-(.*?)-(.*)$/);

                    if (match != null) {

                        const nam: string = match[2];

                        if (nam.toLowerCase() in config.declarations) {

                            (<AstDeclaration>node).nam = nam;
                        }
                    }
                }

                if ((<AstDeclaration>node).nam.toLowerCase() in config.declarations) {

                    for (const {value} of walkValues((<AstDeclaration>node).val)) {

                        if (value.typ == EnumToken.IdenTokenType && value.val.charAt(0) == '-' && value.val.charAt(1) != '-') {

                            // @ts-ignore
                            const values: ValidationToken[] = config.declarations[(<AstDeclaration>node).nam].ast.slice() as ValidationToken[];
                            const match = value.val.match(/^-(.*?)-(.*)$/);

                            if (match != null) {

                                const val = matchToken({...value, val: match[2]} as Token, values);

                                if (val != null) {

                                    // @ts-ignore
                                    value.val = val.val;
                                }
                            }
                        }
                    }
                }
            }
        }

        return ast;
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

                console.error(matches[i], token);
                if (token.typ == EnumToken.IdenTokenType && token.val == (matches[i] as ValidationKeywordToken).val) {

                    return token;
                }

                break;

            case ValidationTokenEnum.PropertyType:

                if (['ident', 'custom-ident'].includes((matches[i] as ValidationPropertyToken).val)) {

                    if (token.typ == EnumToken.IdenTokenType && token.val == (matches[i] as ValidationPropertyToken).val) {

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
            case ValidationTokenEnum.ColumnToken:
            case ValidationTokenEnum.AmpersandToken:

                result = matchToken(token, (<ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken>matches[i]).l);

                if (result == null) {

                    result = matchToken(token, (<ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken>matches[i]).r);
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

            // default:
            //
            //     console.error(token, matches[i]);
            //     throw new Error('bar bar');

        }
    }

    return null;
}