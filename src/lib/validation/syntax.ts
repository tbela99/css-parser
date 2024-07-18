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
    ValidationParensToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationToken,
    ValidationTokenEnum
} from "./parser";
import {
    ColorToken,
    DimensionToken,
    FunctionToken,
    IdentToken,
    LiteralToken,
    NumberToken,
    Token
} from "../../@types/index.d";
import {ErrorDescription, ValidationConfiguration} from "../../@types/validation.d";
import {EnumToken} from "../ast";
import {isLength} from "../parser";
import {getConfig} from "./config";

const config: ValidationConfiguration = getConfig();

export function validateSyntax(syntaxes: ValidationToken[], tokens: Token[], errors?: ErrorDescription[], parents?: ValidationToken[]): boolean {

    let token: Token | null;
    let syntax: ValidationToken;
    let result: boolean;
    let prevSyntax: ValidationToken | null = null;

    let children: ValidationToken[];
    let queue: ValidationToken[];
    let matches: ValidationToken[];
    let child: ValidationColumnToken;
    let astNodes: Set<Token> = new Set;

    // console.error('> ' + syntaxes.reduce((acc, curr) => acc + render(curr), ''));

    while (tokens.length > 0) {

        token = tokens[0];

        if (syntaxes.length == 0) {

            return true;
        }

        syntax = syntaxes[0] as ValidationToken;

        if (token.typ == EnumToken.WhitespaceTokenType) {

            if (syntax.typ == ValidationTokenEnum.Whitespace) {

                syntaxes.shift();
            }

            tokens.shift();
            continue;
        }

        if (syntax.typ == ValidationTokenEnum.Whitespace) {

            syntaxes.shift();
            continue;
        }

        result = false;
        // isOptional = syntax.isOptional ?? syntax.isRepeatable ?? null;

        // throw new Error('foo');

        // @ts-ignore
        if (token.val != null && specialValues.includes(token.val as string)) {

            result = true;
        } else {

            switch (syntax.typ) {

                case ValidationTokenEnum.Comma:

                    result = token.typ === EnumToken.CommaTokenType;
                    break;

                case ValidationTokenEnum.DeclarationType:

                    result = validateSyntax(config.declarations[(syntax as ValidationDeclarationToken).val].ast.slice(), tokens, errors, (parents ?? []).concat(syntax));
                    break;

                case ValidationTokenEnum.Keyword:

                    result = (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare((syntax as ValidationKeywordToken).val, 'en', {sensitivity: 'base'}) == 0) ||
                        (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == 'lit' && (syntax as ValidationKeywordToken).val.localeCompare((token as ColorToken).val as string, 'en', {sensitivity: 'base'}) == 0);

                    break;

                case ValidationTokenEnum.Separator:

                    result = token.typ == EnumToken.LiteralTokenType && (token as LiteralToken).val != '/';
                    break;

                case ValidationTokenEnum.PropertyType:

                    if ('hex-color' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == 'hex';

                    } else if ('resolution' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.ResolutionTokenType;

                    } else if ('angle' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');

                    } else if ('time' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.TimingFunctionTokenType;

                    } else if ('ident' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.IdenTokenType;

                    } else if ('hash-token' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.HashTokenType;

                    } else if (['integer', 'number'].includes((syntax as ValidationPropertyToken).val)) {

                        result = token.typ == EnumToken.NumberTokenType;
                        result = token.typ == EnumToken.NumberTokenType && ('integer' != (syntax as ValidationPropertyToken).val || Number.isInteger(+token.val));

                        if (result && 'range' in syntax) {

                            const value: number = Number((token as NumberToken).val);
                            const range: number[] = (syntax as ValidationPropertyToken).range as number[];

                            result = value >= range[0] && (range[1] == null || value <= range[1]);
                        }

                    } else if ('length' == (syntax as ValidationPropertyToken).val) {

                        result = isLength(token as DimensionToken) || (token.typ == EnumToken.NumberTokenType && token.val == '0');

                    } else if ('percentage' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');

                    } else if ('dashed-ident' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.DashedIdenTokenType;

                    } else if ('custom-ident' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.DashedIdenTokenType || token.typ == EnumToken.IdenTokenType;

                    } else if ('custom-property-name' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.DashedIdenTokenType;

                    } else if ('string' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.StringTokenType;

                    } else if ('declaration-value' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ != EnumToken.LiteralTokenType;

                    } else if ('url' == (syntax as ValidationPropertyToken).val) {

                        result = token.typ == EnumToken.UrlFunctionTokenType || token.typ == EnumToken.StringTokenType;

                    } else {

                        const val = (syntax as ValidationPropertyToken).val as string;

                        if (val in config.declarations || val in config.syntaxes) {

                            result = validateSyntax((config.syntaxes[val] ?? config.declarations[val]).ast.slice(), tokens, errors, (parents ?? []).concat(syntax));

                        } else {

                            result = false;
                        }
                    }

                    break;


                case ValidationTokenEnum.Parens:
                case ValidationTokenEnum.Function:

                    if ((syntax as ValidationParensToken).typ == ValidationTokenEnum.Parens) {

                        result = token.typ == EnumToken.ParensTokenType;

                    } else {

                        result = 'chi' in token && 'val' in token &&
                            (token as FunctionToken).val.localeCompare((syntax as ValidationFunctionToken).val, 'en', {sensitivity: 'base'}) == 0;
                    }

                    if (result) {

                        result = validateSyntax((syntax as ValidationFunctionToken).chi.slice(), (token as FunctionToken).chi.slice(), errors, parents);
                    }

                    break;

                case ValidationTokenEnum.ValidationFunctionDefinition:

                    result = 'val' in token && 'chi' in token;

                    if (result) {

                        result = (token as FunctionToken).val.localeCompare((syntax as ValidationFunctionDefinitionToken).val, 'en', {sensitivity: 'base'}) == 0;

                        if (result) {

                            const s = config.syntaxes[(syntax as ValidationFunctionDefinitionToken).val + '()'];
                            result = validateSyntax(s.ast.slice(), [token], errors, parents);
                        }
                    }

                    break;

                case ValidationTokenEnum.Bracket:

                    result = validateSyntax((syntax as ValidationBracketToken).chi.slice(), tokens, errors, (parents ?? []).concat(syntax));

                    break;

                case ValidationTokenEnum.PipeToken:

                    result = validateSyntax((syntax as ValidationPipeToken).l.slice(), [token], errors, (parents ?? []).concat(syntax)) ||
                        validateSyntax((syntax as ValidationPipeToken).r.slice(), tokens.slice(), errors, (parents ?? []).concat(syntax));

                    break

                case ValidationTokenEnum.AmpersandToken:

                    children = [...(syntax as ValidationAmpersandToken).l.slice(), ...(syntax as ValidationAmpersandToken).r.slice()] as ValidationToken[];
                    matches = [] as ValidationToken[];
                    queue = [] as ValidationToken[];

                    for (let j = 0; j < children.length; j++) {

                        if (validateSyntax([children[j]], [token], errors, (parents ?? []).concat(syntax))) {

                            matches.push(...children.splice(j, 1) as ValidationToken[]);
                            j = 0;

                            astNodes.delete(token);
                            tokens.shift();
                            token = tokens[0];

                            if (token == null) {

                                break;
                            }

                            astNodes.add(token);
                        }
                    }

                    if (astNodes.size > 0) {

                        tokens.unshift(...astNodes);
                        astNodes = new Set();
                    }

                    result = matches.length > 0;
                    break;


                case ValidationTokenEnum.ColumnToken:

                    children = [...(syntax as ValidationColumnToken).l.slice(), ...(syntax as ValidationColumnToken).r.slice()] as ValidationToken[];
                    matches = [] as ValidationToken[];
                    queue = [] as ValidationToken[];

                    while ((child = children.shift() as ValidationColumnToken)) {

                        if (validateSyntax([child], tokens, errors, (parents ?? []).concat(syntax))) {

                            matches.push(child);

                            tokens.shift();
                            token = tokens[0];

                            if (queue.length > 0) {

                                children.unshift(...queue);
                                queue = [];
                            }

                            if (token == null) {

                                break;
                            }

                        } else {

                            queue.push(child);
                        }
                    }

                    result = matches.length > 0;
                    break;

                default:

                    // result = doValidateSyntax(syntax, token, tokens.slice(), errors, parents);

                    console.error({syntax, token});
                    throw new Error('not implemented');
            }
        }

        // @ts-ignore
        // console.error(JSON.stringify({
        //     prevSyntax: prevSyntax == null ? null : render(prevSyntax),
        //     syntax,
        //     s: render(syntax),
        //     token,
        //     result
        // }, null, 1));

        if (result) {

            tokens.shift();
        }

        if (!result) {

            if (syntax.isOptional ?? syntax.isRepeatable ?? false) {

                syntaxes.shift();

                if (syntaxes[0]?.typ == ValidationTokenEnum.Whitespace &&
                    syntaxes[1]?.typ == ValidationTokenEnum.Comma) {

                    syntaxes.splice(0, 2);
                } else if (syntaxes[0]?.typ == ValidationTokenEnum.Comma) {

                    syntaxes.shift();
                }

                continue;
            }

            return false;
        }

        if (syntax.isList || syntax.atLeastOnce) {

            const s = {...syntax, isList: false, atLeastOnce: false} as ValidationToken;

            while (tokens.length > 0) {

                token = tokens[0] as Token;

                if (
                    (!syntax.atLeastOnce && token.typ != EnumToken.CommaTokenType &&
                        !validateSyntax([s] as ValidationToken[], tokens.slice(), errors))) {

                    break;
                }

                tokens.shift();
            }
        }

        // @ts-ignore
        if (syntax.occurence != null && syntax.occurence.max != null) {

            // consume all tokens
            let match: number = 1;

            // @ts-ignore
            const s = {...syntax, isList: false, occurence: null} as ValidationToken;

            // @ts-ignore
            while (match < syntax.occurence.max) {

                token = tokens[0] as Token;

                if (token == null ||
                    !validateSyntax([s] as ValidationToken[], tokens, errors)) {

                    break;
                }

                tokens.shift();
            }
        }

        syntaxes.shift();
    }

    return true;
}
