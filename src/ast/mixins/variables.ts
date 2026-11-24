/**
 * variables of the mixins and the custom functions: the var() functions that reference the private variables (mixin
 * arguments, `@private`, local variables of a custom function, ...) are replaced by a copy of the variable value.
 *
 * https://drafts.csswg.org/css-mixins-1/
 *
 * @module
 * @internal
 */
import type { AstNode, ParserOptions, Token } from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import type { AstArena } from "../arena.ts";
import { renderValue } from "../../printer/render.ts";
import { parseDeclarations } from "../../parser/parse.ts";
import { parseSyntax } from "../../validation/parser/parse.ts";
import { createValidationContext, matchAllSyntaxes } from "../../validation/match.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { SourceFile } from "../../parser/source.ts";

/**
 * evaluate the custom function calls: `--fn(1px)`
 */
export interface FunctionEvaluator {
    /**
     * result of a custom function call
     * - a string: the result that replaces the call
     * - undefined: the call is not evaluated
     * - null: the result is invalid
     * @param arena
     * @param token call token
     * @param caller scope of the call: the arguments are evaluated in this scope
     * @param descendant see {@link VariableScope.lookup}
     */
    call(arena: AstArena, token: Token, caller: VariableScope, descendant: boolean): string | null | undefined;
}

/**
 * variables visible from a value
 */
export interface VariableScope {
    /**
     * find a variable
     * - the variable entry
     * - {@link UNDEFINED} if the variable is a private variable that is not visible
     * - null if the variable is not a private variable: the var() function is evaluated by the browser
     * @param name
     * @param descendant the variable is referenced by a descendant of the element a mixin is applied to
     */
    lookup(name: string, descendant: boolean): VariableEntry | typeof UNDEFINED | null;

    /**
     * the custom function calls are evaluated. null when they are not evaluated
     */
    readonly functions: FunctionEvaluator | null;

    /**
     * the variables of the call site that are visible from the body of a custom function. the scope itself when
     * undefined
     */
    readonly dynamic?: VariableScope | null;

    /**
     * the variables visible from the arguments of a custom function call. the scope itself when undefined
     */
    readonly arguments?: VariableScope | null;
}

/**
 * variables of a style rule: the custom properties declared by the rule
 */
export class RuleScope implements VariableScope {
    /**
     * @param properties custom properties of the rule
     * @param functions
     * @param dynamic the variables visible from the custom functions called from the rule, see
     * {@link VariableScope.dynamic}
     */
    constructor(
        public readonly properties: Map<string, VariableEntry>,
        public readonly functions: FunctionEvaluator | null = null,
        public readonly dynamic: VariableScope | null = null,
    ) {}

    /**
     * the arguments see the variables of the call site
     */
    get arguments(): VariableScope | null {
        return this.dynamic;
    }

    lookup(name: string): VariableEntry | null {
        return this.properties.get(name) ?? null;
    }
}

/**
 * at-rules that may contain mixin and custom function definitions: the conditional group rules and the cascade layers
 */
export const scopeRules: string[] = ["media", "supports", "container", "layer", "when", "else"];

/**
 * source of the validation errors of the parameter types
 */
const validationSource: SourceFile = new SourceFile("", [], "");


/**
 * parsed syntaxes of the parameter types
 */
const syntaxes: Map<string, ValidationToken[] | null> = new Map();


/**
 * render options of the tokens: the values are parsed again, the colors are not converted
 */
const renderOptions = { convertColor: false };


/**
 * returned by {@link VariableScope.lookup} when the variable is a private variable that is not visible (or not
 * defined):
 * the fallback of var() is used, otherwise the value is not valid: it is left as is
 */
export const UNDEFINED: unique symbol = Symbol("undefined");


/**
 * private variable
 */
export interface VariableEntry {
    /**
     * value tokens. null when the value is already resolved (see {@link text})
     */
    tokens: Token[] | null;

    /**
     * resolved value. null when the value is invalid (guaranteed-invalid value), undefined when it is not resolved yet
     */
    text?: string | null;

    /**
     * resolved value in the descendants of the element the mixin is applied to: the typed mixin arguments are the
     * values computed on the element
     */
    descendantText?: string | null;

    /**
     * the value is being resolved: dependency cycle detection
     */
    resolving?: boolean;

    /**
     * scope used to resolve the var() functions of the value
     */
    scope: VariableScope | null;
}


/**
 * mixin or custom function parameter
 */
export interface Parameter {
    name: string;

    /**
     * syntax of the parameter type: `<color>`, `<length> | auto`. null when the parameter is not typed
     */
    syntax: string | null;

    /**
     * default value tokens
     */
    defaultValue: Token[] | null;
}


/**
 * true if the token is a whitespace or a comment
 * @param arena
 * @param token
 */
export function isBlank(arena: AstArena, token: Token): boolean {
    const typ: EnumToken = arena.dataTypes[token];

    return typ === EnumToken.WhitespaceTokenType || typ === EnumToken.CommentTokenType;
}

/**
 * true if the token is a comment
 * @param arena
 * @param token
 */
export function isComment(arena: AstArena, token: Token): boolean {
    return arena.dataTypes[token] === EnumToken.CommentTokenType;
}

/**
 * remove the leading and trailing whitespace and comments
 * @param arena
 * @param tokens
 */
export function trim(arena: AstArena, tokens: Token[]): Token[] {
    let start: number = 0;
    let end: number = tokens.length;

    while (start < end && isBlank(arena, tokens[start])) {
        start++;
    }

    while (end > start && isBlank(arena, tokens[end - 1])) {
        end--;
    }

    return start === 0 && end === tokens.length ? tokens : tokens.slice(start, end);
}


/**
 * remove the curly braces that wrap a comma containing value: `{a, b}` -> `a, b`
 * @param arena
 * @param tokens trimmed tokens
 */
export function unwrap(arena: AstArena, tokens: Token[]): Token[] {
    // the curly braces of a declaration value: `--fn({a, b})`
    if (tokens.length === 1 && arena.dataTypes[tokens[0]] === EnumToken.WrappedValuesTokenType) {
        return trim(arena, arena.tokens(tokens[0]));
    }

    if (
        tokens.length < 2 ||
        arena.dataTypes[tokens[0]] !== EnumToken.BlockStartTokenType ||
        arena.dataTypes[tokens[tokens.length - 1]] !== EnumToken.BlockEndTokenType
    ) {
        return tokens;
    }

    let depth: number = 0;

    for (let i = 0; i < tokens.length; i++) {
        if (arena.dataTypes[tokens[i]] === EnumToken.BlockStartTokenType) {
            depth++;
        } else if (arena.dataTypes[tokens[i]] === EnumToken.BlockEndTokenType) {
            depth--;

            // the first brace is closed before the end: `{a} b {c}`
            if (depth === 0 && i < tokens.length - 1) {
                return tokens;
            }
        }
    }

    return trim(arena, tokens.slice(1, -1));
}


/**
 * split a list of tokens on the commas that are not wrapped in curly braces
 * @param arena
 * @param tokens
 */
export function splitArguments(arena: AstArena, tokens: Token[]): Token[][] {
    const result: Token[][] = [[]];
    let depth: number = 0;

    for (const token of tokens) {
        const typ: EnumToken = arena.dataTypes[token];

        // the comments are ignored
        if (isComment(arena, token)) {
            continue;
        }

        if (typ === EnumToken.BlockStartTokenType) {
            depth++;
        } else if (typ === EnumToken.BlockEndTokenType && depth > 0) {
            depth--;
        } else if (typ === EnumToken.CommaTokenType && depth === 0) {
            result.push([]);
            continue;
        }

        result[result.length - 1].push(token);
    }

    return result.map((part: Token[]): Token[] => trim(arena, part));
}


/**
 * first token that is not a whitespace or a comment
 * @param arena
 * @param tokens
 */
export function firstToken(arena: AstArena, tokens: Token[]): Token | null {
    for (const token of tokens) {
        if (!isBlank(arena, token)) {
            return token;
        }
    }

    return null;
}


/**
 * true if the token is a var() function
 * @param arena
 * @param token
 */
export function isVar(arena: AstArena, token: Token): boolean {
    return (
        arena.dataTypes[token] === EnumToken.WildCardFunctionTokenType &&
        arena.stringEqualsIgnoreCase(arena.stringValue[token], "var")
    );
}


/**
 * true if a token or one of its descendants is a var() function, or a custom function call (`--fn()`)
 * @param arena
 * @param token
 * @param functions the custom function calls are evaluated
 */
export function hasReference(arena: AstArena, token: Token, functions: boolean = false): boolean {
    if (isVar(arena, token) || (functions && arena.dataTypes[token] === EnumToken.CustomFunctionTokenType)) {
        return true;
    }

    if (arena.firstToken[token] === 0 && arena.firstChild[token] === 0) {
        return false;
    }

    for (const child of arena.subTokens(token)) {
        if (hasReference(arena, child, functions)) {
            return true;
        }
    }

    return false;
}


/**
 * render tokens
 * @param arena
 * @param tokens
 */
export function render(arena: AstArena, tokens: Token[]): string {
    let result: string = "";

    for (const token of tokens) {
        result += renderValue(arena, token, renderOptions);
    }

    return result;
}


/**
 * render tokens, the var() functions that reference a private variable are replaced by a copy of the variable value,
 * the custom function calls are replaced by their result when the scope evaluates them.
 * null is returned when a variable is invalid and var() has no fallback: the value is not valid, it is left as is
 * @param arena
 * @param tokens
 * @param scope
 * @param descendant the tokens are used by a descendant of the element the mixin is applied to
 */
export function substitute(arena: AstArena, tokens: Token[], scope: VariableScope, descendant: boolean): string | null {
    const functions: boolean = scope.functions != null;

    if (!tokens.some((token: Token): boolean => hasReference(arena, token, functions))) {
        return render(arena, tokens);
    }

    // the copies of the tokens are modified: the var() functions are replaced by their value
    const list: Token = arena.createList(
        EnumToken.ListTokenType,
        tokens.map((token: Token): Token => arena.clone(token, true)),
    );

    if (!replaceVariables(arena, list, scope, descendant)) {
        return null;
    }

    return render(arena, arena.tokens(list));
}


/**
 * replace the var() functions that reference a private variable with literal tokens holding the value
 * @param arena
 * @param parent
 * @param scope
 * @param descendant
 * @returns false when the value is not valid
 */
export function replaceVariables(arena: AstArena, parent: Token, scope: VariableScope, descendant: boolean): boolean {
    for (const token of arena.subTokens(parent)) {
        if (isVar(arena, token)) {
            const value: string | null | undefined = substituteVariable(arena, token, scope, descendant);

            if (value === null) {
                return false;
            }

            if (value !== undefined) {
                arena.replaceToken(token, arena.createToken(EnumToken.LiteralTokenType, value));
            }
        } else if (scope.functions != null && arena.dataTypes[token] === EnumToken.CustomFunctionTokenType) {
            // custom function call: `--fn(1px)`
            const value: string | null | undefined = scope.functions.call(arena, token, scope, descendant);

            if (value === null) {
                return false;
            }

            if (value !== undefined) {
                arena.replaceToken(token, arena.createToken(EnumToken.LiteralTokenType, value));
            } else if (!replaceVariables(arena, token, scope, descendant)) {
                // the call is not evaluated: its arguments may reference variables
                return false;
            }
        } else if (
            (arena.firstToken[token] !== 0 || arena.firstChild[token] !== 0) &&
            !replaceVariables(arena, token, scope, descendant)
        ) {
            return false;
        }
    }

    return true;
}


/**
 * value of a var() function
 * - a string: the value that replaces the var() function
 * - undefined: the var() function is not modified, it does not reference a private variable
 * - null: the variable is invalid and var() has no fallback
 * @param arena
 * @param token
 * @param scope
 * @param descendant
 */
export function substituteVariable(
    arena: AstArena,
    token: Token,
    scope: VariableScope,
    descendant: boolean,
): string | null | undefined {
    const children: Token[] = arena.tokens(token);
    const nameToken: Token | null = firstToken(arena, children);

    if (nameToken == null || arena.dataTypes[nameToken] !== EnumToken.DashedIdenTokenType) {
        return undefined;
    }

    const name: string = arena.resolveString(arena.stringValue[nameToken]);
    const comma: number = children.findIndex(
        (child: Token): boolean => arena.dataTypes[child] === EnumToken.CommaTokenType,
    );
    const fallback: Token[] | null = comma === -1 ? null : trim(arena, children.slice(comma + 1));
    const found: VariableEntry | typeof UNDEFINED | null = scope.lookup(name, descendant);

    if (found === null) {
        // not a private variable: the fallback may reference private variables `var(--color, var(--private))`
        if (
            fallback != null &&
            fallback.some((child: Token): boolean => hasReference(arena, child, scope.functions != null))
        ) {
            const value: string | null = substitute(arena, fallback, scope, descendant);

            // an invalid fallback is equivalent to no fallback
            return value === null ? `var(${name})` : `var(${name},${value})`;
        }

        return undefined;
    }

    if (found !== UNDEFINED) {
        const value: string | null = resolve(arena, found, descendant);

        if (value !== null) {
            return value;
        }
    }

    // the variable is not defined or is invalid
    return fallback == null ? null : substitute(arena, fallback, scope, descendant);
}


/**
 * resolved value of a variable. null when the value is invalid
 * @param arena
 * @param entry
 * @param descendant the variable is used by a descendant of the element the mixin is applied to: the typed arguments
 * it references are the values computed on the element, see {@link TypedArgument}
 */
export function resolve(arena: AstArena, entry: VariableEntry, descendant: boolean): string | null {
    // the value is already resolved: the custom properties of the rule, the arguments
    if (entry.tokens == null || entry.scope == null) {
        return entry.text ?? null;
    }

    const key: "text" | "descendantText" = descendant ? "descendantText" : "text";

    if (entry[key] !== undefined) {
        return entry[key]!;
    }

    // dependency cycle
    if (entry.resolving) {
        return null;
    }

    entry.resolving = true;
    entry[key] = substitute(arena, entry.tokens, entry.scope, descendant);
    entry.resolving = false;

    return entry[key]!;
}


/**
 * value tokens of a declaration, without `!important`
 * @param arena
 * @param declaration
 */
export function declarationValue(arena: AstArena, declaration: AstNode): Token[] {
    const tokens: Token[] = trim(arena, arena.tokens(declaration));

    if (tokens.length > 0 && arena.dataTypes[tokens[tokens.length - 1]] === EnumToken.ImportantTokenType) {
        return trim(arena, tokens.slice(0, -1));
    }

    return tokens;
}


/**
 * true if the node is an at-rule with the given name
 * @param arena
 * @param node
 * @param name
 */
export function isAtRule(arena: AstArena, node: AstNode, name: string): boolean {
    return arena.dataTypes[node] === EnumToken.AtRuleNodeType && arena.stringEquals(arena.name[node], name);
}


/**
 * true if the node is an at-rule with a block that may contain mixin definitions, see {@link scopeRules}. the name of
 * the at-rule is not created
 * @param arena
 * @param node
 */
export function isScopeRule(arena: AstArena, node: AstNode): boolean {
    if (arena.dataTypes[node] !== EnumToken.AtRuleNodeType || !(arena.flags[node] & EnumAstNodeStatus.HasChildren)) {
        return false;
    }

    for (const name of scopeRules) {
        if (arena.stringEquals(arena.name[node], name)) {
            return true;
        }
    }

    return false;
}


/**
 * true if the node is a custom property declaration
 * @param arena
 * @param node
 */
export function isCustomProperty(arena: AstArena, node: AstNode): boolean {
    return arena.dataTypes[node] === EnumToken.DeclarationNodeType && arena.stringStartsWith(arena.name[node], "--");
}


/**
 * custom properties declared by the children of a node
 * - the `!important` declarations override the other declarations
 * - the last declaration wins
 * @param arena
 * @param node
 * @param result
 */
export function collectProperties(arena: AstArena, node: AstNode, result: Map<string, VariableEntry>): void {
    const important: Set<string> = new Set();
    const properties: Map<string, VariableEntry> = new Map();

    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (!isCustomProperty(arena, child)) {
            continue;
        }

        const name: string = arena.resolveString(arena.name[child]);
        const isImportant: boolean = (arena.flags[child] & EnumAstNodeStatus.ImportantDeclaration) !== 0;

        if (important.has(name) && !isImportant) {
            continue;
        }

        if (isImportant) {
            important.add(name);
        }

        properties.set(name, { tokens: null, text: render(arena, declarationValue(arena, child)), scope: null });
    }

    for (const [name, entry] of properties) {
        // the declarations of the inner nodes override the declarations of the outer nodes
        if (!result.has(name)) {
            result.set(name, entry);
        }
    }
}


/**
 * syntax of a parameter type: `<color>` -> `<color>`, `type(<length> | auto)` -> `<length> | auto`.
 * null when the parameter is not typed or accepts any value
 * @param arena
 * @param tokens tokens between the parameter name and the default value
 */
export function parameterSyntax(arena: AstArena, tokens: Token[]): string | null {
    const type: Token[] = trim(arena, tokens.filter((token: Token): boolean => !isComment(arena, token)));

    if (type.length === 0) {
        return null;
    }

    let syntax: string;

    if (
        type.length === 1 &&
        arena.dataTypes[type[0]] === EnumToken.FunctionTokenType &&
        arena.stringEqualsIgnoreCase(arena.stringValue[type[0]], "type")
    ) {
        syntax = render(arena, trim(arena, arena.tokens(type[0]))).trim();
    } else {
        syntax = render(arena, type).trim();
    }

    return syntax === "" || syntax === "*" ? null : syntax;
}


/**
 * the values that are resolved by the browser: the variables, the environment variables, the conditions and the math
 * functions (their type depends on the values they compute)
 */
const unresolvedValue: RegExp = new RegExp(
    "(^|[^\\w-])(" +
        [
            "var", "env", "attr", "if",
            "calc", "min", "max", "clamp", "round", "mod", "rem", "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
            "pow", "sqrt", "hypot", "log", "exp", "abs", "sign", "calc-size", "progress", "random",
        ].join("|") +
        ")\\(",
    "i",
);

/**
 * true if a value matches the type of a parameter. a value that is resolved by the browser is not checked: a variable
 * (`var()`, `env()`, ...) or a math function (`calc()`, `min()`, ...)
 * @param arena
 * @param syntax
 * @param value
 * @param options
 */
export function matchesType(arena: AstArena, syntax: string | null, value: string, options: ParserOptions): boolean {
    if (syntax == null || unresolvedValue.test(value)) {
        return true;
    }

    if (!syntaxes.has(syntax)) {
        let parsed: ValidationToken[] | null = null;

        try {
            parsed = parseSyntax(syntax);
        } catch (e) {
            // the type is not supported: the values are not checked
        }

        syntaxes.set(syntax, parsed == null || parsed.length === 0 ? null : parsed);
    }

    const parsed: ValidationToken[] | null = syntaxes.get(syntax)!;

    if (parsed == null) {
        return true;
    }

    // the value is parsed as a declaration value: the math functions are parsed into expressions
    const declaration: AstNode | undefined = parseDeclarations("--value:" + value, arena).nodes.find(
        (node: AstNode): boolean => arena.dataTypes[node] === EnumToken.DeclarationNodeType,
    );

    if (declaration == null) {
        return false;
    }

    const tokens: Token[] = arena.tokens(declaration);

    return matchAllSyntaxes(arena, parsed, createValidationContext(arena, tokens), {
        ...options,
        source: validationSource,
    }).success;
}


/**
 * custom properties of the rule the `@apply` rule belongs to: the declarations of the nearest style rule and of the
 * at-rules between them. null when the `@apply` rule is not inside a style rule
 * @param arena
 * @param node
 */
export function ruleProperties(arena: AstArena, node: AstNode): Map<string, VariableEntry> | null {
    const result: Map<string, VariableEntry> = new Map();
    let parent: AstNode = arena.parents[node];

    while (parent !== 0) {
        if (arena.dataTypes[parent] === EnumToken.AtRuleNodeType) {
            collectProperties(arena, parent, result);
        } else if (arena.dataTypes[parent] === EnumToken.RuleNodeType) {
            collectProperties(arena, parent, result);
            return result;
        } else {
            return null;
        }

        parent = arena.parents[parent];
    }

    return null;
}

/**
 * parse the parameters of a mixin or a custom function: `--name(--a, --b <color>: red)`. null when the parameters are
 * not valid. the comments are ignored
 * @param arena
 * @param reference function token
 */
export function parseParameters(arena: AstArena, reference: Token): Parameter[] | null {
    const parameters: Parameter[] = [];
    const children: Token[] = trim(arena, arena.tokens(reference));

    if (children.every((token: Token): boolean => isBlank(arena, token))) {
        return parameters;
    }

    const list: Token[][] = splitArguments(arena, children);

    // trailing comma: `@mixin --name(--a, --b,)`
    if (list.length > 1 && list[list.length - 1].length === 0) {
        list.pop();
    }

    for (const parameter of list) {
        if (parameter.length === 0 || arena.dataTypes[parameter[0]] !== EnumToken.DashedIdenTokenType) {
            return null;
        }

        // <dashed-ident> <css-type>? [ : <default-value> ]?
        const colon: number = parameter.findIndex(
            (token: Token): boolean => arena.dataTypes[token] === EnumToken.ColonTokenType,
        );
        const name: string = arena.resolveString(arena.stringValue[parameter[0]]);

        // the parameters are unique
        if (parameters.some((parameter: Parameter): boolean => parameter.name === name)) {
            return null;
        }

        parameters.push({
            name,
            syntax: parameterSyntax(arena, parameter.slice(1, colon === -1 ? parameter.length : colon)),
            defaultValue: colon === -1 ? null : unwrap(arena, trim(arena, parameter.slice(colon + 1))),
        });
    }

    return parameters;
}

/**
 * arguments of a mixin or a custom function call: the comments and the whitespace are ignored, the curly braces are
 * removed. `--name(/* comment *\/)` has no argument
 * @param arena
 * @param reference function token
 */
export function parseArguments(arena: AstArena, reference: Token): Token[][] {
    const children: Token[] = arena.tokens(reference);

    return children.every((token: Token): boolean => isBlank(arena, token))
        ? []
        : splitArguments(arena, children).map((arg: Token[]): Token[] => unwrap(arena, arg));
}

/**
 * the definitions visible from a reference (`@apply`, custom function call): a definition is visible in its parent
 * (the stylesheet, a rule or an at-rule) and in the descendants of its parent. the definitions of the innermost scope
 * that defines the name are returned: they hide the definitions of the outer scopes
 * @param arena
 * @param definitions the definitions of the name
 * @param site the reference
 */
export function resolveDefinitions<T extends { node: AstNode }>(
    arena: AstArena,
    definitions: T[] | undefined,
    site: AstNode,
): T[] {
    if (definitions == null || definitions.length === 0) {
        return [];
    }

    for (let scope: AstNode = arena.parents[site]; scope !== 0; scope = arena.parents[scope]) {
        const result: T[] = definitions.filter((definition: T): boolean => arena.parents[definition.node] === scope);

        if (result.length > 0) {
            return result;
        }
    }

    return [];
}

/**
 * name of a mixin or a custom function definition: `@mixin --name(...)`, `@function --name(...)`
 * @param arena
 * @param node
 */
export function definitionName(arena: AstArena, node: AstNode): string | null {
    const reference: Token | null = firstToken(arena, arena.tokens(node));

    return reference == null ? null : arena.resolveString(arena.stringValue[reference]);
}

/**
 * collect the mixin or custom function definitions of a stylesheet, a conditional group rule or a cascade layer
 * @param arena
 * @param node
 * @param name at-rule name: `mixin`, `function`
 * @param parse parse a definition. null when the definition is not valid
 * @param definitions valid definitions by name, in document order
 * @param invalid the definitions that are not valid: they are ignored
 */
export function collectDefinitions<T>(
    arena: AstArena,
    node: AstNode,
    name: string,
    parse: (arena: AstArena, node: AstNode) => T | null,
    definitions: Map<string, T[]>,
    invalid: AstNode[],
): Map<string, T[]> {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (isAtRule(arena, child, name)) {
            const key: string | null = definitionName(arena, child);
            const definition: T | null = key == null ? null : parse(arena, child);

            if (definition == null) {
                invalid.push(child);
                continue;
            }

            if (!definitions.has(key!)) {
                definitions.set(key!, []);
            }

            definitions.get(key!)!.push(definition);
        } else if (isScopeRule(arena, child)) {
            collectDefinitions(arena, child, name, parse, definitions, invalid);
        }
    }

    return definitions;
}

/**
 * the mixin or custom function at-rules of a stylesheet, with the scope they are defined in
 * @param arena
 * @param node
 * @param name at-rule name: `mixin`, `function`
 * @param result
 */
export function collectAtRules(arena: AstArena, node: AstNode, name: string, result: AstNode[] = []): AstNode[] {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (isAtRule(arena, child, name)) {
            result.push(child);
        } else if (isScopeRule(arena, child)) {
            collectAtRules(arena, child, name, result);
        }
    }

    return result;
}

/**
 * finalize the mixin or custom function definitions once they are evaluated
 * - the evaluated definitions are dropped and replaced with a comment, unless `keep` is set
 * - the definitions that are kept are reduced to their last definition in the same scope
 * - the definitions that are not valid are left as is
 * @param arena
 * @param ast
 * @param name at-rule name: `mixin`, `function`
 * @param kept the definitions that are kept
 * @param keep keep the evaluated definitions
 * @param invalid the definitions that are not valid
 */
export function finalizeDefinitions(
    arena: AstArena,
    ast: AstNode,
    name: string,
    kept: Set<AstNode>,
    keep: boolean,
    invalid: AstNode[],
): void {
    // the last definition in the same scope
    const last: Map<AstNode, Map<string, AstNode>> = new Map();

    for (const node of collectAtRules(arena, ast, name)) {
        const key: string | null = definitionName(arena, node);

        if (key == null || invalid.includes(node)) {
            continue;
        }

        if (!kept.has(node)) {
            if (!keep) {
                // the comments of the prelude are removed: the comments are not nested
                const comment: AstNode = arena.createComment(
                    EnumToken.CommentTokenType,
                    `/* @${name} ${arena
                        .resolveString(arena.stringValue[node])
                        .replace(/\/\*[\s\S]*?\*\//g, "")
                        .replace(/\(\s+/g, "(")
                        .replace(/\s+([),])/g, "$1")
                        .trim()} */`,
                );

                arena.copyLocation(comment, node);
                arena.replaceChild(node, comment);
            }

            continue;
        }

        const parent: AstNode = arena.parents[node];

        if (!last.has(parent)) {
            last.set(parent, new Map());
        }

        const previous: AstNode | undefined = last.get(parent)!.get(key);

        // the definition is defined only once in the same scope: the last definition wins
        if (previous !== undefined) {
            arena.detach(previous);
        }

        last.get(parent)!.set(key, node);
    }
}
