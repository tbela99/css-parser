import {
    render,
    specialValues,
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
import {DimensionToken, FunctionToken, IdentToken, LiteralToken, NumberToken, Token} from "../../@types";
import {ErrorDescription, ValidationConfiguration} from "../../@types/validation";
import {EnumToken} from "../ast";
import {isLength} from "../parser";
import {getConfig} from "./config";

const config: ValidationConfiguration = getConfig();

export function validateSyntax(syntax: ValidationToken[], tokens: Token[], errors?: ErrorDescription[]): boolean {

    let token: Token | null;

    let children: ValidationToken[][];
    let matches: ValidationToken[][][];
    let found:  boolean;

    tokens = tokens.slice();

    // console.error(JSON.stringify({formula: syntax.reduce((acc, curr) => acc + render(curr), ''), syntax, tokens}, null, 1));

    for (let i = 0; i < syntax.length; i++) {

        token = getCurrentToken(tokens, false);

        console.error('-> ' + render(syntax[i]));
        console.error(syntax[i], token);
        console.error('--> ' + render(syntax[i]));

        const isOptional = syntax[i].isOptional ?? syntax[i].isRepeatable ?? null;

        if (syntax[i].typ == ValidationTokenEnum.Whitespace) {

            // if (token?.typ == EnumToken.WhitespaceTokenType) {
            //
            //     getNextToken(tokens, false);
            // }

            continue;
        }

        if (token == null) {


            if ((isOptional) || syntax[i].typ == ValidationTokenEnum.Comma) {

                // if (peekNextToken(tokens, false)?.typ == EnumToken.CommaTokenType) {
                //
                //     getNextToken(tokens, false);
                // }

                continue;
            }

            return false;
        }

        if (token.typ == EnumToken.FunctionTokenType && token.val == 'var') {

            if (!validateSyntax(config.syntaxes['var()'].ast[0].chi, (token as FunctionToken).chi, errors)) {

                return false;
            }

            getNextToken(tokens, false);
            continue;
        }


        // if (syntax[i].isList) {

        // next is comma
        // next passes validation
        // console.error('is list', syntax[i].isList);
        // }

        // @ts-ignore
        if (token.val != null && specialValues.includes(token.val as string)) {

            getNextToken(tokens, false);
            continue;
        }

        if (token.typ == EnumToken.FunctionTokenType && token.val == 'var') {

            if (!validateSyntax(config.functions.var.ast[0].chi, (token as FunctionToken).chi, errors)) {

                if (isOptional) {

                    continue;
                }

                return false;
            }

            getNextToken(tokens, false);
            continue;
        }

        switch (syntax[i].typ) {

            // case ValidationTokenEnum.Whitespace:
            //
            //     if (token.typ == EnumToken.WhitespaceTokenType) {
            //
            //         getNextToken(tokens, true);
            //     }
            //
            //     continue;

            case ValidationTokenEnum.Comma:

                if (token.typ != EnumToken.CommaTokenType) {

                    return false;
                }

                break;

            case ValidationTokenEnum.Separator:

                if (token.typ != EnumToken.LiteralTokenType || (token as LiteralToken).val != '/') {

                    return false;
                }

                break;

            case ValidationTokenEnum.Keyword:

                if (!(token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare((syntax[i] as ValidationKeywordToken).val, 'en', {sensitivity: 'base'}) == 0)) {

                    return false;
                }

                break;

            case ValidationTokenEnum.DeclarationType:

                if (!validateSyntax(config.declarations[(syntax[i] as ValidationDeclarationToken).val].ast, [token], errors)) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }

                break;

            case ValidationTokenEnum.PropertyType:

                if ('hex-color' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.ColorTokenType) {

                        return false;
                    }
                } else if ('resolution' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.ResolutionTokenType) {

                        return false;
                    }
                } else if ('angle' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.AngleTokenType) {

                        if (token.typ != EnumToken.NumberTokenType || token.val != '0') {

                            if (isOptional) {

                                continue;
                            }

                            return false;
                        }
                    }

                } else if ('time' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.TimingFunctionTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('ident' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.IdenTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('hash-token' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.HashTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if (['integer', 'number'].includes((syntax[i] as ValidationPropertyToken).val)) {

                    if (token.typ != EnumToken.NumberTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                    if ('range' in syntax[i]) {

                        const value: number = Number((token as NumberToken).val);
                        const range: number[] = (syntax[i] as ValidationPropertyToken).range as number[];

                        if (value < range[0] || (range[1] != null && value > range[1])) {

                            if (isOptional) {

                                continue;
                            }

                            return false;
                        }
                    }

                } else if ('length' == (syntax[i] as ValidationPropertyToken).val) {

                    if (!isLength(token as DimensionToken)) {

                        if (token.typ != EnumToken.NumberTokenType || token.val != '0') {

                            if (isOptional) {

                                continue;
                            }

                            return false;
                        }
                    }

                } else if ('percentage' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ == EnumToken.PercentageTokenType) {

                        break;
                    }

                    if ((token as NumberToken).val == '0' && token.typ != EnumToken.NumberTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('dashed-ident' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('custom-ident' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType && token.typ != EnumToken.IdenTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('custom-property-name' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('string' == (syntax[i] as ValidationPropertyToken).val) {

                    if (token.typ != EnumToken.DashedIdenTokenType &&
                        token.typ != EnumToken.IdenTokenType &&
                        token.typ != EnumToken.StringTokenType) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else if ('declaration-value' == (syntax[i] as ValidationPropertyToken).val) {

                    break;

                } else if ('url' == (syntax[i] as ValidationPropertyToken).val) {

                    if (![EnumToken.StringTokenType, EnumToken.UrlFunctionTokenType].includes(token.typ)) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }

                } else {

                    const s = (config.syntaxes[(syntax[i] as ValidationPropertyToken).val] ?? config.declarations[(syntax[i] as ValidationPropertyToken).val]);

                    if (s == null) {

                        console.error(s, syntax[i], token);

                        throw new Error(`Invalid syntax: `);
                    }

                    if (!validateSyntax(s.ast, [token], errors)) {

                        if (isOptional) {

                            continue;
                        }

                        return false;
                    }
                }

                break;

            case ValidationTokenEnum.Function:

                if (!validateSyntax((syntax[i] as ValidationFunctionToken).chi, [token], errors)) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }

                break;

            case ValidationTokenEnum.PipeToken:

                 children = (syntax[i] as ValidationPipeToken).chi.slice() as ValidationToken[][];
                 matches = [] as ValidationToken[][][];
                 found = false;

                for (let j = 0; j < children.length; j++) {

                    if (validateSyntax(children[j], [token], errors)) {

                        found = true;
                        break;
                    }
                }

                if (!found) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }

                break;

            case ValidationTokenEnum.ColumnToken:

                children = (syntax[i] as ValidationColumnToken).chi.slice() as ValidationToken[][];
                matches = [] as ValidationToken[][][];
                found = false;

                for (let j = 0; j < children.length; j++) {

                    if (validateSyntax(children[j], [token], errors)) {

                        matches.push(children.splice(j, 1));
                        j = 0;

                        getNextToken(tokens, false);
                        token = getCurrentToken(tokens, false);

                        if (token == null) {

                            break;
                        }
                    }
                }

                if (matches.length == 0) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }


                break;

            case ValidationTokenEnum.ValidationFunctionDefinition:

                if (![EnumToken.FunctionTokenType, EnumToken.ImageFunctionTokenType].includes(token.typ)) {

                    return false;
                }

                const s = config.syntaxes[(syntax[i] as ValidationFunctionDefinitionToken).val + '()'];

                if (s == null) {

                    console.error(s, syntax[i], token);
                    throw new Error(`Invalid syntax: `);
                }

                if (!validateSyntax(s.ast, (token as FunctionToken).chi, errors)) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }

                break;

            case ValidationTokenEnum.Bracket:

                if (!validateSyntax((syntax[i] as ValidationBracketToken).chi, [token], errors)) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }

                break;

            case ValidationTokenEnum.AmpersandToken:

                 children = (syntax[i] as ValidationAmpersandToken).chi.slice() as ValidationToken[][];
                 matches = [] as ValidationToken[][][];

                for (let j = 0; j < children.length; j++) {

                    if (validateSyntax(children[j], [token], errors)) {

                        matches.push(children.splice(j, 1));
                        j = 0;

                        getNextToken(tokens, false);
                        token = getCurrentToken(tokens, false);

                        if (token == null) {

                            break;
                        }
                    }
                }

                if (matches.length == 0) {

                    if (isOptional) {

                        continue;
                    }

                    return false;
                }

                break;

            default:

                console.debug(token, syntax[i]);
                throw new Error('not implemented');
        }

        getNextToken(tokens, false);

        if (syntax[i].isList) {

            const t = tokens.slice();
            const s = {...syntax[i], isList: false};

            while (t.length > 0) {

                token = getCurrentToken(t, false);

                if (token == null || token.typ != EnumToken.CommaTokenType) {

                    break;
                }

                getNextToken(t, false);
                token = getCurrentToken(t, false);

                if (token == null || !validateSyntax([s] as ValidationToken[], [token], errors)) {

                    break;
                }

                getNextToken(t, false);
                tokens = [...t];
            }
        }

        // @ts-ignore
        if (syntax[i].occurence != null && syntax[i].occurence.max != null) {

            // consume all tokens
            let match = 1;

            // @ts-ignore
            const s = {...syntax[i], isList: false, occurence: null} as ValidationToken;

            // @ts-ignore
            while (match < syntax[i].occurence.max) {

                token = getCurrentToken(tokens, false);

                if (token == null) {

                    break;
                }

                if (!validateSyntax([s] as ValidationToken[], [token], errors)) {

                    break;
                }

                match++;
                getNextToken(tokens, false);
            }
        }
    }

    // consume current token
    // getNextToken(tokens, false);
    return true;
}

function getCurrentToken(tokens: Token[], whiteSpace: boolean = true): Token | null {

    let item: Token;
    let index: number = -1;

    while (++index < tokens.length) {

        item = tokens[index];

        if (!whiteSpace && item.typ == EnumToken.WhitespaceTokenType) {

            continue;
        }

        return item;
    }

    return null;
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
