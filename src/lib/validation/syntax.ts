import {
    ValidationAmpersandToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationDeclarationToken,
    ValidationFunctionDefinitionToken,
    ValidationFunctionToken,
    ValidationKeywordToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationToken,
    ValidationTokenEnum
} from "./parser";
import {DimensionToken, FunctionToken, IdentToken, NumberToken, Token} from "../../@types";
import {ErrorDescription, ValidationConfiguration} from "../../@types/validation";
import {EnumToken} from "../ast";
import {isLength} from "../parser";
import {getConfig} from "./config";

const config: ValidationConfiguration = getConfig();

export function validateSyntax(syntax: ValidationToken[], tokens: Token[], errors?: ErrorDescription[]): boolean {

    let token: Token | null;

    tokens = [...tokens];

    for (let i = 0; i < syntax.length; i++) {

        if ([ValidationTokenEnum.Whitespace, ValidationTokenEnum.Comma].includes(syntax[i].typ)) {

            continue;
        }

        token = getNextToken(tokens, false);

        if (token == null) {

            if (syntax[i].isOptional) {

                continue;
            }

            return false;
        }

        if (token.typ == EnumToken.FunctionTokenType && token.val == 'var') {

            if (!validateSyntax(config.functions.var.ast[0].chi, (token as FunctionToken).chi, errors)) {

                return false
            }

            continue;
        }

        switch (syntax[i].typ) {

            case ValidationTokenEnum.Keyword:

                if (!(token?.typ == EnumToken.IdenTokenType && (token as IdentToken).val == (syntax[i] as ValidationKeywordToken).val)) {

                    return false;
                }

                break;

            case ValidationTokenEnum.DeclarationType:

                if (!validateSyntax(config.declarations[(syntax[i] as ValidationDeclarationToken).val].ast, [token], errors)) {

                    return false;
                }

                break;


            case ValidationTokenEnum.PropertyType:

                // console.debug({token, syntax: syntax[i]});

                if ('ident' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.IdenTokenType) {

                        return false;
                    }
                }

                else if ('hash-token' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.HashTokenType) {

                        return false;
                    }
                }

                else if (['integer', 'number'].includes((syntax[i] as ValidationPropertyToken).val)) {

                    if (!(token.typ == EnumToken.NumberTokenType)) {

                        return false;
                    }

                    if ('range' in syntax[i]) {

                        const value: number = Number((token as NumberToken).val);
                        const range: number[] = (syntax[i] as ValidationPropertyToken).range as number[];

                        if (value < range[0] || (range[1] != null && value > range[1])) {

                            return false;
                        }
                    }

                } else if ('length' == (syntax[i] as ValidationPropertyToken).val) {

                    if (!isLength(token as DimensionToken)) {

                        return false;
                    }

                } else if ('percentage' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ == EnumToken.PercentageTokenType) {

                        continue;
                    }

                    if ((token as NumberToken).val == '0' && token.typ != EnumToken.NumberTokenType) {

                        return false;
                    }

                } else if ('custom-ident' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType && token.typ != EnumToken.IdenTokenType) {

                        return false;
                    }

                } else if ('custom-property-name' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType) {

                        return false;
                    }

                } else if ('string' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType &&
                        token.typ != EnumToken.IdenTokenType &&
                        token.typ != EnumToken.StringTokenType) {

                        return false;
                    }

                } else if ('declaration-value' == (syntax[i] as ValidationPropertyToken).val) {

                    continue;

                } else if ('url' == (syntax[i] as ValidationPropertyToken).val) {

                    if (![EnumToken.StringTokenType, EnumToken.UrlFunctionTokenType].includes(token.typ)) {

                        return false
                    }

                } else if (!validateSyntax(config.syntaxes[(syntax[i] as ValidationPropertyToken).val].ast, [token], errors)) {

                    return false;
                }

                break;

            case ValidationTokenEnum.Function:

                if (!validateSyntax((syntax[i] as ValidationFunctionToken).chi, [token], errors)) {

                    return false;
                }

                break;

            case ValidationTokenEnum.PipeToken:
            case ValidationTokenEnum.ColumnToken:

                if (!validateSyntax((syntax[i] as ValidationPipeToken | ValidationColumnToken).l, [token], errors) && !validateSyntax((syntax[i] as ValidationPipeToken | ValidationColumnToken).r, [token], errors)) {

                    return false;
                }

                break;

            case ValidationTokenEnum.ValidationFunctionDefinition:

                // console.debug(config.functions[(syntax[i] as ValidationFunctionDefinitionToken).val].ast, token);

                if (token.typ == EnumToken.FunctionTokenType) {

                    if (!validateSyntax(config.functions[(syntax[i] as ValidationFunctionDefinitionToken).val].ast, token.chi, errors)) {

                        return false;
                    }
                }

                break;

            case ValidationTokenEnum.Bracket:

                if (!validateSyntax((syntax[i] as ValidationBracketToken).chi, [token], errors)) {

                    return false;
                }

                break;

                case ValidationTokenEnum.AmpersandToken:

                    if (!validateSyntax((syntax[i] as ValidationAmpersandToken).l, [token], errors) || !validateSyntax((syntax[i] as ValidationAmpersandToken).r, [token], errors)) {

                        return false;
                    }

                    break;

            default:

                console.debug(token, syntax[i]);
                throw new Error('not implemented');
        }
    }

    return true;
}

function getNextToken(tokens: Token[], whiteSpace: boolean = true): Token | null {

    let item: Token;
    let index: number = -1;

    while (++index < tokens.length) {

        item = tokens[index];

        if (!whiteSpace && item.typ == EnumToken.WhitespaceTokenType) {

            continue;
        }

        tokens.splice(0, index + 1);
        return item;
    }

    tokens.length = 0;
    return null;
}