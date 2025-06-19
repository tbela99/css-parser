import { ValidationTokenEnum } from './parser/types.js';
import { renderSyntax } from './parser/parse.js';
import { EnumToken, ValidationLevel, funcLike } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../parser/tokenize.js';
import '../parser/utils/config.js';
import { mathFuncs } from '../syntax/syntax.js';
import { renderToken } from '../renderer/render.js';
import { systemColors, deprecatedSystemColors, ColorKind } from '../renderer/color/utils/constants.js';
import { getSyntaxConfig, getParsedSyntax, getSyntax } from './config.js';
import './syntaxes/complex-selector.js';

const config = getSyntaxConfig();
// @ts-ignore
const allValues = getSyntaxConfig()["declarations" /* ValidationSyntaxGroupEnum.Declarations */].all.syntax.trim().split(/[\s|]+/g);
function createContext(input) {
    const values = input.slice();
    const result = [];
    if (values.length > 1) {
        // if context contains 'var()' then match it last
        const vars = [];
        let i = 0;
        for (; i < values.length; i++) {
            if (values[i].typ == EnumToken.FunctionTokenType && ['var', 'calc'].includes(values[i].val)) {
                vars.push(values[i]);
                values.splice(i, 1);
                if (values[i]?.typ == EnumToken.WhitespaceTokenType) {
                    vars.push(values[i]);
                    values.splice(i, 1);
                }
                i--;
                continue;
            }
            if (values[i].typ == EnumToken.CommaTokenType) {
                if (vars.length > 0) {
                    result.push(...vars.reverse());
                    vars.length = 0;
                }
            }
            result.push(values[i]);
        }
        if (vars.length > 0) {
            result.push(...vars.reverse());
        }
    }
    else {
        result.push(...values);
    }
    return {
        index: -1,
        peek() {
            let index = this.index + 1;
            if (index >= result.length) {
                return null;
            }
            if (result[index]?.typ == EnumToken.WhitespaceTokenType) {
                index++;
            }
            return result[index] ?? null;
        },
        done() {
            return this.index + 1 >= result.length;
        },
        current() {
            return result[this.index] ?? null;
        },
        next() {
            let index = this.index + 1;
            if (index >= result.length) {
                return null;
            }
            if (result[index]?.typ == EnumToken.WhitespaceTokenType) {
                index++;
            }
            this.index = index;
            return result[this.index] ?? null;
        },
        tokens() {
            return result;
        },
        clone() {
            const context = createContext(input.slice());
            context.index = this.index;
            return context;
        }
    };
}
function evaluateSyntax(node, options) {
    let ast;
    let result;
    switch (node.typ) {
        case EnumToken.DeclarationNodeType:
            if (node.nam.startsWith('--')) {
                break;
            }
            ast = getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, node.nam);
            if (ast != null) {
                let token = null;
                const values = node.val.slice();
                while (values.length > 0) {
                    token = values.at(-1);
                    if (token.typ == EnumToken.WhitespaceTokenType || token.typ == EnumToken.CommentTokenType) {
                        values.pop();
                    }
                    else {
                        if (token.typ == EnumToken.ImportantTokenType) {
                            values.pop();
                            if (values.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                                values.pop();
                            }
                        }
                        break;
                    }
                }
                result = doEvaluateSyntax(ast, createContext(values), { ...options, visited: new WeakMap() });
                if (result.valid == ValidationLevel.Valid && !result.context.done()) {
                    let token = null;
                    while ((token = result.context.next()) != null) {
                        if (token.typ == EnumToken.WhitespaceTokenType || token.typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        return {
                            ...result,
                            valid: ValidationLevel.Drop,
                            node: token,
                            syntax: getSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, node.nam),
                            error: `unexpected token: '${renderToken(token)}'`,
                        };
                    }
                }
                return {
                    ...result,
                    syntax: getSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, node.nam)
                };
            }
            break;
        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyframeAtRuleNodeType:
        case EnumToken.KeyFrameRuleNodeType:
        default:
            throw new Error(`Not implemented: ${node.typ}`);
    }
    return {
        valid: ValidationLevel.Valid,
        node,
        syntax: null,
        error: ''
    };
}
function clearVisited(token, syntax, key, options) {
    options.visited.get(token)?.get?.(key)?.delete(syntax);
}
function isVisited(token, syntax, key, options) {
    if (options.visited.get(token)?.get?.(key)?.has(syntax)) {
        return true;
    }
    if (!options.visited.has(token)) {
        options.visited.set(token, new Map());
    }
    if (!options.visited.get(token).has(key)) {
        options.visited.get(token).set(key, new Set());
    }
    options.visited.get(token).get(key).add(syntax);
    return false;
}
// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units/Value_definition_syntax
function doEvaluateSyntax(syntaxes, context, options) {
    let syntax;
    let i = 0;
    let result;
    let token = null;
    for (; i < syntaxes.length; i++) {
        syntax = syntaxes[i];
        if (context.done()) {
            if (syntax.typ == ValidationTokenEnum.Whitespace || syntax.isOptional || syntax.isRepeatable) {
                continue;
            }
            break;
        }
        token = context.peek();
        if (syntax.typ == ValidationTokenEnum.Whitespace) {
            if (context.peek()?.typ == EnumToken.WhitespaceTokenType) {
                context.next();
            }
            continue;
        }
        else if (options.isList !== false && syntax.isList) {
            result = matchList(syntax, context, options);
        }
        else if (options.isRepeatable !== false && syntax.isRepeatable) {
            result = matchRepeatable(syntax, context, options);
        }
        else if (options.occurence !== false && syntax.occurence != null) {
            result = matchOccurence(syntax, context, options);
        }
        else if (options.atLeastOnce !== false && syntax.atLeastOnce) {
            result = matchAtLeastOnce(syntax, context, options);
        }
        else {
            if (isVisited(token, syntax, 'doEvaluateSyntax', options)) {
                return {
                    valid: ValidationLevel.Drop,
                    node: token,
                    syntax,
                    error: `cyclic dependency: ${renderSyntax(syntax)}`,
                    context
                };
            }
            result = match(syntax, context, options);
            if (result.valid == ValidationLevel.Valid) {
                clearVisited(token, syntax, 'doEvaluateSyntax', options);
            }
        }
        if (result.valid == ValidationLevel.Drop) {
            if (syntax.isOptional) {
                continue;
            }
            return result;
        }
        context = result.context;
    }
    return {
        valid: ValidationLevel.Valid,
        node: null,
        syntax: syntaxes[i - 1],
        error: '',
        context
    };
}
function matchAtLeastOnce(syntax, context, options) {
    // const {atLeastOnce, ...s} = syntax;
    let success = false;
    let result;
    while (!context.done()) {
        result = match(syntax, context.clone(), { ...options, atLeastOnce: false });
        if (result.valid == ValidationLevel.Valid) {
            success = true;
            context = result.context;
            continue;
        }
        break;
    }
    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax,
        error: success ? '' : `could not match atLeastOnce: ${renderSyntax(syntax)}`,
        context
    };
}
function matchRepeatable(syntax, context, options) {
    // const {isRepeatable, ...s} = syntax;
    let result;
    while (!context.done()) {
        result = match(syntax, context.clone(), { ...options, isRepeatable: false });
        if (result.valid == ValidationLevel.Valid) {
            context = result.context;
            continue;
        }
        break;
    }
    return {
        valid: ValidationLevel.Valid,
        node: null,
        syntax,
        error: '',
        context
    };
}
function matchList(syntax, context, options) {
    // syntax.occurence
    // const {isList, occurence, ...s} = syntax;
    let success = false;
    let result;
    let count = 0;
    let con = context.clone();
    let tokens = [];
    while (!con.done()) {
        while (!con.done() && con.peek()?.typ != EnumToken.CommaTokenType) {
            tokens.push(con.next());
        }
        if (tokens.length == 0) {
            return {
                valid: ValidationLevel.Drop,
                node: context.peek(),
                syntax,
                error: `could not match list: ${renderSyntax(syntax)}`,
                context
            };
        }
        result = doEvaluateSyntax([syntax], createContext(tokens), {
            ...options,
            isList: false,
            occurence: false
        });
        if (result.valid == ValidationLevel.Valid) {
            context = con.clone();
            count++;
            // pop comma
            if (con.done() || con.peek()?.typ != EnumToken.CommaTokenType) {
                break;
            }
            con.next();
            tokens.length = 0;
        }
        else {
            break;
        }
    }
    success = count > 0;
    if (count && syntax.occurence != null) {
        success = count >= syntax.occurence.min;
        if (success && syntax.occurence.max != null) {
            success = count <= syntax.occurence.max;
        }
    }
    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax,
        error: '',
        context
    };
}
function matchOccurence(syntax, context, options) {
    let counter = 0;
    let result;
    // const {occurence, ...s} = syntax;
    do {
        result = match(syntax, context.clone(), { ...options, occurence: false });
        if (result.valid == ValidationLevel.Drop) {
            break;
        }
        counter++;
        context = result.context;
    } while (result.valid == ValidationLevel.Valid && !context.done());
    let sucesss = counter >= syntax.occurence.min;
    if (sucesss && syntax.occurence.max != null) {
        if (Number.isFinite(syntax.occurence.max)) {
            sucesss = sucesss && counter <= syntax.occurence.max;
        }
    }
    return {
        valid: sucesss ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax,
        error: sucesss ? '' : `expected ${renderSyntax(syntax)} ${syntax.occurence.min} to ${syntax.occurence.max} occurences, got ${counter}`,
        context
    };
}
function match(syntax, context, options) {
    let success = false;
    let result;
    let token = context.peek();
    switch (syntax.typ) {
        case ValidationTokenEnum.PipeToken:
            return someOf(syntax.chi, context, options);
        case ValidationTokenEnum.Bracket:
            return doEvaluateSyntax(syntax.chi, context, options);
        case ValidationTokenEnum.AmpersandToken:
            return allOf(flatten(syntax), context, options);
        case ValidationTokenEnum.ColumnToken: {
            let success = false;
            let result = anyOf(flatten(syntax), context.clone(), options);
            if (result.valid == ValidationLevel.Valid) {
                success = true;
                context = result.context;
            }
            result = anyOf(flatten(syntax), context.clone(), options);
            if (result.valid == ValidationLevel.Valid) {
                success = true;
                context = result.context;
            }
            return {
                valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
                node: context.current(),
                syntax,
                error: success ? '' : `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${context.done() ? null : renderToken(context.peek())}'`,
                context
            };
        }
    }
    if (token.typ == EnumToken.WhitespaceTokenType) {
        context.next();
        // @ts-ignore
        if (syntax?.typ == ValidationTokenEnum.Whitespace) {
            return {
                valid: ValidationLevel.Valid,
                node: null,
                syntax,
                error: '',
                context
            };
        }
    }
    if ((token?.typ == EnumToken.FunctionTokenType && token.val == 'var')) {
        const result = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, 'var')?.[0]?.chi ?? [], createContext(token.chi), {
            ...options,
            isRepeatable: null,
            isList: null,
            occurence: null,
            atLeastOnce: null
        });
        if (result.valid == ValidationLevel.Valid) {
            context.next();
        }
        return { ...result, context };
    }
    switch (syntax.typ) {
        case ValidationTokenEnum.Keyword:
            success = (token.typ == EnumToken.IdenTokenType || token.typ == EnumToken.DashedIdenTokenType) &&
                (token.val == syntax.val ||
                    syntax.val.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0 ||
                    // config.declarations.all
                    allValues.includes(token.val.toLowerCase()));
            if (!success && token.typ == EnumToken.ColorTokenType) {
                success = token.val != null &&
                    ((token.kin == ColorKind.SYS && systemColors.has(token.val.toLowerCase())) ||
                        (token.kin == ColorKind.DPSYS && deprecatedSystemColors.has(token.val.toLowerCase())));
            }
            if (success) {
                context.next();
                return {
                    valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
                    node: token,
                    syntax,
                    error: success ? '' : `expected keyword: '${syntax.val}', got ${renderToken(token)}`,
                    context
                };
            }
            break;
        case ValidationTokenEnum.PropertyType:
            return matchPropertyType(syntax, context, options);
        case ValidationTokenEnum.ValidationFunctionDefinition:
            token = context.peek();
            if (token.typ == EnumToken.ParensTokenType || !funcLike.concat(EnumToken.ColorTokenType) || (!('chi' in token))) {
                return {
                    valid: ValidationLevel.Drop,
                    node: context.next(),
                    syntax,
                    error: `expected function or color token, got ${renderToken(token)}`,
                    context
                };
            }
            {
                result = doEvaluateSyntax((getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val + '()')?.[0]).chi, createContext(token.chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                });
                if (result.valid == ValidationLevel.Valid) {
                    context.next();
                    result.context = context;
                    return result;
                }
            }
            break;
        case ValidationTokenEnum.DeclarationType:
            return doEvaluateSyntax(getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, syntax.val), context, {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            });
        case ValidationTokenEnum.Parens:
            token = context.peek();
            if (token.typ != EnumToken.ParensTokenType) {
                break;
            }
            return doEvaluateSyntax(syntax.chi, createContext(token.chi), {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            });
        case ValidationTokenEnum.Function:
            token = context.peek();
            if (syntax.val != 'var' && syntax.val != token.val) {
                break;
            }
            success = doEvaluateSyntax(syntax.chi, createContext(token.chi), {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            }).valid == ValidationLevel.Valid;
            if (success) {
                context.next();
            }
            break;
        case ValidationTokenEnum.Comma:
            success = context.peek()?.typ == EnumToken.CommaTokenType;
            if (success) {
                context.next();
            }
            break;
        case ValidationTokenEnum.Number:
            success = context.peek()?.typ == EnumToken.NumberTokenType;
            if (success) {
                context.next();
            }
            break;
        case ValidationTokenEnum.Whitespace:
            success = context.peek()?.typ == EnumToken.WhitespaceTokenType;
            if (success) {
                context.next();
            }
            break;
        case ValidationTokenEnum.Separator:
            {
                const token = context.peek();
                success = token?.typ == EnumToken.LiteralTokenType && token.val == '/';
                if (success) {
                    context.next();
                }
            }
            break;
        default:
            throw new Error(`Not implemented: ${ValidationTokenEnum[syntax.typ] ?? syntax.typ} : ${renderSyntax(syntax)} : ${renderToken(context.peek())} : ${JSON.stringify(syntax, null, 1)} | ${JSON.stringify(context.peek(), null, 1)}`);
    }
    if (!success && token.typ == EnumToken.IdenTokenType && allValues.includes(token.val.toLowerCase())) {
        success = true;
        context.next();
    }
    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax,
        error: success ? '' : `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${renderToken(context.peek())}'`,
        context
    };
}
function matchPropertyType(syntax, context, options) {
    if (!['length-percentage', 'calc-sum', 'color', 'color-base', 'system-color', 'deprecated-system-color'].includes(syntax.val) && syntax.val in config["syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */]) {
        return doEvaluateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val), context, {
            ...options,
            isRepeatable: null,
            isList: null,
            occurence: null,
            atLeastOnce: null
        });
    }
    let success = true;
    let token = context.peek();
    switch (syntax.val) {
        case 'calc-sum':
            success = (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes(token.val)) ||
                // @ts-ignore
                (token.typ == EnumToken.IdenTokenType && typeof Math[token.val.toUpperCase()] == 'number') ||
                [EnumToken.BinaryExpressionTokenType, EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.DimensionTokenType, EnumToken.LengthTokenType, EnumToken.AngleTokenType, EnumToken.TimeTokenType, EnumToken.ResolutionTokenType, EnumToken.FrequencyTokenType].includes(token.typ);
            if (!success) {
                console.error({ syntax, token, success });
                throw new Error(`Not implemented : ${JSON.stringify(syntax, null, 1)} : ${JSON.stringify(context.peek(), null, 1)}`);
            }
            break;
        case 'declaration-value':
            while (!context.done()) {
                context.next();
            }
            success = true;
            break;
        case 'url-token':
            success = token.typ == EnumToken.UrlTokenTokenType || token.typ == EnumToken.StringTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'var');
            break;
        // case 'intrinsic-size-keyword':
        //
        //     success = token.typ == EnumToken.IdenTokenType && ['auto', 'min-content', 'max-content', 'fit-content'].includes((token as IdentToken).val);
        //     break;
        case 'ident':
        case 'custom-ident':
            success = token.typ == EnumToken.IdenTokenType || token.typ == EnumToken.DashedIdenTokenType;
            break;
        case 'dashed-ident':
        case 'custom-property-name':
            success = token.typ == EnumToken.DashedIdenTokenType;
            break;
        case 'system-color':
            success = (token.typ == EnumToken.ColorTokenType && token.kin == ColorKind.SYS) || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('currentcolor', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.FunctionTokenType && token.val == 'var');
            break;
        case 'deprecated-system-color':
            success = (token.typ == EnumToken.ColorTokenType && token.kin == ColorKind.DPSYS) || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('currentcolor', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.FunctionTokenType && token.val == 'var');
            break;
        case 'color':
        case 'color-base':
            success = token.typ == EnumToken.ColorTokenType || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('currentcolor', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('transparent', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.FunctionTokenType && token.val == 'var');
            break;
        case 'hex-color':
            success = (token.typ == EnumToken.ColorTokenType && token.kin == ColorKind.HEX) || (token.typ == EnumToken.FunctionTokenType && token.val == 'var');
            break;
        case 'integer':
            success = (token.typ == EnumToken.NumberTokenType && Number.isInteger(+(token.val))) || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            if ('range' in syntax) {
                success = success && +token.val >= +syntax.range[0] && +token.val <= +syntax.range[1];
            }
            break;
        case 'dimension':
            success = [
                EnumToken.DimensionTokenType,
                EnumToken.LengthTokenType,
                EnumToken.AngleTokenType,
                EnumToken.TimeTokenType,
                EnumToken.ResolutionTokenType,
                EnumToken.FrequencyTokenType
            ].includes(token.typ) || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'number':
        case 'number-token':
            success = token.typ == EnumToken.NumberTokenType;
            if ('range' in syntax) {
                success = success && +token.val >= +syntax.range[0] && +token.val <= +syntax.range[1];
            }
            break;
        case 'angle':
            success = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0') || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'length':
            success = token.typ == EnumToken.LengthTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0') || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'percentage':
            success = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0') || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'length-percentage':
            success = token.typ == EnumToken.LengthTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0') || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'resolution':
            success = token.typ == EnumToken.ResolutionTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0') || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'hash-token':
            success = token.typ == EnumToken.HashTokenType;
            break;
        case 'string':
            success = token.typ == EnumToken.StringTokenType || token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'var');
            break;
        case 'time':
            success = token.typ == EnumToken.TimeTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        // case 'url':
        //
        //     success = token.typ == EnumToken.UrlFunctionTokenType || token.typ == EnumToken.StringTokenType;
        //     break;
        case 'zero':
            success = token.val == '0' || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        default:
            throw new Error(`Not implemented: ${ValidationTokenEnum[syntax.typ] ?? syntax.typ} : ${renderSyntax(syntax)}\n${JSON.stringify(syntax, null, 1)}`);
    }
    if (!success &&
        token.typ == EnumToken.FunctionTokenType &&
        ['length-percentage', 'length', 'number', 'number-token', 'angle', 'percentage', 'dimension'].includes(syntax.val)) {
        if (!success) {
            success = mathFuncs.includes(token.val.toLowerCase()) &&
                doEvaluateSyntax((getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, token.val + '()')?.[0]).chi ?? [], createContext(token.chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                }).valid == ValidationLevel.Valid;
        }
    }
    if (!success && token.typ == EnumToken.IdenTokenType) {
        success = allValues.includes(token.val.toLowerCase());
    }
    if (success) {
        context.next();
    }
    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: token,
        syntax,
        error: success ? '' : `expected '${syntax.val}', got ${renderToken(token)}`,
        context
    };
}
function someOf(syntaxes, context, options) {
    let result;
    let i;
    let success = false;
    const matched = [];
    for (i = 0; i < syntaxes.length; i++) {
        if (context.peek()?.typ == EnumToken.WhitespaceTokenType) {
            context.next();
        }
        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);
        if (result.valid == ValidationLevel.Valid) {
            if (result.context.done()) {
                return result;
            }
            matched.push(result);
        }
    }
    if (matched.length > 0) {
        // pick the best match
        matched.sort((a, b) => a.context.done() ? -1 : b.context.done() ? 1 : b.context.index - a.context.index);
    }
    return matched[0] ?? {
        valid: ValidationLevel.Drop,
        node: context.current(),
        syntax: null,
        error: success ? '' : `could not match someOf: ${syntaxes.reduce((acc, curr) => acc + (acc.length > 0 ? ' | ' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '')}`,
        context
    };
}
function anyOf(syntaxes, context, options) {
    let result;
    let i;
    let success = false;
    for (i = 0; i < syntaxes.length; i++) {
        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);
        if (result.valid == ValidationLevel.Valid) {
            success = true;
            context = result.context;
            i = 0;
            if (context.done()) {
                return result;
            }
        }
    }
    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax: null,
        error: success ? '' : `could not match anyOf: ${syntaxes.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
        context
    };
}
function allOf(syntax, context, options) {
    let result;
    let i = 0;
    for (; i < syntax.length; i++) {
        result = doEvaluateSyntax(syntax[i], context.clone(), options);
        if (result.valid == ValidationLevel.Valid) {
            context = result.context;
            syntax.splice(i, 1);
            i = -1;
        }
    }
    const success = syntax.length == 0;
    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax: syntax?.[0]?.[0] ?? null,
        error: `could not match allOf: ${syntax.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
        context
    };
}
function flatten(syntax) {
    const stack = [syntax.l, syntax.r];
    const data = [];
    let i = 0;
    for (; i < stack.length; i++) {
        if (stack[i].length == 1 && stack[i][0].typ == syntax.typ) {
            stack.push(stack[i][0].l, stack[i][0].r);
        }
        else {
            data.push(stack[i]);
        }
    }
    return data.sort((a, b) => a.length == 1 && a[0].occurence != null ? 1 : b.length == 1 && b[0].occurence != null ? 1 : -1);
}

export { createContext, doEvaluateSyntax, evaluateSyntax };
