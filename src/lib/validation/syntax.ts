import {
    renderSyntax,
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
    ValidationSyntaxGroupEnum,
    ValidationToken,
    ValidationTokenEnum
} from "./parser/index.ts";
import type {
    AstDeclaration,
    AstNode,
    ColorToken,
    DimensionToken,
    FunctionToken,
    IdentToken,
    LiteralToken,
    NumberToken,
    ParensToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    Token,
    ValidationOptions
} from "../../@types/index.d.ts";
import type {Context, ValidationConfiguration, ValidationSyntaxResult} from "../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../ast/index.ts";
import {getParsedSyntax, getSyntax, getSyntaxConfig} from "./config.ts";
import {renderToken} from "../../web/index.ts";
import {ColorKind, colorsFunc, funcLike} from "../renderer/color/utils/index.ts";
import {isIdentColor, mathFuncs, wildCardFuncs} from "../syntax/index.ts";

const config: ValidationConfiguration = getSyntaxConfig();

// @ts-ignore
const allValues: string[] = getSyntaxConfig()[ValidationSyntaxGroupEnum.Declarations].all.syntax.trim().split(/[\s|]+/g);

export function createContext(input: Token[]): Context<Token> {

    const values: Token[] = input.slice();
    const result: Token[] = values.slice();

    if (result.at(-1)?.typ == EnumToken.WhitespaceTokenType) {

        result.pop();
    }

    return {

        index: -1,
        peek<Token>(): Token | null {

            let index: number = this.index + 1;

            if (index >= result.length) {

                return null;
            }

            if (result[index]?.typ == EnumToken.WhitespaceTokenType) {

                index++;
            }

            return result[index] as Token ?? null;
        },
        update<Token>(context: Context<Token>) {

            // @ts-ignore
            const newIndex: number = result.indexOf(context.current<Token>() as Token);

            if (newIndex != -1) {

                // console.error({newIndex, v: result[newIndex]});
                // console.error(new Error('update'))
                this.index = newIndex;
            }
        },
        done(): boolean {

            return this.index + 1 >= result.length;
        },
        current<Token>(): Token | null {

            return result[this.index] as Token ?? null;
        },
        next<Token>(): Token | null {

            let index: number = this.index + 1;

            if (index >= result.length) {

                return null;
            }

            if (result[index]?.typ == EnumToken.WhitespaceTokenType) {

                index++;
            }

            this.index = index;
            return result[this.index] as Token ?? null;
        },
        tokens<Token>(): Token[] {

            return result as Token[];
        },
        slice<Token>(): Token[] {

            return result.slice(this.index + 1) as Token[];
        },
        clone(): Context<Token> {

            const context = createContext(input.slice());

            context.index = this.index;
            return context;
        }
    }
}

export function evaluateSyntax(node: AstNode, options: ValidationOptions, parent: AstNode): ValidationSyntaxResult {

    let ast: ValidationToken[] | null;
    let result;

    switch (node.typ) {

        case EnumToken.DeclarationNodeType:

            if ((node as AstDeclaration).nam.startsWith('--')) {

                break;
            }

            ast = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, (node as AstDeclaration).nam);

            if (ast != null) {

                let token: Token | null = null;
                const values: Token[] = (node as AstDeclaration).val.slice();

                while (values.length > 0) {

                    token = values.at(-1) as Token;

                    if (token.typ == EnumToken.WhitespaceTokenType || token.typ == EnumToken.CommentTokenType) {

                        values.pop();

                    } else {

                        if (token.typ == EnumToken.ImportantTokenType) {

                            values.pop();

                            if (values.at(-1)?.typ == EnumToken.WhitespaceTokenType) {

                                values.pop();
                            }
                        }

                        break;
                    }
                }

                result = doEvaluateSyntax(ast, createContext(values), {...options, visited: new WeakMap()});

                if (result.valid == ValidationLevel.Valid && !(result.context as Context<Token>).done()) {

                    let token: Token | null = null;
                    while ((token = (result.context as Context<Token>).next()) != null) {

                        if (token.typ == EnumToken.WhitespaceTokenType || token.typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        return {
                            ...result,
                            valid: ValidationLevel.Drop,
                            node: token,
                            syntax: getSyntax(ValidationSyntaxGroupEnum.Declarations, (node as AstDeclaration).nam),
                            error: `unexpected token: '${renderToken(token)}'`,
                        }
                    }
                }

                return {
                    ...result,
                    syntax: getSyntax(ValidationSyntaxGroupEnum.Declarations, (node as AstDeclaration).nam)
                };
            }

            break;

        case EnumToken.RuleNodeType:
        case EnumToken.AtRuleNodeType:
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
    } as ValidationSyntaxResult;
}

function clearVisited(token: Token, syntax: ValidationToken, key: string, options: ValidationOptions): void {

    options.visited!.get(token)?.get?.(key)?.delete(syntax);
}

function isVisited(token: Token, syntax: ValidationToken, key: string, options: ValidationOptions): boolean {

    if (options.visited!.get(token)?.get?.(key)?.has(syntax)) {

        return true
    }

    if (!options.visited!.has(token)) {

        options.visited!.set(token, new Map<string, Set<ValidationToken>>());
    }

    if (!options.visited!.get(token)!.has(key)) {

        options.visited!.get(token)!.set(key, new Set<ValidationToken>());
    }

    options.visited!.get(token)!.get(key)!.add(syntax);

    return false;
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units/Value_definition_syntax
export function doEvaluateSyntax(syntaxes: ValidationToken[], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let syntax: ValidationToken;
    let i: number = 0;
    let result: ValidationSyntaxResult;
    let token: Token | null = null;

    for (; i < syntaxes.length; i++) {

        syntax = syntaxes[i];

        if (context.done()) {

            if (syntax.typ == ValidationTokenEnum.Whitespace || syntax.isOptional || syntax.isRepeatable) {

                continue;
            }

            break;
        }

        token = context.peek<Token>() as Token;

        if (syntax.typ == ValidationTokenEnum.Whitespace) {

            if (context.peek<Token>()?.typ == EnumToken.WhitespaceTokenType) {

                context.next();
            }

            continue;
        } else if (options.isList !== false && syntax.isList) {

            result = matchList(syntax, context, options);

        } else if (options.isRepeatable !== false && syntax.isRepeatable) {

            result = matchRepeatable(syntax, context, options);
        } else if (options.occurence !== false && syntax.occurence != null) {

            result = matchOccurence(syntax, context, options);
        } else if (options.atLeastOnce !== false && syntax.atLeastOnce) {

            result = matchAtLeastOnce(syntax, context, options);
        } else {

            if (isVisited(token, syntax, 'doEvaluateSyntax', options)) {

                return {
                    valid: ValidationLevel.Drop,
                    node: token,
                    syntax,
                    error: `cyclic dependency: ${renderSyntax(syntax)}`,
                    context
                }
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

        context.update(result.context as Context<Token>);
    }

    return {

        valid: ValidationLevel.Valid,
        node: null,
        syntax: syntaxes[i - 1],
        error: '',
        context
    }
}

function matchAtLeastOnce(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let success: boolean = false;
    let result: ValidationSyntaxResult;

    while (!context.done()) {

        result = match(syntax, context.clone(), {...options, atLeastOnce: false} as ValidationOptions);

        if (result.valid == ValidationLevel.Valid) {

            success = true;
            context.update(result.context as Context<Token>);
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
    }
}

function matchRepeatable(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;

    while (!context.done()) {

        result = match(syntax, context.clone(), {...options, isRepeatable: false} as ValidationOptions);

        if (result.valid == ValidationLevel.Valid) {

            context.update(result.context as Context<Token>);
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
    }
}

function matchList(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let success: boolean = false;
    let result: ValidationSyntaxResult;
    let count: number = 0;
    let con: Context<Token> = context.clone();
    let tokens: Token[] = [];

    while (!con.done()) {

        while (!con.done() && con.peek<Token>()?.typ != EnumToken.CommaTokenType) {

            tokens.push(con.next() as Token);
        }

        if (tokens.length == 0) {

            return {
                valid: ValidationLevel.Drop,
                node: context.peek(),
                syntax,
                error: `could not match list: ${renderSyntax(syntax)}`,
                context
            }
        }

        result = doEvaluateSyntax([syntax], createContext(tokens), {
            ...options,
            isList: false,
            occurence: false
        } as ValidationOptions);

        if (result.valid == ValidationLevel.Valid) {

            context = con.clone();
            count++;

            // pop comma
            if (con.done() || con.peek<Token>()?.typ != EnumToken.CommaTokenType) {

                break;
            }

            con.next();
            tokens.length = 0;

        } else {

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
    }
}

function matchOccurence(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let counter: number = 0;
    let result: ValidationSyntaxResult;

    do {

        result = match(syntax, context.clone(), {...options, occurence: false} as ValidationOptions);

        if (result.valid == ValidationLevel.Drop) {

            break;
        }

        counter++;
        context.update(result.context as Context<Token>);
    }

    while (result.valid == ValidationLevel.Valid && !context.done());

    let sucesss: boolean = counter >= syntax.occurence!.min;

    if (sucesss && syntax.occurence!.max != null) {

        if (Number.isFinite(syntax.occurence!.max)) {

            sucesss = sucesss && counter <= syntax.occurence!.max;
        }
    }

    return {
        valid: sucesss ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax,
        error: sucesss ? '' : `expected ${renderSyntax(syntax)} ${syntax.occurence!.min} to ${syntax.occurence!.max} occurences, got ${counter}`,
        context
    }
}

function match(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let success: boolean = false;
    let result: ValidationSyntaxResult;
    let token: Token | null = context.peek() as Token;

    switch (syntax.typ) {

        case ValidationTokenEnum.PipeToken:

            return someOf((syntax as ValidationPipeToken).chi, context, options);

        case ValidationTokenEnum.Bracket:

            return doEvaluateSyntax((syntax as ValidationBracketToken).chi, context, options);

        case ValidationTokenEnum.AmpersandToken:

            return allOf(flatten(syntax as ValidationAmpersandToken), context, options);

        case ValidationTokenEnum.ColumnToken: {

            let result: ValidationSyntaxResult = anyOf(flatten(syntax as ValidationColumnToken), context, options);

            if (result.valid == ValidationLevel.Valid) {

                return result;
            }

            return {
                valid: ValidationLevel.Drop,
                node: context.next(),
                syntax,
                error: `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${context.done() ? null : renderToken(context.peek() as Token)}'`,
                context
            }
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
            }
        }
    }

    if (syntax.typ != ValidationTokenEnum.PropertyType && (token?.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val))) {

        const result: ValidationSyntaxResult = doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Functions, (token as FunctionToken).val)?.[0] as ValidationFunctionToken)?.chi ?? [] as ValidationToken[], createContext((token as FunctionToken).chi), {
            ...options,
            isRepeatable: null,
            isList: null,
            occurence: null,
            atLeastOnce: null
        } as ValidationOptions);

        if (result.valid == ValidationLevel.Valid) {

            context.next();
        }

        return {...result, context}
    }

    switch (syntax.typ) {

        case ValidationTokenEnum.Keyword:

            success = (token.typ == EnumToken.IdenTokenType || token.typ == EnumToken.DashedIdenTokenType) &&
                ((token as IdentToken).val == (syntax as ValidationKeywordToken).val ||
                    (syntax as ValidationKeywordToken).val.localeCompare((token as IdentToken).val, undefined, {sensitivity: 'base'}) == 0 ||
                    // config.declarations.all
                    allValues.includes((token as IdentToken).val.toLowerCase()));

            if (success) {

                context.next();

                return {
                    valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
                    node: token,
                    syntax,
                    error: success ? '' : `expected keyword: '${(syntax as ValidationKeywordToken).val}', got ${renderToken(token)}`,
                    context
                }
            }

            break;

        case ValidationTokenEnum.PropertyType:

            return matchPropertyType(syntax as ValidationPropertyToken, context, options);

        case ValidationTokenEnum.ValidationFunctionDefinition:

            token = context.peek() as Token;

            if (token.typ == EnumToken.ParensTokenType || !funcLike.concat(EnumToken.ColorTokenType) || (!('chi' in token))) {

                return {
                    valid: ValidationLevel.Drop,
                    node: context.next(),
                    syntax,
                    error: `expected function or color token, got ${renderToken(token)}`,
                    context
                }
            }

        {

            result = doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntax as ValidationFunctionDefinitionToken).val + '()')?.[0] as ValidationFunctionToken).chi as ValidationToken[], createContext((token as FunctionToken).chi), {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            } as ValidationOptions);

            if (result.valid == ValidationLevel.Valid) {

                context.next();

                result.context = context;
                return result;
            }
        }

            break;

        case ValidationTokenEnum.DeclarationType:

            return doEvaluateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, (syntax as ValidationDeclarationToken).val) as ValidationToken[], context, {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            } as ValidationOptions);

        case ValidationTokenEnum.Parens:

            token = context.peek() as Token;
            if (token.typ != EnumToken.ParensTokenType) {

                break;
            }

            success = doEvaluateSyntax((syntax as ValidationParensToken).chi as ValidationToken[], createContext((token as ParensToken).chi), {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            } as ValidationOptions).valid == ValidationLevel.Valid;
            break;


        case ValidationTokenEnum.Comma:

            success = context.peek<Token>()?.typ == EnumToken.CommaTokenType;

            if (success) {

                context.next();
            }

            break;

        case ValidationTokenEnum.Number:

            success = context.peek<Token>()?.typ == EnumToken.NumberTokenType;

            if (success) {

                context.next();
            }

            break;

        case ValidationTokenEnum.Whitespace:

            success = context.peek<Token>()?.typ == EnumToken.WhitespaceTokenType;

            if (success) {

                context.next();
            }

            break;

        case ValidationTokenEnum.Separator: {

            const token = context.peek() as Token;
            success = token?.typ == EnumToken.LiteralTokenType && (token as LiteralToken).val == '/';

            if (success) {

                context.next();
            }
        }

            break;
        default:

            token = context.peek() as Token;

            if (!wildCardFuncs.includes((syntax as ValidationFunctionToken).val) && (syntax as ValidationFunctionToken).val != (token as FunctionToken).val) {

                break;
            }

            if (token.typ != EnumToken.ParensTokenType && funcLike.includes(token.typ)) {

                success = doEvaluateSyntax((syntax as ValidationFunctionToken).chi, createContext((token as FunctionToken).chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                } as ValidationOptions).valid == ValidationLevel.Valid;

                if (success) {

                    context.next();
                }
                break;
            }

            if (syntax.typ == ValidationTokenEnum.Function) {

                success = funcLike.includes(token.typ) && doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntax as ValidationFunctionToken).val + '()')?.[0] as ValidationFunctionToken)?.chi as ValidationToken[], createContext((token as FunctionToken).chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                } as ValidationOptions).valid == ValidationLevel.Valid;

                if (success) {

                    context.next();
                }
                break;
            }

            // throw new Error(`Not implemented: ${ValidationTokenEnum[syntax.typ] ?? syntax.typ} : ${renderSyntax(syntax)} : ${renderToken(context.peek() as Token)} : ${JSON.stringify(syntax, null, 1)} | ${JSON.stringify(context.peek(), null, 1)}`);
    }

    if (!success && token.typ == EnumToken.IdenTokenType && allValues.includes((token as IdentToken).val.toLowerCase())) {

        success = true;
        context.next();
    }

    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.peek(),
        syntax,
        error: success ? '' : `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${renderToken(context!.peek() as Token)}'`,
        context
    };
}

function matchPropertyType(syntax: ValidationPropertyToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    if (![
        'length-percentage', 'flex', 'calc-sum', 'color', 'color-base', 'system-color', 'deprecated-system-color',
        'pseudo-class-selector', 'pseudo-element-selector'
    ].includes(syntax.val)) {

        if (syntax.val in config[ValidationSyntaxGroupEnum.Syntaxes]) {

            return doEvaluateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, syntax.val) as ValidationToken[], context, {
                ...options,
                isRepeatable: null,
                isList: null,
                occurence: null,
                atLeastOnce: null
            } as ValidationOptions);
        }
    }

    let success: boolean = true;
    let token: Token = context.peek() as Token;

    if ((token?.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val))) {

        const result: ValidationSyntaxResult = doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Functions, (token as FunctionToken).val)?.[0] as ValidationFunctionToken)?.chi ?? [] as ValidationToken[], createContext((token as FunctionToken).chi), {
            ...options,
            isRepeatable: null,
            isList: null,
            occurence: null,
            atLeastOnce: null
        } as ValidationOptions);

        if (result.valid == ValidationLevel.Valid) {

            context.next();
        }

        return {...result, context}
    }

    switch (syntax.val) {

        case 'calc-sum':

            success = (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes((token as FunctionToken).val)) ||
                // @ts-ignore
                (token.typ == EnumToken.IdenTokenType && typeof Math[(token as IdentToken).val.toUpperCase()] == 'number') ||
                [EnumToken.BinaryExpressionTokenType, EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.DimensionTokenType, EnumToken.LengthTokenType, EnumToken.AngleTokenType, EnumToken.TimeTokenType, EnumToken.ResolutionTokenType, EnumToken.FrequencyTokenType].includes(token.typ);

            break;

        case 'declaration-value':

            while (!context.done()) {

                context.next();
            }

            success = true;
            break;

        case 'url-token':

            success = token.typ == EnumToken.UrlTokenTokenType || token.typ == EnumToken.StringTokenType || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
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

            success = (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorKind.SYS) || (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare('currentcolor', 'en', {sensitivity: 'base'}) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'deprecated-system-color':

            success = (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorKind.DPSYS) || (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare('currentcolor', 'en', {sensitivity: 'base'}) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'color':
        case 'color-base':

            success = token.typ == EnumToken.ColorTokenType || (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare('currentcolor', 'en', {sensitivity: 'base'}) == 0) || (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare('transparent', 'en', {sensitivity: 'base'}) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));

            if (!success && token.typ == EnumToken.FunctionTokenType && colorsFunc.includes((token as FunctionToken).val)) {

                success = doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Functions, (token as FunctionToken).val)?.[0] as ValidationFunctionToken)?.chi as ValidationToken[], createContext((token as FunctionToken).chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                } as ValidationOptions).valid == ValidationLevel.Valid
            }

            break;

        case 'hex-color':

            success = (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorKind.HEX) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'integer':

            success = (token.typ == EnumToken.NumberTokenType && Number.isInteger(+((token as NumberToken).val))) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');

            if ('range' in syntax) {

                success = success && +(token as NumberToken).val >= +((syntax as ValidationPropertyToken).range![0] as number) && +(token as NumberToken).val <= +((syntax as ValidationPropertyToken).range![1] as number);
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
            ].includes(token.typ) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'flex':

            success = token.typ == EnumToken.FlexTokenType || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break

        case 'number':
        case 'number-token':

            success = token.typ == EnumToken.NumberTokenType;

            if ('range' in syntax) {

                success = success && +(token as NumberToken).val >= +((syntax as ValidationPropertyToken).range![0] as number) && +(token as NumberToken).val <= +((syntax as ValidationPropertyToken).range![1] as number);
            }

            break;

        case 'angle':

            success = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == '0') || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'length':

            success = token.typ == EnumToken.LengthTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == '0') || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'percentage':

            success = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == '0') || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'length-percentage':

            success = token.typ == EnumToken.LengthTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == '0') || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'resolution':

            success = token.typ == EnumToken.ResolutionTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == '0') || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'hash-token':

            success = token.typ == EnumToken.HashTokenType;
            break;

        case 'string':

            success = token.typ == EnumToken.StringTokenType || token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'time':

            success = token.typ == EnumToken.TimeTokenType || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'zero':

            success = (token as DimensionToken).val == '0' || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'pseudo-element-selector':
            success = token.typ == EnumToken.PseudoElementTokenType;
            break;

        case 'pseudo-class-selector':
            success = token.typ == EnumToken.PseudoClassTokenType || token.typ == EnumToken.PseudoClassFuncTokenType;

            if (success) {

                success = (token as PseudoClassToken).val + (token.typ == EnumToken.PseudoClassTokenType ? '' : '()') in config[ValidationSyntaxGroupEnum.Selectors];

                if (success && token.typ == EnumToken.PseudoClassFuncTokenType) {

                    success = doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, (token as PseudoClassFunctionToken).val + '()')?.[0] as ValidationFunctionToken)?.chi ?? [], createContext((token as PseudoClassFunctionToken).chi), {
                        ...options,
                        isRepeatable: null,
                        isList: null,
                        occurence: null,
                        atLeastOnce: null
                    }).valid == ValidationLevel.Valid;
                }
            }

            break;

        // default:
        //
        //     throw new Error(`Not implemented: ${ValidationTokenEnum[syntax.typ] ?? syntax.typ} : ${renderSyntax(syntax)}\n${JSON.stringify(syntax, null, 1)}`);
    }


    if (!success &&
        token.typ == EnumToken.FunctionTokenType &&
        ['length-percentage', 'length', 'number', 'number-token', 'angle', 'percentage', 'dimension'].includes((syntax as ValidationPropertyToken).val)) {

        if (!success) {

            success = mathFuncs.includes((token as FunctionToken).val.toLowerCase()) &&
                // (token as FunctionToken).val + '()' in config[ValidationSyntaxGroupEnum.Syntaxes] &&
                doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (token as FunctionToken).val + '()')?.[0] as ValidationFunctionToken)?.chi ?? [], createContext((token as FunctionToken).chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                }).valid == ValidationLevel.Valid;
        }
    }


    if (!success && token.typ == EnumToken.IdenTokenType) {

        success = allValues.includes((token as IdentToken).val.toLowerCase());
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
    }
}

function someOf(syntaxes: ValidationToken[][], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;
    let i: number;
    let success: boolean = false;
    const matched: ValidationSyntaxResult[] = [];

    for (i = 0; i < syntaxes.length; i++) {

        if (context.peek<Token>()?.typ == EnumToken.WhitespaceTokenType) {

            context.next();
        }

        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);

        if (result.valid == ValidationLevel.Valid) {

            success = true;

            if ((result.context as Context<Token>).done()) {

                return result;
            }

            matched.push(result);
        }
    }

    if (matched.length > 0) {

        // pick the best match
        matched.sort((a, b) => (a.context as Context<Token>).done() ? -1 : (b.context as Context<Token>).done() ? 1 : (b.context as Context<Token>).index - (a.context as Context<Token>).index);
    }

    return matched[0] ?? {
        valid: ValidationLevel.Drop,
        node: context.current(),
        syntax: null,
        error: success ? '' : `could not match someOf: ${syntaxes.reduce((acc, curr) => acc + (acc.length > 0 ? ' | ' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '')}`,
        context
    }
}

function anyOf(syntaxes: ValidationToken[][], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;
    let i: number;
    let success: boolean = false;

    for (i = 0; i < syntaxes.length; i++) {

        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);

        if (result.valid == ValidationLevel.Valid) {

            success = true;
            context.update(result.context as Context<Token>);

            if ((result.context as Context<Token>).done()) {

                return result;
            }

            syntaxes.splice(i, 1);
            i = -1;
        }
    }

    return {
        valid: success ? ValidationLevel.Valid : ValidationLevel.Drop,
        node: context.current(),
        syntax: null,
        error: success ? '' : `could not match anyOf: ${syntaxes.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
        context
    }
}

function allOf(syntax: ValidationToken[][], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;
    let i: number;

    // sort tokens -> wildCard -> last
    // 1px var(...) 2px => 1px 2px var(...)
    const slice: Token[] = context.slice<Token>();
    const vars: Token[] = [];
    const tokens: Token[] = [];

    for (i = 0; i < slice.length; i++) {

        if (slice[i].typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((slice[i] as FunctionToken).val.toLowerCase())) {

            vars.push(slice[i]);
            slice.splice(i, 1);

            if (slice[i]?.typ == EnumToken.WhitespaceTokenType) {

                vars.push(slice[i]);
                slice.splice(i, 1);

                if (i > 0) {

                    i--;
                }
            }

            if (i > 0) {

                i--;
            }

            continue;
        }

        if (slice[i].typ == EnumToken.CommaTokenType || (slice[i].typ == EnumToken.LiteralTokenType && (slice[i] as LiteralToken).val == '/')) {

            tokens.push(...vars);
            vars.length = 0;
        }

        tokens.push(slice[i]);
    }

    if (vars.length > 0) {

        tokens.push(...vars);
    }

    const con: Context<Token> = createContext(tokens);

    for (i = 0; i < syntax.length; i++) {

        result = doEvaluateSyntax(syntax[i], con.clone(), options);

        if (result.valid == ValidationLevel.Valid) {

            con.update(result.context as Context<Token>);
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
        context: success ? con : context
    }
}

function flatten(syntax: ValidationAmpersandToken | ValidationColumnToken): ValidationToken[][] {

    const stack: ValidationToken[][] = [syntax.l, syntax.r];
    const data: ValidationToken[][] = [];
    let s: ValidationAmpersandToken | ValidationColumnToken;
    let i: number = 0;

    for (; i < stack.length; i++) {

        if (stack[i].length == 1 && stack[i][0].typ == syntax.typ) {

            s = stack[i][0] as ValidationAmpersandToken | ValidationColumnToken;
            stack.splice(i--, 1, s.l, s.r);
        } else {

            data.push(stack[i]);
        }
    }

    return data;
}