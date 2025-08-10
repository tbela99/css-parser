import type {
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
} from "./parser/index.ts";
import {renderSyntax, ValidationSyntaxGroupEnum, ValidationTokenEnum} from "./parser/index.ts";
import type {
    AstDeclaration,
    AstNode,
    ColorToken,
    DimensionToken,
    FunctionToken,
    IdentToken,
    LiteralToken,
    NumberToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    Token,
    ValidationOptions
} from "../../@types/index.d.ts";
import type {Context, ValidationConfiguration, ValidationSyntaxResult} from "../../@types/validation.d.ts";
import {ColorType, EnumToken, SyntaxValidationResult} from "../ast/index.ts";
import {getParsedSyntax, getSyntax, getSyntaxConfig} from "./config.ts";
import {renderToken} from "../../web/index.ts";
import {colorsFunc, funcLike} from "../syntax/color/utils/index.ts";
import {isIdentColor, mathFuncs, wildCardFuncs} from "../syntax/index.ts";

const config: ValidationConfiguration = getSyntaxConfig();

// @ts-ignore
const allValues: string[] = getSyntaxConfig()[ValidationSyntaxGroupEnum.Declarations].all.syntax.trim().split(/[\s|]+/g);

export function createContext(input: Token[]): Context<Token> {

    const values: Token[] = input.slice();
    const result: Token[] = values.filter(token => token.typ != EnumToken.CommentTokenType).slice();

    return {

        index: -1,
        get length(): number {

            return this.index < 0 ? result.length : this.index > result.length ? 0 : result.length - this.index;
        },
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

            if (newIndex > this.index) {

                this.index = newIndex;
            }
        },
        consume<Type>(token: Type, howMany?: number): boolean {

            let newIndex: number = result.indexOf(token as Token, this.index + 1);

            howMany ??= 0;

            let splice: number = 1;

            result.splice(this.index + 1, 0, ...result.splice(newIndex, splice + howMany));
            this.index += howMany + splice;
            return true;
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
        slice<Token>(): Token[] {

            return result.slice(this.index + 1) as Token[];
        },
        clone(): Context<Token> {

            const context = createContext(result.slice());
            context.index = this.index;

            return context;
        }
    }
}

export function evaluateSyntax(node: AstNode, options: ValidationOptions): ValidationSyntaxResult {

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

                if (result.valid == SyntaxValidationResult.Valid && !(result.context as Context<Token>).done()) {

                    let token: Token | null = null;

                    if ((token = (result.context as Context<Token>).next()) != null) {

                        return {
                            ...result,
                            valid: SyntaxValidationResult.Drop,
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
    }

    return {
        valid: SyntaxValidationResult.Valid,
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
    let tmpResult: ValidationSyntaxResult;
    let token: Token | null = null;

    if (context.done()) {

        const success: boolean = syntaxes.some(s => s.isOptional || s.isRepeatable || s.isRepeatableGroup);

        return {
            valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: null,
            syntax: null,
            error: '',
            context
        }
    }

    for (; i < syntaxes.length; i++) {

        syntax = syntaxes[i];

        if (context.done()) {

            if (syntax.typ == ValidationTokenEnum.Whitespace || syntax.isOptional || syntax.isRepeatable) {

                continue;
            }

            break;
        }

        token = context.peek<Token>() as Token;

        // if var() is the last token, then match the remaining syntax and return
        if (context.length == 1 && token.typ == EnumToken.FunctionTokenType && 'var'.localeCompare((token as FunctionToken).val, undefined, {sensitivity: 'base'}) == 0) {

            return doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Functions, 'var')?.[0] as ValidationFunctionToken)?.chi ?? [] as ValidationToken[], createContext((token as FunctionToken).chi), options);
        }

        if (syntax.typ == ValidationTokenEnum.Whitespace) {

            if (context.peek<Token>()?.typ == EnumToken.WhitespaceTokenType) {

                context.next();
            }

            continue;
        } else if (options.isList !== false && syntax.isList) {

            result = matchList(syntax, context, options);

        } else if (options.isRepeatable !== false && syntax.isRepeatable) {

            tmpResult = matchRepeatable(syntax, context, options);

            if (tmpResult.valid == SyntaxValidationResult.Valid) {

                result = tmpResult;
            } else {

                continue;
            }

        } else if (options.occurence !== false && syntax.occurence != null) {

            result = matchOccurence(syntax, context, options);
        } else if (options.atLeastOnce !== false && syntax.atLeastOnce) {

            result = matchAtLeastOnce(syntax, context, options);
        } else {

            if (isVisited(token, syntax, 'doEvaluateSyntax', options)) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    node: token,
                    syntax,
                    error: `cyclic dependency: ${renderSyntax(syntax)}`,
                    context
                }
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

        context.update(result.context as Context<Token>);
    }

    // @ts-ignore
    return result ?? {

        valid: SyntaxValidationResult.Valid,
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

        if (result.valid == SyntaxValidationResult.Valid) {

            success = true;
            context.update(result.context as Context<Token>);
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
    }
}

function matchRepeatable(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;

    while (!context.done()) {

        result = match(syntax, context.clone(), {...options, isRepeatable: false} as ValidationOptions);

        if (result.valid == SyntaxValidationResult.Valid) {

            context.update(result.context as Context<Token>);
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
    }
}

function matchList(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let success: boolean;
    let result: ValidationSyntaxResult;
    let count: number = 0;
    let con: Context<Token> = context.clone();
    let tokens: Token[] = [];

    while (!con.done()) {

        while (!con.done() && con.peek<Token>()?.typ != EnumToken.CommaTokenType) {

            tokens.push(con.next() as Token);
        }

        result = doEvaluateSyntax([syntax], createContext(tokens), {
            ...options,
            isList: false,
            occurence: false
        } as ValidationOptions);

        if (result.valid == SyntaxValidationResult.Valid) {

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
    }
}

function matchOccurence(syntax: ValidationToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let counter: number = 0;
    let result: ValidationSyntaxResult;

    do {

        result = match(syntax, context.clone(), {...options, occurence: false} as ValidationOptions);

        if (result.valid == SyntaxValidationResult.Drop) {

            break;
        }

        counter++;
        context.update(result.context as Context<Token>);
    }

    while (result.valid == SyntaxValidationResult.Valid && !context.done());

    let sucesss: boolean = counter >= syntax.occurence!.min;

    if (sucesss && syntax.occurence!.max != null) {

        if (Number.isFinite(syntax.occurence!.max)) {

            sucesss = sucesss && counter <= syntax.occurence!.max;
        }
    }

    return {
        valid: sucesss ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
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

            if (result.valid == SyntaxValidationResult.Valid) {

                return result;
            }

            return {
                valid: SyntaxValidationResult.Drop,
                node: context.peek(),
                syntax,
                error: `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${context.done() ? null : renderToken(context.peek() as Token)}'`,
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

        if (result.valid == SyntaxValidationResult.Valid) {

            context.next();
        }

        return {...result, context}
    }

    switch (syntax.typ) {

        case ValidationTokenEnum.Keyword:

            success = (token.typ == EnumToken.IdenTokenType || token.typ == EnumToken.DashedIdenTokenType || isIdentColor(token)) &&
                ((token as IdentToken).val == (syntax as ValidationKeywordToken).val ||
                    (syntax as ValidationKeywordToken).val.localeCompare((token as IdentToken).val, undefined, {sensitivity: 'base'}) == 0 ||
                    // config.declarations.all
                    allValues.includes((token as IdentToken).val.toLowerCase()));

            if (success) {

                context.next();

                return {
                    valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
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

            if (token.typ == EnumToken.ParensTokenType || !funcLike.concat(EnumToken.ColorTokenType).includes(token.typ) || (!('chi' in token))) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    node: context.next(),
                    syntax,
                    error: `expected function or color token, got ${renderToken(token)}`,
                    context
                }
            }

            result = match(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntax as ValidationFunctionDefinitionToken).val + '()')?.[0] as ValidationFunctionToken, context, options);

            if (result.valid == SyntaxValidationResult.Valid) {

                context.next();

                result.context = context;
                return result;
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

        case ValidationTokenEnum.Comma:

            success = context.peek<Token>()?.typ == EnumToken.CommaTokenType;

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

            if (syntax.typ == ValidationTokenEnum.Function) {

                success = funcLike.includes(token.typ) && (syntax as ValidationFunctionToken).val.localeCompare((token as FunctionToken).val, undefined, {sensitivity: 'base'}) == 0 && doEvaluateSyntax((syntax as ValidationFunctionToken).chi as ValidationToken[], createContext((token as FunctionToken).chi), options).valid == SyntaxValidationResult.Valid;

                if (success) {

                    context.next();
                }
                break;
            }

            if (token.typ != EnumToken.ParensTokenType && funcLike.includes(token.typ)) {

                success = doEvaluateSyntax((syntax as ValidationFunctionToken).chi, createContext((token as FunctionToken).chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                } as ValidationOptions).valid == SyntaxValidationResult.Valid;

                if (success) {

                    context.next();
                }
                break;
            }
    }

    if (!success && token.typ == EnumToken.IdenTokenType && allValues.includes((token as IdentToken).val.toLowerCase())) {

        success = true;
        context.next();
    }

    return {
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax,
        error: success ? '' : `expected '${ValidationTokenEnum[syntax.typ].toLowerCase()}', got '${renderToken(context!.peek() as Token)}'`,
        context
    };
}

function matchPropertyType(syntax: ValidationPropertyToken, context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    if (![
        'bg-position',
        'integer',
        'length-percentage', 'flex', 'calc-sum', 'color',
        'color-base', 'system-color', 'deprecated-system-color',
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

        if (result.valid == SyntaxValidationResult.Valid) {

            context.next();
        }

        return {...result, context}
    }

    switch (syntax.val) {

        case 'bg-position': {

            let val: string;
            let keyworkMatchCount: number = 0;
            let lengthMatchCount: number = 0;
            let functionMatchCount: number = 0;
            let isBGX: boolean = false;
            let isBGY: boolean = false;

            while (token != null && keyworkMatchCount + lengthMatchCount + functionMatchCount < 3) {

                // match one value: keyword or length
                success = (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));

                if (success) {
                    functionMatchCount++;
                    context.next();
                    token = context.peek() as Token;
                    continue;
                }

                if (token.typ == EnumToken.WhitespaceTokenType) {

                    context.next();
                    token = context.peek() as Token;
                    continue;
                }

                if (token.typ == EnumToken.IdenTokenType) {

                    val = (token as IdentToken).val.toLowerCase();
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
                        }
                    }

                    if (val == 'left' || val == 'right') {

                        if (isBGX) {

                            return {
                                valid: SyntaxValidationResult.Drop,
                                node: token,
                                syntax,
                                error: `top | bottom | <length-percentage>`,
                                context
                            }
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
                            }
                        }

                        isBGY = true;
                    }

                    context.next();
                    token = context.peek() as Token;
                    continue;
                }

                success = token.typ == EnumToken.LengthTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == 0);

                if (!success) {

                    break;
                }

                lengthMatchCount++;
                context.next();
                token = context.peek() as Token;
            }

            if (keyworkMatchCount + lengthMatchCount + functionMatchCount == 0) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    node: token,
                    syntax,
                    error: `expected <bg-position>`,
                    context
                }
            }

            return {
                valid: SyntaxValidationResult.Valid,
                node: token,
                syntax,
                error: '',
                context
            }
        }

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

            success = (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorType.SYS) || (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare('currentcolor', 'en', {sensitivity: 'base'}) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'deprecated-system-color':

            success = (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorType.DPSYS) || (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare('currentcolor', 'en', {sensitivity: 'base'}) == 0) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
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
                } as ValidationOptions).valid == SyntaxValidationResult.Valid
            }

            break;

        case 'hex-color':

            success = (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorType.HEX) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'integer':

            success = (token.typ == EnumToken.NumberTokenType && Number.isInteger(+((token as NumberToken).val))) || (token.typ == EnumToken.FunctionTokenType && mathFuncs.includes((token as FunctionToken).val.toLowerCase()) || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val)));

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

            if (success && 'range' in syntax) {

                success = +(token as NumberToken).val >= +((syntax as ValidationPropertyToken).range![0] as number) && ((syntax as ValidationPropertyToken).range![1] == null || +(token as NumberToken).val <= +((syntax as ValidationPropertyToken).range![1] as number));
            }

            break;

        case 'angle':

            success = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == 0) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'length':

            success = token.typ == EnumToken.LengthTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == 0) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'percentage':

            success = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == 0) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'length-percentage':

            success = token.typ == EnumToken.LengthTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == 0) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'resolution':

            success = token.typ == EnumToken.ResolutionTokenType || token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val == 0) || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'hash-token':

            success = token.typ == EnumToken.HashTokenType;
            break;

        case 'string':

            success = token.typ == EnumToken.StringTokenType || token.typ == EnumToken.UrlTokenTokenType || token.typ == EnumToken.HashTokenType || token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((token as FunctionToken).val));
            break;

        case 'time':

            success = token.typ == EnumToken.TimeTokenType || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
            break;

        case 'zero':

            success = (token as DimensionToken).val == 0 || (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc');
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
                    }).valid == SyntaxValidationResult.Valid;
                }
            }

            break;
    }


    if (!success &&
        token.typ == EnumToken.FunctionTokenType &&
        ['length-percentage', 'length', 'number', 'number-token', 'angle', 'percentage', 'dimension'].includes((syntax as ValidationPropertyToken).val)) {

        if (!success) {

            success = mathFuncs.includes((token as FunctionToken).val.toLowerCase()) &&
                doEvaluateSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (token as FunctionToken).val + '()')?.[0] as ValidationFunctionToken)?.chi ?? [], createContext((token as FunctionToken).chi), {
                    ...options,
                    isRepeatable: null,
                    isList: null,
                    occurence: null,
                    atLeastOnce: null
                }).valid == SyntaxValidationResult.Valid;
        }
    }


    if (!success && token.typ == EnumToken.IdenTokenType) {

        success = allValues.includes((token as IdentToken).val.toLowerCase());
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
    }
}

function someOf(syntaxes: ValidationToken[][], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;
    let i: number;
    let success: boolean = false;
    const matched: ValidationSyntaxResult[] = [];

    for (i = 0; i < syntaxes.length; i++) {

        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);

        if (result.valid == SyntaxValidationResult.Valid) {

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
        valid: SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax: null,
        error: success ? '' : `could not match syntax: ${syntaxes.reduce((acc, curr) => acc + (acc.length > 0 ? ' | ' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '')}`,
        context
    }
}

function anyOf(syntaxes: ValidationToken[][], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;
    let i: number;
    let success: boolean = false;

    for (i = 0; i < syntaxes.length; i++) {

        result = doEvaluateSyntax(syntaxes[i], context.clone(), options);

        if (result.valid == SyntaxValidationResult.Valid) {

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
        valid: success ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
        node: context.peek(),
        syntax: null,
        error: success ? '' : `could not match syntax: ${syntaxes.reduce((acc, curr) => acc + '[' + curr.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']', '')}`,
        context
    }
}

function allOf(syntax: ValidationToken[][], context: Context<Token>, options: ValidationOptions): ValidationSyntaxResult {

    let result: ValidationSyntaxResult;
    let i: number;

    let slice: Token[] = context.slice<Token>();
    const vars: Token[] = [];
    const tokens: Token[] = [];

    const repeatable: ValidationToken[][] = [];

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

        if (slice[i].typ == EnumToken.FunctionTokenType && wildCardFuncs.includes((slice[i] as FunctionToken).val.toLowerCase())) {

            vars.push(slice[i]);
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
    let cp: Context<Token>;
    let j: number;

    for (i = 0; i < syntax.length; i++) {

        if (syntax[i].length == 1 && syntax[i][0].isOptional) {

            j = 0;
            cp = con.clone();
            slice = cp.slice<Token>();

            if (cp.done()) {

                syntax.splice(i, 1);
                i = -1;

                continue;
            }

            while (!cp.done()) {

                result = doEvaluateSyntax(syntax[i], cp.clone(), {...options, isOptional: false});

                if (result.valid == SyntaxValidationResult.Valid) {

                    let end = slice.indexOf(cp.current() as Token);

                    if (end == -1) {

                        end = 0
                    } else {

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

            con.update(result.context as Context<Token>);
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