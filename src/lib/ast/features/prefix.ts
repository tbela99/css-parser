import {EnumToken} from "../types.ts";
import type {
    AstAtRule,
    AstDeclaration,
    AstRule,
    IdentToken,
    MinifyFeatureOptions,
    Token
} from "../../../@types/index.d.ts";
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

const config = getSyntaxConfig();

export class ComputePrefixFeature {

    static get ordering() {
        return 2;
    }

    static register(options: MinifyFeatureOptions) {

        if (options.removePrefix) {

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

                    const match = (<AstDeclaration>node).nam.match(/^-([^-]+)-(.+)$/);

                    if (match != null) {

                        const nam: string = match[2];

                        if (nam.toLowerCase() in config.declarations) {

                            (<AstDeclaration>node).nam = nam;
                        }
                    }
                }

                if ((<AstDeclaration>node).nam.toLowerCase() in config.declarations) {

                    for (const {value} of walkValues((<AstDeclaration>node).val)) {

                        if (value.typ == EnumToken.IdenTokenType && (value as IdentToken).val.charAt(0) == '-' && (value as IdentToken).val.charAt(1) != '-') {

                            // @ts-ignore
                            const values: ValidationToken[] = config.declarations[(<AstDeclaration>node).nam].ast?.slice?.() as ValidationToken[];
                            const match = (value as IdentToken).val.match(/^-(.*?)-(.*)$/);

                            if (values != null && match != null) {

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