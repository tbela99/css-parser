import {
    specialValues,
    ValidationAmpersandToken,
    ValidationAtRule,
    ValidationAtRuleDefinitionToken,
    ValidationAtRuleToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationDeclarationToken,
    ValidationFunctionDefinitionToken,
    ValidationFunctionToken,
    ValidationKeywordToken,
    ValidationParensToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationPseudoClassFunctionToken,
    ValidationStringToken,
    ValidationSyntaxGroupEnum,
    ValidationToken,
    ValidationTokenEnum
} from "./parser";
import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AttrToken,
    ColorToken,
    DimensionToken,
    FunctionToken,
    IdentToken,
    LiteralToken,
    MatchExpressionToken,
    NumberToken,
    PseudoClassFunctionToken,
    StringToken,
    Token,
    ValidationOptions
} from "../../@types";
import {EnumToken, funcLike, ValidationLevel} from "../ast";
import {getParsedSyntax, getSyntaxConfig} from "./config";
import type {ValidationConfiguration, ValidationSyntaxResult} from "../../@types/validation";
import {isLength} from "../syntax";
import {validateSelector} from "./selector";

const config: ValidationConfiguration = getSyntaxConfig();

function consumeToken(tokens: Token[] | AstNode[]): void {

    tokens.shift();
}

function consumeSyntax(syntaxes: ValidationToken[]): void {

    syntaxes.shift();
}

function splice(tokens: Token[] | AstNode[], matches: Token[] | AstNode[]): Token[] | AstNode[] {

    if (matches.length == 0) {

        return tokens;
    }

    // @ts-ignore
    const index: number = tokens.indexOf(matches.at(-1) as Token | AstNode);

    if (index > -1) {

        tokens.splice(0, index + 1);
    }

    return tokens;
}

export interface ValidationContext {
    level: number;
    scope?: AstNode | Token;
    tokens?: Token[] | AstNode[] | null;
    cache?: WeakMap<AstNode | Token, Map<string, ValidationSyntaxResult>>;
}

export function validateSyntax(syntaxes: ValidationToken[], tokens: Token[] | AstNode[], root?: AstNode, options?: ValidationOptions, context: ValidationContext = {level: 0}): ValidationSyntaxResult {

    if (syntaxes == null) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0] ?? null,
            syntax: null,
            error: 'no matching syntax found',
            tokens
        } as ValidationSyntaxResult;
    }

    let token: Token | AstNode | null = null;
    let syntax: ValidationToken;
    let result: ValidationSyntaxResult | null = null;
    let validSyntax: boolean = false;
    let matched: boolean = false;
    const matches: Token[] | AstNode[] = [];
    tokens = tokens.slice();
    syntaxes = syntaxes.slice();
    tokens = tokens.slice();

    if (context.cache == null) {

        context.cache = new WeakMap;
    }

    if (context.tokens == null) {

        context.tokens = tokens.slice();
    }

    context = {...context};

    main:
        while (tokens.length > 0) {

            // console.error('len = ' + tokens.length, 'sln = ' + syntaxes.length, 'mlen = ' + matches.length);
            // console.error(new Error('debug'));

            if (syntaxes.length == 0) {

                break;
            }

            token = tokens[0];
            syntax = syntaxes[0] as ValidationToken;
            // @ts-ignore
            context.position = context.tokens.indexOf(token);

            const cached = context!.cache!.get(token)?.get(syntax!.text as string) ?? null;

            if (cached != null) {

                if (cached.error.length > 0) {
                    return {...cached, tokens, node: cached.valid == ValidationLevel.Valid ? null : token};
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
            } else if (syntax.typ == ValidationTokenEnum.Whitespace) {

                syntaxes.shift();

                if (token.typ == EnumToken.WhitespaceTokenType) {

                    tokens.shift();
                }

                continue;
            }

            // console.error({
            //
            //     root,
            //     syntaxes,
            //     tokens,
            //     syntax, token,
            //     r: renderSyntax(syntax),
            //     a: syntaxes.reduce((acc, curr) => acc + renderSyntax(curr), '')
            // });

            if (syntax.isOptional) {


                if (!context.cache!.has(token)) {

                    context.cache!.set(token, new Map)
                }

                if (context.cache!.get(token)!.has(syntax.text as string)) {

                    result = context.cache!.get(token)!.get(syntax.text as string)!;

                    return {...result, tokens, node: result.valid == ValidationLevel.Valid ? null : token};
                }


                // @ts-ignore
                const {isOptional, ...c}: { isOptional: boolean, c: ValidationToken } = syntax;

                // @ts-ignore
                let result2: ValidationSyntaxResult;

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
                } else {

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
                    }
                }

                continue;
            }

            if (syntax.isList) {

                let index: number = -1;
                // @ts-ignore
                let {isList, ...c}: { isList: boolean, c: ValidationToken } = syntax;
                // const c: ValidationToken = {...syntax, isList: false} as ValidationToken;

                let result2: ValidationSyntaxResult | null = null;
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
                        } as ValidationSyntaxResult
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

                        const l: number = tokens.length;


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
                            } as ValidationSyntaxResult
                        }

                        tokens = tokens.slice(index);


                        result = result2;
                        // @ts-ignore
                        matches.push(...result2.matches);

                        if (result.tokens.length > 0) {

                            if (index == -1) {

                                tokens = result.tokens;
                            } else {

                                tokens = tokens.slice(index - result.tokens.length);
                            }
                        } else if (index > 0) {

                            tokens = tokens.slice(index);
                        }

                        index = -1;

                        if (l == tokens.length) {

                            break;
                        }

                    } else {

                        break;
                    }
                }

                while (tokens.length > 0);

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
                    } as ValidationSyntaxResult
                }

                syntaxes.shift();
                continue;
            }

            if (syntax.isRepeatable) {

                // @ts-ignore
                let {isRepeatable, ...c}: { isRepeatable: boolean, c: ValidationToken } = syntax;
                let result2: ValidationSyntaxResult | null = null;

                validSyntax = false;
                let l: number = tokens.length;
                let tok: Token | null = null;

                let count: number = 0;

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

                                tok = tokens[0] as Token;

                                count++;
                                continue;
                            }

                            break;
                        }

                        if (matches.length == 0) {

                            tokens = result2.tokens;
                        }

                        l = tokens.length;
                        count++;
                        continue;
                    }

                    break;
                }

                while (result2.valid == ValidationLevel.Valid && tokens.length > 0);

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

                let count: number = 0;
                let l: number = tokens.length;
                let result2: ValidationSyntaxResult | null = null;

                do {

                    // @ts-ignore
                    const {isRepeatableGroup, ...c}: { isRepeatableGroup: boolean, c: ValidationToken } = syntax;

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

                    } else {

                        break;
                    }
                }

                while (tokens.length > 0 && result!.valid == ValidationLevel.Valid);

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
                    } as ValidationSyntaxResult
                }

                syntaxes.shift();
                continue;
            }

            if (syntax.atLeastOnce) {

                const {atLeastOnce, ...c} = syntax;

                result = validateSyntax([c], tokens, root, options, context);

                if (result.valid == ValidationLevel.Drop) {

                    return result;
                }

                splice(tokens, result.matches);
                // tokens = result.tokens;
                // @ts-ignore
                matches.push(...result.matches);

                let l: number = tokens.length;
                let r: ValidationSyntaxResult = validateSyntax([c], tokens, root, options, context);

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
                const {occurence, ...c}: {
                    occurence: {
                        min: number;
                        max?: number | null;
                    }, c: ValidationToken
                } = syntax;

                // && syntax.occurence.max != null
                // consume all tokens
                let match: number = 1;

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
                    let r: ValidationSyntaxResult = validateSyntax([c], tokens, root, options, context);

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
            if (token.val != null && specialValues.includes(token.val as string)) {

                matched = true;
                result = {
                    valid: ValidationLevel.Valid,
                    matches: [token] as Token[],
                    node: null,
                    syntax,
                    error: '',
                    tokens
                } as ValidationSyntaxResult;

                // @ts-ignore
                matches.push(...result.matches);
            } else {

                result = doValidateSyntax(syntax, token, tokens, root as AstNode, options as ValidationOptions, context);

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
                return {...result, matches, tokens, node: result.valid == ValidationLevel.Valid ? null : token};
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

    if (/* result == null && */ tokens.length == 0 && syntaxes.length > 0) {

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
        } as ValidationSyntaxResult;
    }

    if (token != null) {

        if (!context.cache!.has(token as AstNode | Token)) {

            context.cache!.set(token as AstNode | Token, new Map)
        }

        context.cache!.get(token as AstNode | Token)!.set(syntax!.text as string, result);
    }

    if (result != null) {

        // @ts-ignore
        return {...result, matches: [...new Set(matches as Token[] | AstNode[])<Token | AstNode>]};
    }


    return result as ValidationSyntaxResult;
}

function isOptionalSyntax(syntaxes: ValidationToken[]): boolean {

    return syntaxes.every(t => t.typ == ValidationTokenEnum.Whitespace || t.isOptional || t.isRepeatable || (t.typ == ValidationTokenEnum.PropertyType && isOptionalSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (t as ValidationPropertyToken).val) ?? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, (t as ValidationPropertyToken).val) as ValidationToken[])))
}

function doValidateSyntax(syntax: ValidationToken, token: Token | AstNode, tokens: Token[] | AstNode[], root: AstNode | null, options: ValidationOptions, context: ValidationContext): ValidationSyntaxResult {

    let valid: boolean = false;
    let result: ValidationSyntaxResult;

    let children: ValidationToken[];
    let queue: ValidationToken[];
    let matches: ValidationToken[];
    let child: ValidationColumnToken;
    let astNodes: Set<Token> = new Set;

    if (token.typ == EnumToken.NestingSelectorTokenType && syntax.typ == 2) {

        valid = root != null && 'relative-selector' == (syntax as ValidationPropertyToken).val;

        return {

            valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
            matches: valid ? [token] as Token[] : [],
            node: valid ? null : token,
            syntax,
            error: valid ? '' : 'unexpected token',
            tokens
        } as ValidationSyntaxResult
    }

    switch (syntax.typ) {

        case ValidationTokenEnum.Comma:

            valid = token.typ === EnumToken.CommaTokenType;

            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            }

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
                } as ValidationSyntaxResult
            }

            if ((token as AstAtRule).nam != (syntax as ValidationAtRule).val) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: `expecting '@${(syntax as ValidationAtRuleToken).val}' but found '@${(token as AstAtRule).nam}'`,
                    tokens
                } as ValidationSyntaxResult
            }

            if (root == null) {

                return {
                    valid: ValidationLevel.Valid,
                    matches: [token],
                    node: null,
                    syntax,
                    error: '',
                    tokens
                } as ValidationSyntaxResult
            }

            if (root.typ != EnumToken.AtRuleNodeType) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'not allowed here',
                    tokens
                }
            }

        {

            const parentSyntax = getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, '@' + (root as AstAtRule).nam) as ValidationToken[];

            if ('chi' in parentSyntax) {

                if (!('chi' in token)) {

                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: '@at-rule must have children',
                        tokens
                    }
                }

                // @ts-ignore
                return validateSyntax(parentSyntax.chi, (token as AstAtRule).chi, root, options, context);
            } else if ('chi' in token) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: '@at-rule must not have children',
                    tokens
                }
            }
        }

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
                } as ValidationSyntaxResult
            }

            if ('chi' in syntax && !('chi' in token)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: '@at-rule must have children',
                    tokens
                } as ValidationSyntaxResult
            }

            if ('chi' in token && !('chi' in token)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'children not allowed here',
                    tokens
                } as ValidationSyntaxResult
            }

            const s = getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, '@' + (token as AstAtRule).nam) as ValidationToken[];

            if ('prelude' in syntax) {

                if (!('tokens' in token)) {

                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'expected at-rule prelude',
                        tokens
                    } as ValidationSyntaxResult
                }

                result = validateSyntax((s[0] as ValidationAtRuleDefinitionToken).prelude as ValidationToken[], (token as AstAtRule).tokens as Token[], root as AstNode, options, {
                    ...context,
                    tokens: null,
                    level: context.level + 1
                });

                if (result.valid == ValidationLevel.Drop) {

                    return result;
                }
            }

            const hasBody: boolean = 'chi' in s[0];

            if ('chi' in token) {

                if (!hasBody) {

                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'unexpected at-rule body',
                        tokens
                    } as ValidationSyntaxResult
                }
            } else if (hasBody) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'expecting at-rule body',
                    tokens
                } as ValidationSyntaxResult
            }

            break;

        case ValidationTokenEnum.DeclarationType:

            // @ts-ignore
            result = validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, (syntax as ValidationDeclarationToken).val), [token], root, options, context);
            break;

        case ValidationTokenEnum.Keyword:

            valid = (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val.localeCompare((syntax as ValidationKeywordToken).val, 'en', {sensitivity: 'base'}) == 0) ||
                (token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == 'lit' && (syntax as ValidationKeywordToken).val.localeCompare((token as ColorToken).val as string, 'en', {sensitivity: 'base'}) == 0);

            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            } as ValidationSyntaxResult

            break;

        case ValidationTokenEnum.SemiColon:

            valid = root == null || [EnumToken.RuleNodeType, EnumToken.AtRuleNodeType, EnumToken.StyleSheetNodeType].includes(root.typ);

            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            } as ValidationSyntaxResult

            break;

        case ValidationTokenEnum.Separator:

            valid = token.typ == EnumToken.LiteralTokenType && (token as LiteralToken).val != '/';

            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'unexpected token',
                tokens
            } as ValidationSyntaxResult

            break;

        case ValidationTokenEnum.PropertyType:

            if ((syntax as ValidationPropertyToken).val == 'group-rule-body') {

                valid = [EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(token.typ);

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'token is not allowed as a child',
                    tokens
                } as ValidationSyntaxResult

                if (!valid) {

                    return result;
                }
            }

            //

            else if ('type-selector' == (syntax as ValidationPropertyToken).val) {

                valid = (token.typ == EnumToken.UniversalSelectorTokenType) ||
                    token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.NameSpaceAttributeTokenType &&
                        (
                            token.l == null || token.l.typ == EnumToken.IdenTokenType ||
                            (token.l.typ == EnumToken.LiteralTokenType && token.l.val == '*')) &&
                        token.r.typ == EnumToken.IdenTokenType
                    );

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('wq-name' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.NameSpaceAttributeTokenType &&
                    (token.l == null || token.l.typ == EnumToken.IdenTokenType || (token.l.typ == EnumToken.LiteralTokenType && token.l.val == '*')) &&
                    token.r.typ == EnumToken.IdenTokenType);

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if (EnumToken.UniversalSelectorTokenType == token.typ && 'subclass-selector' == (syntax as ValidationPropertyToken).val) {

                valid = true;

                result = {
                    valid: ValidationLevel.Valid,
                    matches: [token] as Token[],
                    node: null,
                    syntax,
                    error: '',
                    tokens
                } as ValidationSyntaxResult

            } else if ('attribute-selector' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.AttrTokenType && (token as AttrToken).chi.length > 0;

                if (valid) {

                    const children: Token[] = (token as AttrToken).chi.filter(t => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommaTokenType)

                    valid = children.length == 1 && [
                        EnumToken.IdenTokenType,
                        EnumToken.NameSpaceAttributeTokenType,
                        EnumToken.MatchExpressionTokenType
                    ].includes(children[0].typ);

                    if (valid && children[0].typ == EnumToken.MatchExpressionTokenType) {

                        const t: MatchExpressionToken = children[0] as MatchExpressionToken;
                        valid = [
                                EnumToken.IdenTokenType,
                                EnumToken.NameSpaceAttributeTokenType
                            ].includes(t.l.typ) &&
                            (t.op == null || (
                                [
                                    EnumToken.DelimTokenType, EnumToken.DashMatchTokenType,
                                    EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType,
                                    EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType
                                ].includes(t.op.typ) &&
                                t.r != null &&
                                [
                                    EnumToken.StringTokenType,
                                    EnumToken.IdenTokenType].includes(t.r.typ)));

                        if (valid && t.attr != null) {

                            const s: ValidationPipeToken = (getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, 'attr-modifier') as ValidationToken[])[0] as ValidationPipeToken;
                            valid = s.chi.some((l: ValidationToken[]) => l.some((r: ValidationToken): boolean => (r as ValidationStringToken).val == t.attr));
                        }
                    }
                }

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

                if (!valid) {

                    return result;
                }

            } else if ('combinator' == (syntax as ValidationPropertyToken).val) {

                valid = [
                    EnumToken.DescendantCombinatorTokenType,
                    EnumToken.SubsequentSiblingCombinatorTokenType,
                    EnumToken.NextSiblingCombinatorTokenType,
                    EnumToken.ChildCombinatorTokenType,
                    EnumToken.ColumnCombinatorTokenType
                ].includes(token.typ);

                if (valid) {

                    // @ts-ignore
                    const position: number = (context.tokens as Token[] | AstNode[]).indexOf(token as Token | AstNode);

                    if (root == null) {

                        valid = position > 0 && (context.tokens as Token[] | AstNode[])[position - 1]?.typ != EnumToken.CommaTokenType;
                    }
                }

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

                if (!valid) {

                    return result;
                }

            } else if ('ident-token' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.IdenTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('hex-color' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == 'hex';

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('resolution' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.ResolutionTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('angle' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.AngleTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('time' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.TimingFunctionTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('ident' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.IdenTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if (['id-selector', 'hash-token'].includes((syntax as ValidationPropertyToken).val)) {

                valid = token.typ == EnumToken.HashTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if (['integer', 'number'].includes((syntax as ValidationPropertyToken).val)) {

                // valid = token.typ == EnumToken.NumberTokenType;
                valid = token.typ == EnumToken.NumberTokenType && ('integer' != (syntax as ValidationPropertyToken).val || Number.isInteger(+token.val));

                if (valid && 'range' in syntax) {

                    const value: number = Number((token as NumberToken).val);
                    const range: number[] = (syntax as ValidationPropertyToken).range as number[];

                    valid = value >= range[0] && (range[1] == null || value <= range[1]);
                }

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('length' == (syntax as ValidationPropertyToken).val) {

                valid = isLength(token as DimensionToken) || (token.typ == EnumToken.NumberTokenType && token.val == '0');

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                }

            } else if ('percentage' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.PercentageTokenType || (token.typ == EnumToken.NumberTokenType && token.val == '0');

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('dashed-ident' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.DashedIdenTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('custom-ident' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.DashedIdenTokenType || token.typ == EnumToken.IdenTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('custom-property-name' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.DashedIdenTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('string' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.StringTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('declaration-value' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ != EnumToken.LiteralTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('url' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.UrlFunctionTokenType || token.typ == EnumToken.StringTokenType;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else if ('declaration' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.DeclarationNodeType && ((<AstDeclaration>token).nam.startsWith(('--')) || (<AstDeclaration>token).nam in config.declarations || (<AstDeclaration>token).nam in config.syntaxes);

                console.error({token, syntax});
                console.error(123);

                if (!valid) {

                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'unexpected token',
                        tokens
                    } as ValidationSyntaxResult
                } else if ((<AstDeclaration>token).nam.startsWith(('--'))) {

                    result = {
                        valid: ValidationLevel.Valid,
                        matches: [token] as Token[],
                        node: null,
                        syntax,
                        error: '',
                        tokens
                    } as ValidationSyntaxResult
                } else {

                    result = validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, (<AstDeclaration>token).nam) ?? getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (<AstDeclaration>token).nam) as ValidationToken[], (<AstDeclaration>token).val, token as AstNode, options, {
                        ...context,
                        tokens: null,
                        level: 0
                    });

                    console.error(12498);

                    if (result.valid == ValidationLevel.Valid && result.error.length == 0) {

                        tokens = result.tokens;
                    }
                }

            } else if ('class-selector' == (syntax as ValidationPropertyToken).val) {

                valid = EnumToken.ClassSelectorTokenType == token.typ || EnumToken.UniversalSelectorTokenType == token.typ;
                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult
            }
                // else if ('complex-selector' == (syntax as ValidationPropertyToken).val) {
                //
                //     result = validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntax as ValidationPropertyToken).val) as ValidationToken[], tokens, root as AstNode, options, context);
                //
            // }
            else if (['pseudo-element-selector', 'pseudo-class-selector'].includes((syntax as ValidationPropertyToken).val)) {

                valid = false;

                if (token.typ == EnumToken.PseudoClassTokenType) {

                    let val: string = token.val;

                    if (val == ':before' || val == ':after') {

                        val = ':' + val;
                    }

                    valid = val in config.selectors;

                    if (!valid && val.match(/^:?:-/) != null) {

                        const match: RegExpMatchArray = token.val.match(/^(:?:)(-[^-]+-)(.*)$/) as RegExpMatchArray;

                        if (match != null) {

                            valid = true;
                        }
                    }

                    result = {
                        valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                        matches: valid ? [token] as Token[] : [],
                        node: valid ? null : token,
                        syntax,
                        error: valid ? '' : 'invalid pseudo class',
                        tokens
                    } as ValidationSyntaxResult

                } else if (token.typ == EnumToken.PseudoClassFuncTokenType) {

                    let key: string = token.val in config.selectors ? token.val : token.val + '()';

                    valid = key in config.selectors;

                    if (!valid && token.val.match(/^:?:-/)) {

                        const match: RegExpMatchArray = token.val.match(/^(:?:)(-[^-]+-)(.*)$/) as RegExpMatchArray;

                        if (match != null) {

                            key = match[1] + match[3] in config.selectors ? match[1] + match[3] : match[1] + match[3] + '()';
                            valid = key in config.selectors;
                        }
                    }

                    const s: ValidationToken[] = getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, key) as ValidationToken[];

                    if (s != null) {

                        const r: ValidationPseudoClassFunctionToken = s[0] as ValidationPseudoClassFunctionToken;

                        if (r.typ != ValidationTokenEnum.PseudoClassFunctionToken) {

                            valid = false;
                        } else {

                            result = validateSyntax((s[0] as ValidationPseudoClassFunctionToken).chi, token.chi, root as AstNode, options, {
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
                    matches: valid ? [token] as Token[] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult
            }

                // <relative-selector-list>
            // <complex-selector-list>
            else if ('relative-selector' == (syntax as ValidationPropertyToken).val) {

                if (tokens.length == 1 && token.typ == EnumToken.NestingSelectorTokenType) {

                    return {
                        valid: ValidationLevel.Valid,
                        matches: [token] as Token[],
                        node: token,
                        syntax,
                        error: '',
                        tokens
                    } as ValidationSyntaxResult
                }

                result = validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntax as ValidationPropertyToken).val) as ValidationToken[], token.typ == EnumToken.NestingSelectorTokenType ? tokens.slice(1) : tokens, root as AstNode, options, context);
            }

                // <relative-selector-list>
            // <complex-selector-list>
            else if (['forgiving-selector-list', 'forgiving-relative-selector-list'].includes((syntax as ValidationPropertyToken).val)) {

                result = {tokens: tokens.slice(), ...validateSelector(tokens as Token[], options as ValidationOptions, root as AstNode)} as ValidationSyntaxResult;
            }

            // https://github.com/mdn/data/pull/186#issuecomment-369604537
            else if ((syntax as ValidationPropertyToken).val.endsWith('-token')) {

                const val: string = (syntax as ValidationPropertyToken).val;

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
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult
            } else if ('wq-name' == (syntax as ValidationPropertyToken).val) {

                valid = token.typ == EnumToken.IdenTokenType || (token.typ == EnumToken.NameSpaceAttributeTokenType &&
                    (token.l == null || token.l.typ == EnumToken.IdenTokenType || (token.l.typ == EnumToken.LiteralTokenType && token.l.val == '*')) &&
                    token.r.typ == EnumToken.IdenTokenType);

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: token,
                    syntax,
                    error: valid ? '' : 'unexpected token',
                    tokens
                } as ValidationSyntaxResult

            } else {

                const val = (syntax as ValidationPropertyToken).val as string;

                // https://github.com/mdn/data/pull/186#issuecomment-369604537
                if (val == 'any-value') {

                    return {
                        valid: ValidationLevel.Valid,
                        matches: [token] as Token[],
                        node: null,
                        syntax,
                        error: '',
                        tokens
                    } as ValidationSyntaxResult

                } else if (val in config.declarations || val in config.syntaxes) {

                    result = validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, val) ?? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, val) as ValidationToken[], tokens, root as AstNode, options, context);

                } else {

                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: token,
                        syntax,
                        error: 'unexpected token',
                        tokens
                    } as ValidationSyntaxResult
                }
            }

            break;

        case ValidationTokenEnum.Parens:
        case ValidationTokenEnum.Function:

            if ((syntax as ValidationParensToken).typ == ValidationTokenEnum.Parens) {

                valid = token.typ == EnumToken.ParensTokenType;

            } else {

                valid = 'chi' in token && 'val' in token &&
                    (token as FunctionToken).val.localeCompare((syntax as ValidationFunctionToken).val, 'en', {sensitivity: 'base'}) == 0;
            }

            result = !valid ?
                {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax,
                    error: 'unexpected token',
                    tokens
                } as ValidationSyntaxResult : validateSyntax((syntax as ValidationFunctionToken).chi, (token as FunctionToken).chi, root as AstNode, options, {
                    ...context,
                    tokens: null,
                    level: context.level + 1
                });

            break;

        case ValidationTokenEnum.ValidationFunctionDefinition:

            valid = 'val' in token && 'chi' in token;

            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: '',
                tokens
            } as ValidationSyntaxResult;

            if (result.valid == ValidationLevel.Valid) {

                valid = (token as FunctionToken).val.localeCompare((syntax as ValidationFunctionDefinitionToken).val, 'en', {sensitivity: 'base'}) == 0;

                result = {
                    valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                    matches: valid ? [token] as Token[] : [],
                    node: valid ? null : token,
                    error: '',
                    syntax,
                    tokens
                } as ValidationSyntaxResult;

                if (result.valid == ValidationLevel.Valid) {

                    const s: ValidationToken[] = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntax as ValidationFunctionDefinitionToken).val + '()') as ValidationToken[]; // config[ValidationSyntaxGroupEnum.Syntaxes][(syntax as ValidationFunctionDefinitionToken).val + '()'] as ValidationSyntaxNode;
                    result = validateSyntax(s as ValidationToken[], tokens, root as AstNode, options, context);
                }
            }

            break;

        case ValidationTokenEnum.Bracket:

            result = validateSyntax((syntax as ValidationBracketToken).chi, tokens, root as AstNode, options, context);
            break;

        case ValidationTokenEnum.PipeToken:

            for (const lines of (syntax as ValidationPipeToken).chi) {

                result = validateSyntax(lines, tokens, root as AstNode, options, context);

                if (result.valid == ValidationLevel.Valid) {

                    break;
                }
            }

            break;

        case ValidationTokenEnum.AmpersandToken:

            children = [...(syntax as ValidationAmpersandToken).l.slice(), ...(syntax as ValidationAmpersandToken).r.slice()] as ValidationToken[];
            matches = [] as ValidationToken[];
            queue = [] as ValidationToken[];

            let m = [] as Token[];

            for (let j = 0; j < children.length; j++) {

                const res: ValidationSyntaxResult = validateSyntax([children[j]], tokens, root as AstNode, options, context);

                // @ts-ignore
                if (res.valid == ValidationLevel.Valid) {

                    m.push(...res.matches as Token[]);

                    matches.push(...children.splice(j, 1) as ValidationToken[]);
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
            } as ValidationSyntaxResult;

            break;

        case ValidationTokenEnum.ColumnToken:

            children = [...(syntax as ValidationColumnToken).l.slice(), ...(syntax as ValidationColumnToken).r.slice()] as ValidationToken[];
            matches = [] as ValidationToken[];
            queue = [] as ValidationToken[];

            while ((child = children.shift() as ValidationColumnToken)) {

                const res: ValidationSyntaxResult = validateSyntax([child], tokens, root as AstNode, options, context);

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

                } else {

                    queue.push(child);
                }
            }

            valid = matches.length > 0;
            result = {

                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'expecting token',
                tokens
            } as ValidationSyntaxResult

            break;

        case ValidationTokenEnum.StringToken:

            valid = token.typ == EnumToken.StringTokenType && (syntax as ValidationStringToken).val.slice(1, -1) == (token as StringToken).val.slice(1, -1);

            return {

                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'expecting token',
                tokens
            } as ValidationSyntaxResult

            break;

        case ValidationTokenEnum.PseudoClassFunctionToken:

            valid = token.typ == EnumToken.PseudoClassFuncTokenType;

            if (valid) {

                let key: string = (token as PseudoClassFunctionToken).val in config.selectors ? (token as PseudoClassFunctionToken).val : (token as PseudoClassFunctionToken).val + '()';

                const s = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, key) as ValidationToken[];

                valid = s != null && validateSyntax(s, (token as PseudoClassFunctionToken).chi, root as AstNode, options, {
                    ...context,
                    tokens: null,
                    level: context.level + 1
                }).valid == ValidationLevel.Valid;
            }

            result = {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                matches: valid ? [token] as Token[] : [],
                node: valid ? null : token,
                syntax,
                error: valid ? '' : 'invalid token',
                tokens
            } as ValidationSyntaxResult

            break;

        default:

            // console.error({syntax, token});
            // throw new Error('not implemented: ' + JSON.stringify({syntax}, null, 1));
            console.error('syntax not implemented: ' + JSON.stringify({syntax}, null, 1));
    }

    // @ts-ignore
    return result as ValidationSyntaxResult;
}