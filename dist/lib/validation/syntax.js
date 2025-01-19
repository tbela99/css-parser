import { ValidationTokenEnum, specialValues } from './parser/types.js';
import './parser/parse.js';
import { ValidationLevel, EnumToken, funcLike } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import { isLength } from '../syntax/syntax.js';
import '../parser/utils/config.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import { getParsedSyntax, getSyntaxConfig } from './config.js';
import { validateSelector } from './selector.js';

const config = getSyntaxConfig();
function consumeToken(tokens) {
    tokens.shift();
}
function consumeSyntax(syntaxes) {
    syntaxes.shift();
}
function splice(tokens, matches) {
    if (matches.length == 0) {
        return tokens;
    }
    // @ts-ignore
    const index = tokens.indexOf(matches.at(-1));
    if (index > -1) {
        tokens.splice(0, index + 1);
    }
    return tokens;
}
function validateSyntax(syntaxes, tokens, root, options, context = { level: 0 }) {
    if (syntaxes == null) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0] ?? null,
            syntax: null,
            error: 'no matching syntaxes found',
            tokens
        };
    }
    let token = null;
    let syntax;
    let result = null;
    let validSyntax = false;
    let matched = false;
    const matches = [];
    tokens = tokens.slice();
    syntaxes = syntaxes.slice();
    tokens = tokens.slice();
    if (context.cache == null) {
        context.cache = new WeakMap;
    }
    if (context.tokens == null) {
        context.tokens = tokens.slice();
    }
    context = { ...context };
    main: while (tokens.length > 0) {
        if (syntaxes.length == 0) {
            break;
        }
        token = tokens[0];
        syntax = syntaxes[0];
        // @ts-ignore
        context.position = context.tokens.indexOf(token);
        const cached = context.cache.get(token)?.get(syntax.text) ?? null;
        if (cached != null) {
            if (cached.error.length > 0) {
                return { ...cached, tokens, node: cached.valid == ValidationLevel.Valid ? null : token };
            }
            syntaxes.shift();
            tokens.shift();
            continue;
        }
        if (token.typ == EnumToken.DescendantCombinatorTokenType) {
            tokens.shift();
            if (syntax.typ == ValidationTokenEnum.Whitespace) {
                syntaxes.shift();
            }
            continue;
        }
        else if (syntax.typ == ValidationTokenEnum.Whitespace) {
            syntaxes.shift();
            if (token.typ == EnumToken.WhitespaceTokenType) {
                tokens.shift();
            }
            continue;
        }
        else if (syntax.typ == ValidationTokenEnum.Block && EnumToken.AtRuleTokenType == token.typ && ('chi' in token)) {
            syntaxes.shift();
            tokens.shift();
            // @ts-ignore
            matches.push(token);
            continue;
        }
        if (syntax.isOptional) {
            if (!context.cache.has(token)) {
                context.cache.set(token, new Map);
            }
            if (context.cache.get(token).has(syntax.text)) {
                result = context.cache.get(token).get(syntax.text);
                return { ...result, tokens, node: result.valid == ValidationLevel.Valid ? null : token };
            }
            // @ts-ignore
            const { isOptional, ...c } = syntax;
            // @ts-ignore
            let result2;
            // @ts-ignore
            result2 = validateSyntax([c], tokens, root, options, context);
            if (result2.valid == ValidationLevel.Valid && result2.matches.length > 0) {
                tokens = result2.tokens;
                // splice(tokens, result2.matches);
                // tokens = result2.tokens;
                // @ts-ignore
                matches.push(...result2.matches);
                matched = true;
                result = result2;
            }
            else {
                syntaxes.shift();
                continue;
            }
            syntaxes.shift();
            if (syntaxes.length == 0) {
                return {
                    valid: ValidationLevel.Valid,
                    matches: result2.matches,
                    node: result2.node,
                    syntax: result2.syntax,
                    error: result2.error,
                    tokens
                };
            }
            continue;
        }
        if (syntax.isList) {
            let index = -1;
            // @ts-ignore
            let { isList, ...c } = syntax;
            // const c: ValidationToken = {...syntaxes, isList: false} as ValidationToken;
            let result2 = null;
            validSyntax = false;
            do {
                for (let i = index + 1; i < tokens.length; i++) {
                    if (tokens[i].typ == EnumToken.CommaTokenType) {
                        index = i;
                        break;
                    }
                }
                if (tokens[index + 1]?.typ == EnumToken.CommaTokenType) {
                    return {
                        valid: ValidationLevel.Drop,
                        matches,
                        node: tokens[0],
                        syntax,
                        error: 'unexpected token',
                        tokens
                    };
                }
                if (index == -1) {
                    index = tokens.length;
                }
                if (index == 0) {
                    break;
                }
                // @ts-ignore
                result2 = validateSyntax([c], tokens.slice(0, index), root, options, context);
                matched = result2.valid == ValidationLevel.Valid && result2.matches.length > 0;
                if (matched) {
                    const l = tokens.length;
                    validSyntax = true;
                    // @ts-ignore
                    // matches.push(...result2.matches);
                    // splice(tokens, result2.matches);
                    if (tokens.length == 1 && tokens[0].typ == EnumToken.CommaTokenType) {
                        return {
                            valid: ValidationLevel.Drop,
                            matches,
                            node: tokens[0],
                            syntax,
                            error: 'unexpected token',
                            tokens
                        };
                    }
                    tokens = tokens.slice(index);
                    result = result2;
                    // @ts-ignore
                    matches.push(...result2.matches);
                    if (result.tokens.length > 0) {
                        if (index == -1) {
                            tokens = result.tokens;
                        }
                        else {
                            tokens = tokens.slice(index - result.tokens.length);
                        }
                    }
                    else if (index > 0) {
                        tokens = tokens.slice(index);
                    }
                    index = -1;
                    if (l == tokens.length) {
                        break;
                    }
                }
                else {
                    break;
                }
            } while (tokens.length > 0);
            // if (level == 0) {
            // }
            if (!matched) {
                return {
                    valid: ValidationLevel.Drop,
                    // @ts-ignore
                    matches: [...new Set(matches)],
                    node: token,
                    syntax,
                    error: 'unexpected token',
                    tokens
                };
            }
            syntaxes.shift();
            continue;
        }
        if (syntax.isRepeatable) {
            // @ts-ignore
            let { isRepeatable, ...c } = syntax;
            let result2 = null;
            validSyntax = false;
            let l = tokens.length;
            let tok = null;
            do {
                // @ts-ignore
                result2 = validateSyntax([c], tokens, root, options, context);
                if (result2.matches.length == 0 && result2.error.length > 0) {
                    syntaxes.shift();
                    break main;
                }
                if (result2.valid == ValidationLevel.Valid) {
                    tokens = result2.tokens;
                    // @ts-ignore
                    matches.push(...result2.matches);
                    result = result2;
                    if (l == tokens.length) {
                        if (tok == tokens[0]) {
                            break;
                        }
                        if (result2.matches.length == 0 && tokens.length > 0) {
                            tokens = result2.tokens;
                            tok = tokens[0];
                            continue;
                        }
                        break;
                    }
                    if (matches.length == 0) {
                        tokens = result2.tokens;
                    }
                    l = tokens.length;
                    continue;
                }
                break;
            } while (result2.valid == ValidationLevel.Valid && tokens.length > 0);
            // if (lastResult != null) {
            //
            //     splice(tokens, lastResult.matches);
            //     // tokens = lastResult.tokens;
            // }
            syntaxes.shift();
            continue;
        }
        // at least one match
        if (syntax.isRepeatableGroup) {
            validSyntax = false;
            let count = 0;
            let l = tokens.length;
            let result2 = null;
            do {
                // @ts-ignore
                const { isRepeatableGroup, ...c } = syntax;
                // @ts-ignore
                result2 = validateSyntax([c], tokens, root, options, context);
                if (result2.valid == ValidationLevel.Drop || result2.matches.length == 0) {
                    if (count > 0) {
                        syntaxes.shift();
                        // if (result2.matches.length == 0) {
                        tokens = result2.tokens;
                        // break main;
                        if (syntaxes.length == 0) {
                            return result2;
                        }
                        break main;
                    }
                    return result2;
                }
                if (result2.valid == ValidationLevel.Valid && result2.matches.length > 0) {
                    count++;
                    // lastResult = result;
                    validSyntax = true;
                    tokens = result2.tokens;
                    // splice(tokens, result2.matches);
                    // tokens = result2.tokens;
                    // @ts-ignore
                    matches.push(...result2.matches);
                    result = result2;
                    if (l == tokens.length) {
                        break;
                    }
                    l = tokens.length;
                }
                else {
                    break;
                }
            } while (tokens.length > 0 && result.valid == ValidationLevel.Valid);
            // if (lastResult != null) {
            //
            //     splice(tokens, lastResult.matches);
            //     // tokens = lastResult.tokens;
            // }
            // at least one match is expected
            if (!validSyntax /* || result.matches.length == 0 */) {
                return {
                    valid: ValidationLevel.Drop,
                    node: token,
                    tokens,
                    syntax,
                    error: 'unexpected token',
                    matches: []
                };
            }
            syntaxes.shift();
            continue;
        }
        if (syntax.atLeastOnce) {
            const { atLeastOnce, ...c } = syntax;
            result = validateSyntax([c], tokens, root, options, context);
            if (result.valid == ValidationLevel.Drop) {
                return result;
            }
            splice(tokens, result.matches);
            // tokens = result.tokens;
            // @ts-ignore
            matches.push(...result.matches);
            let l = tokens.length;
            let r = validateSyntax([c], tokens, root, options, context);
            while (r.valid == ValidationLevel.Valid) {
                splice(tokens, r.matches);
                // tokens = r.tokens;
                r = validateSyntax([c], tokens, root, options, context);
                if (l == tokens.length) {
                    break;
                }
                if (r.valid == ValidationLevel.Valid && r.matches.length > 0) {
                    // @ts-ignore
                    matches.push(...result.matches);
                }
                l = tokens.length;
            }
            syntaxes.shift();
            continue;
        }
        // @ts-ignore
        if (syntax.occurence != null) {
            // @ts-ignore
            const { occurence, ...c } = syntax;
            // && syntaxes.occurence.max != null
            // consume all tokens
            let match = 1;
            // @ts-ignore
            result = validateSyntax([c], tokens, root, options, context);
            if (result.valid == ValidationLevel.Drop) {
                return result;
            }
            if (result.matches.length == 0) {
                syntaxes.shift();
                continue;
            }
            // splice(tokens, result.matches);
            // tokens = result.tokens;
            // @ts-ignore
            matches.push(...result.matches);
            matched = true;
            tokens = result.tokens;
            while (occurence.max == null || match < occurence.max) {
                // trim whitespace
                if (tokens[0]?.typ == EnumToken.WhitespaceTokenType) {
                    tokens.shift();
                }
                // @ts-ignore
                let r = validateSyntax([c], tokens, root, options, context);
                if (r.valid != ValidationLevel.Valid || r.matches.length == 0) {
                    break;
                }
                result = r;
                // splice(tokens, r.matches);
                // tokens = r.tokens;
                // @ts-ignore
                matches.push(...result.matches);
                match++;
                tokens = r.tokens;
                result = r;
                if (tokens.length == 0 || (occurence.max != null && match >= occurence.max)) {
                    break;
                }
                // @ts-ignore
                // r = validateSyntax([c], tokens, root, options, context);
            }
            syntaxes.shift();
            continue;
        }
        // @ts-ignore
        if (syntax.typ == ValidationTokenEnum.Whitespace) {
            if (token.typ == EnumToken.WhitespaceTokenType) {
                tokens.shift();
            }
            syntaxes.shift();
            continue;
        }
        // @ts-ignore
        if (token.val != null && specialValues.includes(token.val)) {
            matched = true;
            result = {
                valid: ValidationLevel.Valid,
                matches: [token],
                node: null,
                syntax,
                error: '',
                tokens
            };
            // @ts-ignore
            matches.push(...result.matches);
        }
        else {
            result = doValidateSyntax(syntax, token, tokens, root, options, context);
            matched = result.valid == ValidationLevel.Valid && result.matches.length > 0;
            if (matched) {
                // splice(tokens, result.matches);
                tokens = result.tokens;
                // @ts-ignore
                matches.push(...result.matches);
            }
        }
        if (result.valid == ValidationLevel.Drop) {
            // @ts-ignore
            return { ...result, matches, tokens, node: result.valid == ValidationLevel.Valid ? null : token };
        }
        consumeSyntax(syntaxes);
        if (tokens.length == 0) {
            return result;
        }
    }
    if (result?.valid == ValidationLevel.Valid) {
        // splice(tokens, result.matches);
        tokens = result.tokens;
        // @ts-ignore
        matches.push(...result.matches);
    }
    if ( /* result == null && */tokens.length == 0 && syntaxes.length > 0) {
        validSyntax = isOptionalSyntax(syntaxes);
    }
    if (result == null) {
        result = {
            valid: validSyntax ? ValidationLevel.Valid : ValidationLevel.Drop,
            matches,
            node: validSyntax ? null : tokens[0] ?? null,
            // @ts-ignore
            syntax,
            error: validSyntax ? '' : 'unexpected token',
            tokens
        };
    }
    if (token != null) {
        if (!context.cache.has(token)) {
            context.cache.set(token, new Map);
        }
        context.cache.get(token).set(syntax.text, result);
    }
    if (result != null) {
        // @ts-ignore
        return { ...result, matches: [...(new Set(matches))] };
    }
    return result;
}
function isOptionalSyntax(syntaxes) {
    return syntaxes.every(t => t.typ == ValidationTokenEnum.Whitespace || t.isOptional || t.isRepeatable || (t.typ == ValidationTokenEnum.PropertyType && isOptionalSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, t.val) ?? getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, t.val))));
}
function doValidateSyntax(syntax, token, tokens, root, options, context) {
    let valid = false;
    let result;
    let children;
    let queue;
    let matches;
    let child;
    let astNodes = new Set;
    if (token.typ == EnumToken.NestingSelectorTokenType && syntax.typ == 2) {
        valid = root != null && 'relative-selector' == syntax.val;
        return {
            valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
            matches: valid ? [token] : [],
            node: valid ? null : token,
            syntax,
            error: valid ? '' : 'unexpected token',
            tokens
        };
    }
    switch (syntax.typ) {
        case ValidationTokenEnum.Comma:
            valid = token.typ === EnumToken.CommaTokenType;
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            };
            break;
        case ValidationTokenEnum.AtRule:
            if (token.typ != EnumToken.AtRuleNodeType) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'expecting at-rule',
                    tokens
                };
            }
            if (token.nam != syntax.val) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: `expecting '@${syntax.val}' but found '@${token.nam}'`,
                    tokens
                };
            }
            if (root == null) {
                return {
                    valid: ValidationLevel.Valid,
                    matches: [token],
                    node: null,
                    syntax,
                    error: '',
                    tokens
                };
            }
            if (root.typ != EnumToken.AtRuleNodeType) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'not allowed here',
                    tokens
                };
            }
            if (!('chi' in token)) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: '@at-rule must have children',
                    tokens
                };
            }
            result = {
                valid: ValidationLevel.Valid,
                matches: [token],
                node: null,
                syntax,
                error: '',
                tokens
            };
            break;
        case ValidationTokenEnum.AtRuleDefinition:
            if (token.typ != EnumToken.AtRuleNodeType) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'expecting at-rule',
                    tokens
                };
            }
            if ('chi' in syntax && !('chi' in token)) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: '@at-rule must have children',
                    tokens
                };
            }
            if ('chi' in token && !('chi' in token)) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'children not allowed here',
                    tokens
                };
            }
            const s = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, '@' + token.nam);
            if ('prelude' in syntax) {
                if (!('tokens' in token)) {
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'expected at-rule prelude',
                        tokens
                    };
                }
                result = validateSyntax(s[0].prelude, token.tokens, root, options, {
                    ...context,
                    tokens: null,
                    level: context.level + 1
                });
                if (result.valid == ValidationLevel.Drop) {
                    return result;
                }
            }
            const hasBody = 'chi' in s[0];
            if ('chi' in token) {
                if (!hasBody) {
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'unexpected at-rule body',
                        tokens
                    };
                }
            }
            else if (hasBody) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'expecting at-rule body',
                    tokens
                };
            }
            break;
        case ValidationTokenEnum.DeclarationType:
            // @ts-ignore
            result = validateSyntax(getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, syntax.val), [token], root, options, context);
            break;
        case ValidationTokenEnum.Keyword:
            valid = (token.typ == EnumToken.IdenTokenType && token.val.localeCompare(syntax.val, 'en', { sensitivity: 'base' }) == 0) ||
                (token.typ == EnumToken.ColorTokenType && token.kin == 'lit' && syntax.val.localeCompare(token.val, 'en', { sensitivity: 'base' }) == 0);
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            };
            break;
        case ValidationTokenEnum.SemiColon:
            valid = root == null || [EnumToken.RuleNodeType, EnumToken.AtRuleNodeType, EnumToken.StyleSheetNodeType].includes(root.typ);
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            };
            break;
        case ValidationTokenEnum.Separator:
            valid = token.typ == EnumToken.LiteralTokenType && token.val != '/';
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            };
            break;
        case ValidationTokenEnum.PropertyType:
            //
            if (['media-feature', 'mf-plain'].includes(syntax.val)) {
                valid = token.typ == EnumToken.DeclarationNodeType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if (syntax.val == 'pseudo-page') {
                valid = token.typ == EnumToken.PseudoClassTokenType && [':left', ':right', ':first', ':blank'].includes(token.val);
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if (syntax.val == 'page-body') {
                if (token.typ == EnumToken.DeclarationNodeType) {
                    valid = true;
                    result = {
                        valid: ValidationLevel.Valid,
                        matches: [token],
                        node: null,
                        syntax,
                        error: '',
                        tokens
                    };
                    while (tokens.length > 0 && [EnumToken.DeclarationNodeType].includes(tokens[0].typ)) {
                        // @ts-ignore
                        result.matches.push(tokens.shift());
                    }
                }
                else if (token.typ == EnumToken.AtRuleNodeType) {
                    result = validateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, 'page-margin-box-type'), [token], root, options, context);
                }
            }
            else if (syntax.val == 'group-rule-body') {
                valid = [EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(token.typ);
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'token is not allowed as a child',
                    tokens
                };
                if (!valid) {
                    return result;
                }
            }
            //
            else if ('type-selector' == syntax.val) {
                valid = (token.typ == EnumToken.UniversalSelectorTokenType) ||
                    token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.NameSpaceAttributeTokenType &&
                    (token.l == null || token.l.typ == EnumToken.IdenTokenType ||
                        (token.l.typ == EnumToken.LiteralTokenType && token.l.val == '*')) &&
                    token.r.typ == EnumToken.IdenTokenType);
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('wq-name' == syntax.val) {
                valid = token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.NameSpaceAttributeTokenType &&
                    (token.l == null || token.l.typ == EnumToken.IdenTokenType || (token.l.typ == EnumToken.LiteralTokenType && token.l.val == '*')) &&
                    token.r.typ == EnumToken.IdenTokenType);
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if (EnumToken.UniversalSelectorTokenType == token.typ && 'subclass-selector' == syntax.val) {
                valid = true;
                result = {
                    valid: ValidationLevel.Valid,
                    matches: [token],
                    node: null,
                    syntax,
                    error: '',
                    tokens
                };
            }
            else if ('attribute-selector' == syntax.val) {
                valid = token.typ == EnumToken.AttrTokenType && token.chi.length > 0;
                if (valid) {
                    const children = token.chi.filter(t => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommaTokenType);
                    valid = children.length == 1 && [
                        EnumToken.IdenTokenType,
                        EnumToken.NameSpaceAttributeTokenType,
                        EnumToken.MatchExpressionTokenType
                    ].includes(children[0].typ);
                    if (valid && children[0].typ == EnumToken.MatchExpressionTokenType) {
                        const t = children[0];
                        valid = [
                            EnumToken.IdenTokenType,
                            EnumToken.NameSpaceAttributeTokenType
                        ].includes(t.l.typ) &&
                            (t.op == null || ([
                                EnumToken.DelimTokenType, EnumToken.DashMatchTokenType,
                                EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType,
                                EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType
                            ].includes(t.op.typ) &&
                                t.r != null &&
                                [
                                    EnumToken.StringTokenType,
                                    EnumToken.IdenTokenType
                                ].includes(t.r.typ)));
                        if (valid && t.attr != null) {
                            const s = getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, 'attr-modifier')[0];
                            valid = s.chi.some((l) => l.some((r) => r.val == t.attr));
                        }
                    }
                }
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
                if (!valid) {
                    return result;
                }
            }
            else if ('combinator' == syntax.val) {
                valid = [
                    EnumToken.DescendantCombinatorTokenType,
                    EnumToken.SubsequentSiblingCombinatorTokenType,
                    EnumToken.NextSiblingCombinatorTokenType,
                    EnumToken.ChildCombinatorTokenType,
                    EnumToken.ColumnCombinatorTokenType
                ].includes(token.typ);
                if (valid) {
                    // @ts-ignore
                    const position = context.tokens.indexOf(token);
                    if (root == null) {
                        valid = position > 0 && context.tokens[position - 1]?.typ != EnumToken.CommaTokenType;
                    }
                }
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
                if (!valid) {
                    return result;
                }
            }
            else if ('ident-token' == syntax.val) {
                valid = token.typ == EnumToken.IdenTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('hex-color' == syntax.val) {
                valid = token.typ == EnumToken.ColorTokenType && token.kin == 'hex';
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('resolution' == syntax.val) {
                valid = token.typ == EnumToken.ResolutionTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('angle' == syntax.val) {
                valid = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('time' == syntax.val) {
                valid = token.typ == EnumToken.TimingFunctionTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('ident' == syntax.val) {
                valid = token.typ == EnumToken.IdenTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if (['id-selector', 'hash-token'].includes(syntax.val)) {
                valid = token.typ == EnumToken.HashTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if (['integer', 'number'].includes(syntax.val)) {
                // valid = token.typ == EnumToken.NumberTokenType;
                valid = token.typ == EnumToken.NumberTokenType && ('integer' != syntax.val || Number.isInteger(+token.val));
                if (valid && 'range' in syntax) {
                    const value = Number(token.val);
                    const range = syntax.range;
                    valid = value >= range[0] && (range[1] == null || value <= range[1]);
                }
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('length' == syntax.val) {
                valid = isLength(token) || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('percentage' == syntax.val) {
                valid = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('dashed-ident' == syntax.val) {
                valid = token.typ == EnumToken.DashedIdenTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('custom-ident' == syntax.val) {
                valid = token.typ == EnumToken.DashedIdenTokenType || token.typ == EnumToken.IdenTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('custom-property-name' == syntax.val) {
                valid = token.typ == EnumToken.DashedIdenTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('string' == syntax.val) {
                valid = token.typ == EnumToken.StringTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('declaration-value' == syntax.val) {
                valid = token.typ != EnumToken.LiteralTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('url' == syntax.val) {
                valid = token.typ == EnumToken.UrlFunctionTokenType || token.typ == EnumToken.StringTokenType;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('declaration' == syntax.val) {
                valid = token.typ == EnumToken.DeclarationNodeType && (token.nam.startsWith(('--')) || token.nam in config.declarations || token.nam in config.syntaxes);
                if (!valid) {
                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'unexpected token',
                        tokens
                    };
                }
                else if (token.nam.startsWith(('--'))) {
                    result = {
                        valid: ValidationLevel.Valid,
                        matches: [token],
                        node: null,
                        syntax,
                        error: '',
                        tokens
                    };
                }
                else {
                    result = validateSyntax(getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, token.nam) ?? getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, token.nam), token.val, token, options, {
                        ...context,
                        tokens: null,
                        level: 0
                    });
                    if (result.valid == ValidationLevel.Valid && result.error.length == 0) {
                        tokens = result.tokens;
                    }
                }
            }
            else if ('class-selector' == syntax.val) {
                valid = EnumToken.ClassSelectorTokenType == token.typ || EnumToken.UniversalSelectorTokenType == token.typ;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            // else if ('complex-selector' == (syntaxes as ValidationPropertyToken).val) {
            //
            //     result = validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntaxes as ValidationPropertyToken).val) as ValidationToken[], tokens, root as AstNode, options, context);
            //
            // }
            else if (['pseudo-element-selector', 'pseudo-class-selector'].includes(syntax.val)) {
                valid = false;
                if (token.typ == EnumToken.PseudoClassTokenType) {
                    let val = token.val;
                    if (val == ':before' || val == ':after') {
                        val = ':' + val;
                    }
                    valid = val in config.selectors;
                    if (!valid && val.match(/^:?:-/) != null) {
                        const match = token.val.match(/^(:?:)(-[^-]+-)(.*)$/);
                        if (match != null) {
                            valid = true;
                        }
                    }
                    result = {
                        valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                        matches: valid ? [token] : [],
                        node: valid ? null : token,
                        syntax,
                        error: valid ? '' : 'invalid pseudo class',
                        tokens
                    };
                }
                else if (token.typ == EnumToken.PseudoClassFuncTokenType) {
                    let key = token.val in config.selectors ? token.val : token.val + '()';
                    valid = key in config.selectors;
                    if (!valid && token.val.match(/^:?:-/)) {
                        const match = token.val.match(/^(:?:)(-[^-]+-)(.*)$/);
                        if (match != null) {
                            key = match[1] + match[3] in config.selectors ? match[1] + match[3] : match[1] + match[3] + '()';
                            valid = key in config.selectors;
                        }
                    }
                    const s = getParsedSyntax("selectors" /* ValidationSyntaxGroupEnum.Selectors */, key);
                    if (s != null) {
                        const r = s[0];
                        if (r.typ != ValidationTokenEnum.PseudoClassFunctionToken) {
                            valid = false;
                        }
                        else {
                            result = validateSyntax(s[0].chi, token.chi, root, options, {
                                ...context,
                                tokens: null,
                                level: context.level + 1
                            });
                            break;
                        }
                    }
                }
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            // <relative-selector-list>
            // <complex-selector-list>
            else if ('relative-selector' == syntax.val) {
                if (tokens.length == 1 && token.typ == EnumToken.NestingSelectorTokenType) {
                    return {
                        valid: ValidationLevel.Valid,
                        matches: [token],
                        node: token,
                        syntax,
                        error: '',
                        tokens
                    };
                }
                result = validateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val), token.typ == EnumToken.NestingSelectorTokenType ? tokens.slice(1) : tokens, root, options, context);
            }
            // <relative-selector-list>
            // <complex-selector-list>
            else if (['forgiving-selector-list', 'forgiving-relative-selector-list'].includes(syntax.val)) {
                result = { tokens: tokens.slice(), ...validateSelector(tokens, options, root) };
            }
            // https://github.com/mdn/data/pull/186#issuecomment-369604537
            else if (syntax.val.endsWith('-token')) {
                const val = syntax.val;
                valid = true;
                switch (val) {
                    case 'function-token':
                        valid = token.typ != EnumToken.ParensTokenType && funcLike.includes(token.typ);
                        break;
                    case 'ident-token':
                        valid = token.typ == EnumToken.DashedIdenTokenType || token.typ == EnumToken.IdenTokenType;
                        break;
                    case 'hash-token':
                        valid = token.typ == EnumToken.HashTokenType;
                        break;
                    case 'string-token':
                        valid = token.typ == EnumToken.StringTokenType;
                        break;
                    default:
                        console.error(new Error(`unhandled syntax: '<${val}>'`));
                        break;
                }
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else if ('wq-name' == syntax.val) {
                valid = token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.NameSpaceAttributeTokenType &&
                    (token.l == null || token.l.typ == EnumToken.IdenTokenType || (token.l.typ == EnumToken.LiteralTokenType && token.l.val == '*')) &&
                    token.r.typ == EnumToken.IdenTokenType);
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                };
            }
            else {
                const val = syntax.val;
                // https://github.com/mdn/data/pull/186#issuecomment-369604537
                if (val == 'any-value') {
                    return {
                        valid: ValidationLevel.Valid,
                        matches: [token],
                        node: null,
                        syntax,
                        error: '',
                        tokens
                    };
                }
                else if (val in config.declarations || val in config.syntaxes) {
                    result = validateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, val) ?? getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, val), tokens, root, options, context);
                }
                else {
                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'unexpected token',
                        tokens
                    };
                }
            }
            break;
        case ValidationTokenEnum.Parens:
        case ValidationTokenEnum.Function:
            if (syntax.typ == ValidationTokenEnum.Parens) {
                valid = token.typ == EnumToken.ParensTokenType;
            }
            else {
                valid = 'chi' in token && 'val' in token &&
                    token.val.localeCompare(syntax.val, 'en', { sensitivity: 'base' }) == 0;
            }
            result = !valid ?
                {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'unexpected token',
                    tokens
                } : validateSyntax(syntax.chi, token.chi, root, options, {
                ...context,
                tokens: null,
                level: context.level + 1
            });
            break;
        case ValidationTokenEnum.ValidationFunctionDefinition:
            valid = 'val' in token && 'chi' in token;
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: '',
                tokens
            };
            if (result.valid == ValidationLevel.Valid) {
                valid = token.val.localeCompare(syntax.val, 'en', { sensitivity: 'base' }) == 0;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] : [],
                    node: valid ? null : token,
                    error: '',
                    syntax,
                    tokens
                };
                if (result.valid == ValidationLevel.Valid) {
                    const s = getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val + '()'); // config[ValidationSyntaxGroupEnum.Syntaxes][(syntaxes as ValidationFunctionDefinitionToken).val + '()'] as ValidationSyntaxNode;
                    result = validateSyntax(s, tokens, root, options, context);
                }
            }
            break;
        case ValidationTokenEnum.Bracket:
            result = validateSyntax(syntax.chi, tokens, root, options, context);
            break;
        case ValidationTokenEnum.PipeToken:
            for (const lines of syntax.chi) {
                result = validateSyntax(lines, tokens, root, options, context);
                if (result.valid == ValidationLevel.Valid) {
                    break;
                }
            }
            break;
        case ValidationTokenEnum.AmpersandToken:
            children = [...syntax.l.slice(), ...syntax.r.slice()];
            matches = [];
            queue = [];
            let m = [];
            for (let j = 0; j < children.length; j++) {
                const res = validateSyntax([children[j]], tokens, root, options, context);
                // @ts-ignore
                if (res.valid == ValidationLevel.Valid) {
                    m.push(...res.matches);
                    matches.push(...children.splice(j, 1));
                    j = 0;
                    // @ts-ignore
                    astNodes.delete(token);
                    consumeToken(tokens);
                    token = tokens[0];
                    if (token == null) {
                        break;
                    }
                    // @ts-ignore
                    astNodes.add(token);
                }
            }
            if (astNodes.size > 0) {
                // @ts-ignore
                tokens.unshift(...astNodes);
                astNodes = new Set();
            }
            valid = matches.length > 0;
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: m,
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'expecting token',
                tokens
            };
            break;
        case ValidationTokenEnum.ColumnToken:
            children = [...syntax.l.slice(), ...syntax.r.slice()];
            matches = [];
            queue = [];
            while ((child = children.shift())) {
                const res = validateSyntax([child], tokens, root, options, context);
                if (res.valid == ValidationLevel.Valid) {
                    matches.push(child);
                    consumeToken(tokens);
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
            valid = matches.length > 0;
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'expecting token',
                tokens
            };
            break;
        case ValidationTokenEnum.StringToken:
            valid = token.typ == EnumToken.StringTokenType && syntax.val.slice(1, -1) == token.val.slice(1, -1);
            return {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'expecting token',
                tokens
            };
        case ValidationTokenEnum.PseudoClassFunctionToken:
            valid = token.typ == EnumToken.PseudoClassFuncTokenType;
            if (valid) {
                let key = token.val in config.selectors ? token.val : token.val + '()';
                const s = getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, key);
                valid = s != null && validateSyntax(s, token.chi, root, options, {
                    ...context,
                    tokens: null,
                    level: context.level + 1
                }).valid == ValidationLevel.Valid;
            }
            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'invalid token',
                tokens
            };
            break;
        default:
            throw new Error('not implemented: ' + JSON.stringify({ syntax, token, tokens }, null, 1));
    }
    // @ts-ignore
    return result;
}

export { validateSyntax };
