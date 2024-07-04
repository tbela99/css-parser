import { ValidationTokenEnum } from './parser/types.js';
import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../parser/parse.js';
import { isLength } from '../parser/utils/syntax.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import { getConfig } from './config.js';

const config = getConfig();
function validateSyntax(syntax, tokens, errors) {
    let token;
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
            if (!validateSyntax(config.functions.var.ast[0].chi, token.chi)) {
                return false;
            }
            continue;
        }
        switch (syntax[i].typ) {
            case ValidationTokenEnum.Keyword:
                if (!(token?.typ == EnumToken.IdenTokenType && token.val == syntax[i].val)) {
                    return false;
                }
                break;
            case ValidationTokenEnum.DeclarationType:
                if (!validateSyntax(config.declarations[syntax[i].val].ast, [token])) {
                    return false;
                }
                break;
            case ValidationTokenEnum.PropertyType:
                // console.debug({token, syntax: syntax[i]});
                if ('ident' == syntax[i].val) {
                    if (token.typ != EnumToken.IdenTokenType) {
                        return false;
                    }
                }
                else if ('hash-token' == syntax[i].val) {
                    if (token.typ != EnumToken.HashTokenType) {
                        return false;
                    }
                }
                else if (['integer', 'number'].includes(syntax[i].val)) {
                    if (!(token.typ == EnumToken.NumberTokenType)) {
                        return false;
                    }
                    if ('range' in syntax[i]) {
                        const value = Number(token.val);
                        const range = syntax[i].range;
                        if (value < range[0] || (range[1] != null && value > range[1])) {
                            return false;
                        }
                    }
                }
                else if ('length' == syntax[i].val) {
                    if (!isLength(token)) {
                        return false;
                    }
                }
                else if ('percentage' == syntax[i].val) {
                    if (token.typ == EnumToken.PercentageTokenType) {
                        continue;
                    }
                    if (token.val == '0' && token.typ != EnumToken.NumberTokenType) {
                        return false;
                    }
                }
                else if ('custom-ident' == syntax[i].val) {
                    if (token.typ != EnumToken.DashedIdenTokenType && token.typ != EnumToken.IdenTokenType) {
                        return false;
                    }
                }
                else if ('custom-property-name' == syntax[i].val) {
                    if (token.typ != EnumToken.DashedIdenTokenType) {
                        return false;
                    }
                }
                else if ('string' == syntax[i].val) {
                    if (token.typ != EnumToken.DashedIdenTokenType &&
                        token.typ != EnumToken.IdenTokenType &&
                        token.typ != EnumToken.StringTokenType) {
                        return false;
                    }
                }
                else if ('declaration-value' == syntax[i].val) {
                    continue;
                }
                else if ('url' == syntax[i].val) {
                    if (![EnumToken.StringTokenType, EnumToken.UrlFunctionTokenType].includes(token.typ)) {
                        return false;
                    }
                }
                else if (!validateSyntax(config.syntaxes[syntax[i].val].ast, [token])) {
                    return false;
                }
                break;
            case ValidationTokenEnum.Function:
                if (!validateSyntax(syntax[i].chi, [token])) {
                    return false;
                }
                break;
            case ValidationTokenEnum.PipeToken:
            case ValidationTokenEnum.ColumnToken:
                if (!validateSyntax(syntax[i].l, [token]) && !validateSyntax(syntax[i].r, [token])) {
                    return false;
                }
                break;
            case ValidationTokenEnum.ValidationFunctionDefinition:
                // console.debug(config.functions[(syntax[i] as ValidationFunctionDefinitionToken).val].ast, token);
                if (token.typ == EnumToken.FunctionTokenType) {
                    if (!validateSyntax(config.functions[syntax[i].val].ast, token.chi)) {
                        return false;
                    }
                }
                break;
            case ValidationTokenEnum.Bracket:
                if (!validateSyntax(syntax[i].chi, [token])) {
                    return false;
                }
                break;
            case ValidationTokenEnum.AmpersandToken:
                if (!validateSyntax(syntax[i].l, [token]) || !validateSyntax(syntax[i].r, [token])) {
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
function getNextToken(tokens, whiteSpace = true) {
    let item;
    let index = -1;
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

export { validateSyntax };
