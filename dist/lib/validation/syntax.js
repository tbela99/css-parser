import { ValidationTokenEnum } from './parser/types.js';
import { renderSyntax } from './parser/parse.js';
import { EnumToken, SyntaxValidationResult } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../parser/tokenize.js';
import '../parser/utils/config.js';
import { wildCardFuncs, isIdentColor, mathFuncs } from '../syntax/syntax.js';
import { renderToken } from '../renderer/render.js';
import { funcLike, ColorKind, colorsFunc } from '../syntax/color/utils/constants.js';
import { getSyntaxConfig, getParsedSyntax, getSyntax } from './config.js';
import './syntaxes/complex-selector.js';

const config = getSyntaxConfig();
// @ts-ignore
const allValues = getSyntaxConfig()["declarations" /* ValidationSyntaxGroupEnum.Declarations */].all.syntax.trim().split(/[\s|]+/g);
function createContext(input) {
    const values = input.slice();
    const result = values.filter(token => token.typ != EnumToken.CommentTokenType).slice();
    return {
        index: -1,
        get length() {
            return this.index < 0 ? result.length : this.index > result.length ? 0 : result.length - this.index;
        },
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
        update(context) {
            // @ts-ignore
            const newIndex = result.indexOf(context.current());
            if (newIndex > this.index) {
                this.index = newIndex;
            }
        },
        consume(token, howMany) {
            let newIndex = result.indexOf(token, this.index + 1);
            // if (newIndex == -1 || newIndex < this.index) {
            //     return false;
            // }
            howMany ??= 0;
            let splice = 1;
            // if (result[newIndex - 1]?.typ == EnumToken.WhitespaceTokenType) {
            //     splice++;
            //     newIndex--;
            // }
            result.splice(this.index + 1, 0, ...result.splice(newIndex, splice + howMany));
            this.index += howMany + splice;
            return true;
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
        // tokens<Token>(): Token[] {
        //
        //     return result as Token[];
        // },
        slice() {
            return result.slice(this.index + 1);
        },
        clone() {
            const context = createContext(result.slice());
            context.index = this.index;
            return context;
        },
        // @ts-ignore
        // toJSON(): object {
        //
        //     return {
        //         index: this.index,
        //         slice: this.slice(),
        //         tokens: this.tokens()
        //     }
        // }
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
                if (result.valid == SyntaxValidationResult.Valid && !result.context.done()) {
                    let token = null;
                    if ((token = result.context.next()) != null) {
                        // if (token.typ == EnumToken.WhitespaceTokenType || token.typ == EnumToken.CommentTokenType) {
                        //
                        //     continue;
                        // }
                        return {
                            ...result,
                            valid: SyntaxValidationResult.Drop,
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
        // case EnumToken.RuleNodeType:
        // case EnumToken.AtRuleNodeType:
        // case EnumToken.KeyframeAtRuleNodeType:
        // case EnumToken.KeyFrameRuleNodeType:
        // default:
        //
        //     throw new Error(`Not implemented: ${node.typ}`);
    }
    return {
        valid: SyntaxValidationResult.Valid,
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
    let tmpResult;
    let token = null;
    if (context.done()) {
        const success = syntaxes.some(s => s.isOptional || s.isRepeatable || s.isRepeatableGroup);
        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: null,
            syntax: null,
            error: '',
            context
        };
    }
    // console.error(`>> ${syntaxes.reduce((acc, curr) => acc + renderSyntax(curr), '')}\n>> ${context.slice<Token>().reduce((acc, curr) => acc + renderToken(curr), '')}`);
    // console.error(new Error('doEvaluateSyntax'));
    for (; i < syntaxes.length; i++) {
        syntax = syntaxes[i];
        if (context.done()) {
            if (syntax.typ == ValidationTokenEnum.Whitespace || syntax.isOptional || syntax.isRepeatable) {
                continue;
            }
            break;
        }
        token = context.peek();
        // if var() is the last token, then match the remaining syntax and return
        if (context.length == 1 && token.typ == EnumToken.FunctionTokenType && 'var'.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0) {
            return doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, 'var')?.[0]?.chi ?? [], createContext(token.chi), options);
        }
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
            tmpResult = matchRepeatable(syntax, context, options);
            if (tmpResult.valid == SyntaxValidationResult.Valid) {
                result = tmpResult;
            }
            else {
                continue;
            }
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
                    valid: SyntaxValidationResult.Drop,
                    node: token,
                    syntax,
                    error: `cyclic dependency: ${renderSyntax(syntax)}`,
                    context
                };
            }
            result = match(syntax, context, options);
            if (result.valid == SyntaxValidationResult.Valid) {
                clearVisited(token, syntax, 'doEvaluateSyntax', options);
            }
        }
        if (result.valid == SyntaxValidationResult.Drop) {
            if (syntax.isOptional) {
                continue;
            }
            return result;
        }
        context.update(result.context);
    }
    // @ts-ignore
    return result ?? {
        valid: SyntaxValidationResult.Valid,
        node: null,
        syntax: syntaxes[i - 1],
        error: '',
        context
    };
}
function matchAtLeastOnce(syntax, context, options) {
    let success = false;
    let result;
    while (!context.done()) {
        result = match(syntax, context.clone(), { ...options, atLeastOnce: false });
        if (result.valid == SyntaxValidationResult.Valid) {
            success = true;
            context.update(result.context);
            continue;
        }
        break;
    }
    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax,
        error: success ? '' : `could not match syntax: ${renderSyntax(syntax)}`,
        context
    };
}
function matchRepeatable(syntax, context, options) {
    let result;
    while (!context.done()) {
        result = match(syntax, context.clone(), { ...options, isRepeatable: false });
        if (result.valid == SyntaxValidationResult.Valid) {
            context.update(result.context);
            continue;
        }
        break;
    }
    return {
        valid: SyntaxValidationResult.Valid,
        node: null,
        syntax,
        error: '',
        context
    };
}
function matchList(syntax, context, options) {
    let success;
    let result;
    let count = 0;
    let con = context.clone();
    let tokens = [];
    while (!con.done()) {
        while (!con.done() && con.peek()?.typ != EnumToken.CommaTokenType) {
            tokens.push(con.next());
        }
        // if (tokens.length == 0) {
        //
        //     return {
        //         valid: SyntaxValidationResult.Drop,
        //         node: context.peek(),
        //         syntax,
        //         error: `could not match syntax: ${renderSyntax(syntax)}`,
        //         context
        //     }
        // }
        result = doEvaluateSyntax([syntax], createContext(tokens), {
            ...options,
            isList: false,
            occurence: false
        });
        if (result.valid == SyntaxValidationResult.Valid) {
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
    if (success && syntax.occurence != null) {
        success = count >= syntax.occurence.min;
        if (success && syntax.occurence.max != null) {
            success = count <= syntax.occurence.max;
        }
    }
    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax,
        error: '',
        context
    };
}
function matchOccurence(syntax, context, options) {
    let counter = 0;
    let result;
    do {
        result = match(syntax, context.clone(), { ...options, occurence: false });
        if (result.valid == SyntaxValidationResult.Drop) {
            break;
        }
        counter++;
        context.update(result.context);
    } while (result.valid == SyntaxValidationResult.Valid && !context.done());
    let sucesss = counter >= syntax.occurence.min;
    if (sucesss && syntax.occurence.max != null) {
        if (Number.isFinite(syntax.occurence.max)) {
            sucesss = sucesss && counter <= syntax.occurence.max;
        }
    }
    return {
        valid: sucesss ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
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
            let result = anyOf(flatten(syntax), context, options);
            if (result.valid == SyntaxValidationResult.Valid) {
                return result;
            }
            return {
                valid: SyntaxValidationResult.Drop,
                node: context.peek(),
                syntax,
                error: `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${context.done() ? null : renderToken(context.peek())}'`,
                context
            };
        }
    }
    // if (token.typ == EnumToken.WhitespaceTokenType) {
    //
    //     context.next();
    //
    //     // @ts-ignore
    //     if (syntax?.typ == ValidationTokenEnum.Whitespace) {
    //
    //         return {
    //             valid: SyntaxValidationResult.Valid,
    //             node: null,
    //             syntax,
    //             error: '',
    //             context
    //         }
    //     }
    // }
    if (syntax.typ != ValidationTokenEnum.PropertyType && (token?.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val))) {
        const result = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, token.val)?.[0]?.chi ?? [], createContext(token.chi), {
            ...options,
            isRepeatable: null,
            isList: null,
            occurence: null,
            atLeastOnce: null
        });
        if (result.valid == SyntaxValidationResult.Valid) {
            context.next();
        }
        return { ...result, context };
    }
    switch (syntax.typ) {
        case ValidationTokenEnum.Keyword:
            success = (token.typ == EnumToken.IdenTokenType || token.typ == EnumToken.DashedIdenTokenType || isIdentColor(token)) &&
                (token.val == syntax.val ||
                    syntax.val.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0 ||
                    // config.declarations.all
                    allValues.includes(token.val.toLowerCase()));
            if (success) {
                context.next();
                return {
                    valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
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
            if (token.typ == EnumToken.ParensTokenType || !funcLike.concat(EnumToken.ColorTokenType).includes(token.typ) || (!('chi' in token))) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: context.next(),
                    syntax,
                    error: `expected function or color token, got ${renderToken(token)}`,
                    context
                };
            }
            result = match(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val + '()')?.[0], context, options);
            // console.error(`>>[]
            if (result.valid == SyntaxValidationResult.Valid) {
                context.next();
                result.context = context;
                return result;
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
        // case ValidationTokenEnum.Parens:
        //
        //     token = context.peek() as Token;
        //     if (token.typ != EnumToken.ParensTokenType) {
        //
        //         break;
        //     }
        //
        //     success = doEvaluateSyntax((syntax as ValidationParensToken).chi as ValidationToken[], createContext((token as ParensToken).chi), {
        //         ...options,
        //         isRepeatable: null,
        //         isList: null,
        //         occurence: null,
        //         atLeastOnce: null
        //     } as ValidationOptions).valid == SyntaxValidationResult.Valid;
        //     break;
        case ValidationTokenEnum.Comma:
            success = context.peek()?.typ == EnumToken.CommaTokenType;
            if (success) {
                context.next();
            }
            break;
        // case ValidationTokenEnum.Number:
        //
        //     success = context.peek<Token>()?.typ == EnumToken.NumberTokenType;
        //
        //     if (success) {
        //
        //         context.next();
        //     }
        //
        //     break;
        //
        // case ValidationTokenEnum.Whitespace:
        //
        //     success = context.peek<Token>()?.typ == EnumToken.WhitespaceTokenType;
        //
        //     if (success) {
        //
        //         context.next();
        //     }
        //
        //     break;
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
            token = context.peek();
            if (!wildCardFuncs.includes(syntax.val) && syntax.val != token.val) {
                break;
            }
            if (syntax.typ == ValidationTokenEnum.Function) {
                success = funcLike.includes(token.typ) && syntax.val.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0 && doEvaluateSyntax(syntax.chi, createContext(token.chi), options).valid == SyntaxValidationResult.Valid;
                // console.error(`>> match: ${JSON.stringify({
                //     syntax,
                //     token,
                //     // result,
                //     tr2: syntax,
                //     success
                // }, null, 1)}`);
                if (success) {
                    context.next();
                }
                break;
            }
            if (token.typ != EnumToken.ParensTokenType && funcLike.includes(token.typ)) {
                success = doEvaluateSyntax(syntax.chi, createContext(token.chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                }).valid == SyntaxValidationResult.Valid;
                if (success) {
                    context.next();
                }
                break;
            }
        // throw new Error(`Not implemented: ${ValidationTokenEnum[syntax.typ] ?? syntax.typ} : ${renderSyntax(syntax)} : ${renderToken(context.peek() as Token)} : ${JSON.stringify(syntax, null, 1)} | ${JSON.stringify(context.peek(), null, 1)}`);
    }
    if (!success && token.typ == EnumToken.IdenTokenType && allValues.includes(token.val.toLowerCase())) {
        success = true;
        context.next();
    }
    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax,
        error: success ? '' : `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${renderToken(context.peek())}'`,
        context
    };
}
function matchPropertyType(syntax, context, options) {
    if (![
        'bg-position',
        'integer',
        'length-percentage', 'flex', 'calc-sum', 'color',
        'color-base', 'system-color', 'deprecated-system-color',
        'pseudo-class-selector', 'pseudo-element-selector'
    ].includes(syntax.val)) {
        if (syntax.val in config["syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */]) {
            return doEvaluateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, syntax.val), context, {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            });
        }
    }
    let success = true;
    let token = context.peek();
    if ((token?.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val))) {
        const result = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, token.val)?.[0]?.chi ?? [], createContext(token.chi), {
            ...options,
            isRepeatable: null,
            isList: null,
            occurence: null,
            atLeastOnce: null
        });
        if (result.valid == SyntaxValidationResult.Valid) {
            context.next();
        }
        return { ...result, context };
    }
    switch (syntax.val) {
        case 'bg-position': {
            let val;
            let keyworkMatchCount = 0;
            let lengthMatchCount = 0;
            let functionMatchCount = 0;
            let isBGX = false;
            let isBGY = false;
            while (token != null && keyworkMatchCount + lengthMatchCount + functionMatchCount < 3) {
                // match one value: keyword or length
                success = (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
                if (success) {
                    functionMatchCount++;
                    context.next();
                    token = context.peek();
                    continue;
                }
                if (token.typ == EnumToken.WhitespaceTokenType) {
                    context.next();
                    token = context.peek();
                    continue;
                }
                if (token.typ == EnumToken.IdenTokenType) {
                    val = token.val.toLowerCase();
                    success = ['left', 'center', 'right', 'top', 'center', 'bottom'].includes(val);
                    if (!success) {
                        break;
                    }
                    keyworkMatchCount++;
                    if (keyworkMatchCount > 2) {
                        return {
                            valid: SyntaxValidationResult.Drop,
                            node: token,
                            syntax,
                            error: `expected <length-percentage>`,
                            context
                        };
                    }
                    if (val == 'left' || val == 'right') {
                        if (isBGX) {
                            return {
                                valid: SyntaxValidationResult.Drop,
                                node: token,
                                syntax,
                                error: `top | bottom | <length-percentage>`,
                                context
                            };
                        }
                        isBGX = true;
                    }
                    if (val == 'top' || val == 'bottom') {
                        if (isBGY) {
                            return {
                                valid: SyntaxValidationResult.Drop,
                                node: token,
                                syntax,
                                error: `expected left | right | <length-percentage>`,
                                context
                            };
                        }
                        isBGY = true;
                    }
                    context.next();
                    token = context.peek();
                    continue;
                }
                success = token.typ == EnumToken.LengthTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');
                if (!success) {
                    break;
                }
                lengthMatchCount++;
                context.next();
                token = context.peek();
            }
            if (keyworkMatchCount + lengthMatchCount + functionMatchCount == 0) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    node: token,
                    syntax,
                    error: `expected <bg-position>`,
                    context
                };
            }
            return {
                valid: SyntaxValidationResult.Valid,
                node: token,
                syntax,
                error: '',
                context
            };
        }
        case 'calc-sum':
            success = (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes(token.val)) ||
                // @ts-ignore
                (token.typ == EnumToken.IdenTokenType && typeof Math[token.val.toUpperCase()] == 'number') ||
                [EnumToken.BinaryExpressionTokenType, EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.DimensionTokenType, EnumToken.LengthTokenType, EnumToken.AngleTokenType, EnumToken.TimeTokenType, EnumToken.ResolutionTokenType, EnumToken.FrequencyTokenType].includes(token.typ);
            break;
        case 'declaration-value':
            while (!context.done()) {
                context.next();
            }
            success = true;
            break;
        case 'url-token':
            success = token.typ == EnumToken.UrlTokenTokenType || token.typ == EnumToken.StringTokenType || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
            break;
        case 'ident':
        case 'ident-token':
        case 'custom-ident':
            success = token.typ == EnumToken.IdenTokenType || token.typ == EnumToken.DashedIdenTokenType || isIdentColor(token);
            break;
        case 'dashed-ident':
        case 'custom-property-name':
            success = token.typ == EnumToken.DashedIdenTokenType;
            break;
        case 'system-color':
            success = (token.typ == EnumToken.ColorTokenType && token.kin == ColorKind.SYS) || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('currentcolor', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
            break;
        case 'deprecated-system-color':
            success = (token.typ == EnumToken.ColorTokenType && token.kin == ColorKind.DPSYS) || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('currentcolor', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
            break;
        case 'color':
        case 'color-base':
            success = token.typ == EnumToken.ColorTokenType || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('currentcolor', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.IdenTokenType && token.val.localeCompare('transparent', 'en', { sensitivity: 'base' }) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
            if (!success && token.typ == EnumToken.FunctionTokenType && colorsFunc.includes(token.val)) {
                success = doEvaluateSyntax(getParsedSyntax("functions" /* ValidationSyntaxGroupEnum.Functions */, token.val)?.[0]?.chi, createContext(token.chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                }).valid == SyntaxValidationResult.Valid;
            }
            break;
        case 'hex-color':
            success = (token.typ == EnumToken.ColorTokenType && token.kin == ColorKind.HEX) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
            break;
        case 'integer':
            success = (token.typ == EnumToken.NumberTokenType && Number.isInteger(+(token.val))) || (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes(token.val.toLowerCase()) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val)));
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
        case 'flex':
            success = token.typ == EnumToken.FlexTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'number':
        case 'number-token':
            success = token.typ == EnumToken.NumberTokenType;
            if (success && 'range' in syntax) {
                success = +token.val >= +syntax.range[0] && (syntax.range[1] == null || +token.val <= +syntax.range[1]);
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
            success = token.typ == EnumToken.StringTokenType || token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(token.val));
            break;
        case 'time':
            success = token.typ == EnumToken.TimeTokenType || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'zero':
            success = token.val == '0' || (token.typ == EnumToken.FunctionTokenType && token.val == 'calc');
            break;
        case 'pseudo-element-selector':
            success = token.typ == EnumToken.PseudoElementTokenType;
            break;
        case 'pseudo-class-selector':
            success = token.typ == EnumToken.PseudoClassTokenType || token.typ == EnumToken.PseudoClassFuncTokenType;
            if (success) {
                success = token.val + (token.typ == EnumToken.PseudoClassTokenType ? '' : '()') in config["selectors" /* ValidationSyntaxGroupEnum.Selectors */];
                if (success && token.typ == EnumToken.PseudoClassFuncTokenType) {
                    success = doEvaluateSyntax(getParsedSyntax("selectors" /* ValidationSyntaxGroupEnum.Selectors */, token.val + '()')?.[0]?.chi ?? [], createContext(token.chi), {
                        ...options,
                        isRepeatable: null,
                        isList: null,
                        occurence: null,
                        atLeastOnce: null
                    }).valid == SyntaxValidationResult.Valid;
                }
            }
            break;
        // default:
        //
        //     throw new Error(`Not implemented: ${ValidationTokenEnum[syntax.typ] ?? syntax.typ} : ${renderSyntax(syntax)}\n${JSON.stringify(syntax, null, 1)}`);
    }
    if (!success &&
        token.typ == EnumToken.FunctionTokenType &&
        ['length-percentage', 'length', 'number', 'number-token', 'angle', 'percentage', 'dimension'].includes(syntax.val)) {
        if (!success) {
            success = mathFuncs.includes(token.val.toLowerCase()) &&
                doEvaluateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, token.val + '()')?.[0]?.chi ?? [], createContext(token.chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                }).valid == SyntaxValidationResult.Valid;
        }
    }
    if (!success && token.typ == EnumToken.IdenTokenType) {
        success = allValues.includes(token.val.toLowerCase());
    }
    if (success) {
        context.next();
    }
    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
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
        // if (context.peek<Token>()?.typ == EnumToken.WhitespaceTokenType) {
        //
        //     context.next();
        // }
        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);
        // console.error(`>> someOf: ${JSON.stringify({result}, null, 1)}`);
        if (result.valid == SyntaxValidationResult.Valid) {
            success = true;
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
    // console.error(JSON.stringify({matched}, null, 1));
    // console.error(new Error('someOf'));
    return matched[0] ?? {
        valid: SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax: null,
        error: success ? '' : `could not match syntax: ${syntaxes.reduce((acc, curr) => acc + (acc.length > 0 ? ' | ' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '')}`,
        context
    };
}
function anyOf(syntaxes, context, options) {
    let result;
    let i;
    let success = false;
    for (i = 0; i < syntaxes.length; i++) {
        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);
        if (result.valid == SyntaxValidationResult.Valid) {
            success = true;
            context.update(result.context);
            if (result.context.done()) {
                return result;
            }
            syntaxes.splice(i, 1);
            i = -1;
        }
    }
    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax: null,
        error: success ? '' : `could not match syntax: ${syntaxes.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
        context
    };
}
function allOf(syntax, context, options) {
    let result;
    let i;
    let slice = context.slice();
    const vars = [];
    const tokens = [];
    const repeatable = [];
    // match optional syntax first
    // <length>{2,3}&&<color>? => <color>?&&<length>{2,3}
    for (i = 0; i < syntax.length; i++) {
        if (syntax[i].length == 1 && syntax[i][0].occurence != null) {
            repeatable.push(syntax[i]);
            syntax.splice(i--, 1);
        }
    }
    if (repeatable.length > 0) {
        syntax.push(...repeatable);
    }
    // sort tokens -> wildCard -> last
    // 1px var(...) 2px => 1px 2px var(...)
    for (i = 0; i < slice.length; i++) {
        if (slice[i].typ == EnumToken.FunctionTokenType && wildCardFuncs.includes(slice[i].val.toLowerCase())) {
            vars.push(slice[i]);
            // if (slice[i + 1]?.typ == EnumToken.WhitespaceTokenType) {
            //
            //     vars.push(slice[++i]);
            // }
            continue;
        }
        if (slice[i].typ == EnumToken.CommaTokenType || (slice[i].typ == EnumToken.LiteralTokenType && slice[i].val == '/')) {
            tokens.push(...vars);
            vars.length = 0;
        }
        tokens.push(slice[i]);
    }
    if (vars.length > 0) {
        tokens.push(...vars);
    }
    const con = createContext(tokens);
    let cp;
    let j;
    for (i = 0; i < syntax.length; i++) {
        if (syntax[i].length == 1 && syntax[i][0].isOptional) {
            j = 0;
            cp = con.clone();
            slice = cp.slice();
            if (cp.done()) {
                syntax.splice(i, 1);
                i = -1;
                continue;
            }
            while (!cp.done()) {
                result = doEvaluateSyntax(syntax[i], cp.clone(), { ...options, isOptional: false });
                // console.error(`>> allOf: syntaxes[${i}]: ${syntax[i].length} ${syntax[i].reduce((acc, curr) => acc + renderSyntax(curr), '')}\n>> ${cp.slice<Token>().reduce((acc, curr) => acc + renderToken(curr), '')}\n>> ${JSON.stringify({result}, null, 1)}`);
                if (result.valid == SyntaxValidationResult.Valid) {
                    let end = slice.indexOf(cp.current());
                    if (end == -1) {
                        end = 0;
                    }
                    else {
                        end -= j - 1;
                    }
                    con.consume(slice[j], end < 0 ? 0 : end);
                    break;
                }
                cp.next();
                j++;
            }
            // @ts-ignore
            if (result?.valid == SyntaxValidationResult.Valid || (syntax[i].length == 1 && syntax[i][0].isOptional)) {
                syntax.splice(i, 1);
                i = -1;
            }
            continue;
        }
        result = doEvaluateSyntax(syntax[i], con.clone(), options);
        if (result.valid == SyntaxValidationResult.Valid) {
            con.update(result.context);
            syntax.splice(i, 1);
            i = -1;
        }
    }
    // console.error()
    const success = syntax.length == 0;
    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax: syntax?.[0]?.[0] ?? null,
        error: `could not match syntax: ${syntax.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
        context: success ? con : context
    };
}
function flatten(syntax) {
    const stack = [syntax.l, syntax.r];
    const data = [];
    let s;
    let i = 0;
    for (; i < stack.length; i++) {
        if (stack[i].length == 1 && stack[i][0].typ == syntax.typ) {
            s = stack[i][0];
            stack.splice(i--, 1, s.l, s.r);
        }
        else {
            data.push(stack[i]);
        }
    }
    return data;
}

export { createContext, doEvaluateSyntax, evaluateSyntax };
