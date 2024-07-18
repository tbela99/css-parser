import { ValidationTokenEnum, specialValues } from './parser/types.js';
import './parser/parse.js';
import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../parser/parse.js';
import { isLength } from '../parser/utils/syntax.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import { getConfig } from './config.js';

const config = getConfig();
function validateSyntax(syntaxes, tokens, errors, parents) {
    let token;
    let syntax;
    let result;
    let children;
    let queue;
    let matches;
    let child;
    let astNodes = new Set;
    // console.error('> ' + syntaxes.reduce((acc, curr) => acc + render(curr), ''));
    while (tokens.length > 0) {
        token = tokens[0];
        if (syntaxes.length == 0) {
            return true;
        }
        syntax = syntaxes[0];
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
        if (token.val != null && specialValues.includes(token.val)) {
            result = true;
        }
        else {
            switch (syntax.typ) {
                case ValidationTokenEnum.Comma:
                    result = token.typ === EnumToken.CommaTokenType;
                    break;
                case ValidationTokenEnum.DeclarationType:
                    result = validateSyntax(config.declarations[syntax.val].ast.slice(), tokens, errors, (parents ?? []).concat(syntax));
                    break;
                case ValidationTokenEnum.Keyword:
                    result = (token.typ == EnumToken.IdenTokenType && token.val.localeCompare(syntax.val, 'en', { sensitivity: 'base' }) == 0) ||
                        (token.typ == EnumToken.ColorTokenType && token.kin == 'lit' && syntax.val.localeCompare(token.val, 'en', { sensitivity: 'base' }) == 0);
                    break;
                case ValidationTokenEnum.Separator:
                    result = token.typ == EnumToken.LiteralTokenType && token.val != '/';
                    break;
                case ValidationTokenEnum.PropertyType:
                    if ('hex-color' == syntax.val) {
                        result = token.typ == EnumToken.ColorTokenType && token.kin == 'hex';
                    }
                    else if ('resolution' == syntax.val) {
                        result = token.typ == EnumToken.ResolutionTokenType;
                    }
                    else if ('angle' == syntax.val) {
                        result = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                    }
                    else if ('time' == syntax.val) {
                        result = token.typ == EnumToken.TimingFunctionTokenType;
                    }
                    else if ('ident' == syntax.val) {
                        result = token.typ == EnumToken.IdenTokenType;
                    }
                    else if ('hash-token' == syntax.val) {
                        result = token.typ == EnumToken.HashTokenType;
                    }
                    else if (['integer', 'number'].includes(syntax.val)) {
                        result = token.typ == EnumToken.NumberTokenType;
                        result = token.typ == EnumToken.NumberTokenType && ('integer' != syntax.val || Number.isInteger(+token.val));
                        if (result && 'range' in syntax) {
                            const value = Number(token.val);
                            const range = syntax.range;
                            result = value >= range[0] && (range[1] == null || value <= range[1]);
                        }
                    }
                    else if ('length' == syntax.val) {
                        result = isLength(token) || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                    }
                    else if ('percentage' == syntax.val) {
                        result = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                    }
                    else if ('dashed-ident' == syntax.val) {
                        result = token.typ == EnumToken.DashedIdenTokenType;
                    }
                    else if ('custom-ident' == syntax.val) {
                        result = token.typ == EnumToken.DashedIdenTokenType || token.typ == EnumToken.IdenTokenType;
                    }
                    else if ('custom-property-name' == syntax.val) {
                        result = token.typ == EnumToken.DashedIdenTokenType;
                    }
                    else if ('string' == syntax.val) {
                        result = token.typ == EnumToken.StringTokenType;
                    }
                    else if ('declaration-value' == syntax.val) {
                        result = token.typ != EnumToken.LiteralTokenType;
                    }
                    else if ('url' == syntax.val) {
                        result = token.typ == EnumToken.UrlFunctionTokenType || token.typ == EnumToken.StringTokenType;
                    }
                    else {
                        const val = syntax.val;
                        if (val in config.declarations || val in config.syntaxes) {
                            result = validateSyntax((config.syntaxes[val] ?? config.declarations[val]).ast.slice(), tokens, errors, (parents ?? []).concat(syntax));
                        }
                        else {
                            result = false;
                        }
                    }
                    break;
                case ValidationTokenEnum.Parens:
                case ValidationTokenEnum.Function:
                    if (syntax.typ == ValidationTokenEnum.Parens) {
                        result = token.typ == EnumToken.ParensTokenType;
                    }
                    else {
                        result = 'chi' in token && 'val' in token &&
                            token.val.localeCompare(syntax.val, 'en', { sensitivity: 'base' }) == 0;
                    }
                    if (result) {
                        result = validateSyntax(syntax.chi.slice(), token.chi.slice(), errors, parents);
                    }
                    break;
                case ValidationTokenEnum.ValidationFunctionDefinition:
                    result = 'val' in token && 'chi' in token;
                    if (result) {
                        result = token.val.localeCompare(syntax.val, 'en', { sensitivity: 'base' }) == 0;
                        if (result) {
                            const s = config.syntaxes[syntax.val + '()'];
                            result = validateSyntax(s.ast.slice(), [token], errors, parents);
                        }
                    }
                    break;
                case ValidationTokenEnum.Bracket:
                    result = validateSyntax(syntax.chi.slice(), tokens, errors, (parents ?? []).concat(syntax));
                    break;
                case ValidationTokenEnum.PipeToken:
                    result = validateSyntax(syntax.l.slice(), [token], errors, (parents ?? []).concat(syntax)) ||
                        validateSyntax(syntax.r.slice(), tokens.slice(), errors, (parents ?? []).concat(syntax));
                    break;
                case ValidationTokenEnum.AmpersandToken:
                    children = [...syntax.l.slice(), ...syntax.r.slice()];
                    matches = [];
                    queue = [];
                    for (let j = 0; j < children.length; j++) {
                        if (validateSyntax([children[j]], [token], errors, (parents ?? []).concat(syntax))) {
                            matches.push(...children.splice(j, 1));
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
                    children = [...syntax.l.slice(), ...syntax.r.slice()];
                    matches = [];
                    queue = [];
                    while ((child = children.shift())) {
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
                        }
                        else {
                            queue.push(child);
                        }
                    }
                    result = matches.length > 0;
                    break;
                default:
                    // result = doValidateSyntax(syntax, token, tokens.slice(), errors, parents);
                    console.error({ syntax, token });
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
                }
                else if (syntaxes[0]?.typ == ValidationTokenEnum.Comma) {
                    syntaxes.shift();
                }
                continue;
            }
            return false;
        }
        if (syntax.isList || syntax.atLeastOnce) {
            const s = { ...syntax, isList: false, atLeastOnce: false };
            while (tokens.length > 0) {
                token = tokens[0];
                if ((!syntax.atLeastOnce && token.typ != EnumToken.CommaTokenType &&
                    !validateSyntax([s], tokens.slice(), errors))) {
                    break;
                }
                tokens.shift();
            }
        }
        // @ts-ignore
        if (syntax.occurence != null && syntax.occurence.max != null) {
            // consume all tokens
            let match = 1;
            // @ts-ignore
            const s = { ...syntax, isList: false, occurence: null };
            // @ts-ignore
            while (match < syntax.occurence.max) {
                token = tokens[0];
                if (token == null ||
                    !validateSyntax([s], tokens, errors)) {
                    break;
                }
                tokens.shift();
            }
        }
        syntaxes.shift();
    }
    return true;
}

export { validateSyntax };
