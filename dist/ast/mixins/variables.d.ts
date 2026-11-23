/**
 * variables of the mixins and the custom functions: the var() functions that reference the private variables (mixin
 * arguments, `@private`, local variables of a custom function, ...) are replaced by a copy of the variable value.
 *
 * https://drafts.csswg.org/css-mixins-1/
 *
 * @module
 * @internal
 */
import type { AstNode, ParserOptions, Token } from "../../../@types/index.js";
import type { AstArena } from "../arena.ts";
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
export declare class RuleScope implements VariableScope {
    readonly properties: Map<string, VariableEntry>;
    readonly functions: FunctionEvaluator | null;
    readonly dynamic: VariableScope | null;
    /**
     * @param properties custom properties of the rule
     * @param functions
     * @param dynamic the variables visible from the custom functions called from the rule, see
     * {@link VariableScope.dynamic}
     */
    constructor(properties: Map<string, VariableEntry>, functions?: FunctionEvaluator | null, dynamic?: VariableScope | null);
    /**
     * the arguments see the variables of the call site
     */
    get arguments(): VariableScope | null;
    lookup(name: string): VariableEntry | null;
}
/**
 * at-rules that may contain mixin and custom function definitions: the conditional group rules and the cascade layers
 */
export declare const scopeRules: string[];
/**
 * returned by {@link VariableScope.lookup} when the variable is a private variable that is not visible (or not
 * defined):
 * the fallback of var() is used, otherwise the value is not valid: it is left as is
 */
export declare const UNDEFINED: unique symbol;
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
export declare function isBlank(arena: AstArena, token: Token): boolean;
/**
 * true if the token is a comment
 * @param arena
 * @param token
 */
export declare function isComment(arena: AstArena, token: Token): boolean;
/**
 * remove the leading and trailing whitespace and comments
 * @param arena
 * @param tokens
 */
export declare function trim(arena: AstArena, tokens: Token[]): Token[];
/**
 * remove the curly braces that wrap a comma containing value: `{a, b}` -> `a, b`
 * @param arena
 * @param tokens trimmed tokens
 */
export declare function unwrap(arena: AstArena, tokens: Token[]): Token[];
/**
 * split a list of tokens on the commas that are not wrapped in curly braces
 * @param arena
 * @param tokens
 */
export declare function splitArguments(arena: AstArena, tokens: Token[]): Token[][];
/**
 * first token that is not a whitespace or a comment
 * @param arena
 * @param tokens
 */
export declare function firstToken(arena: AstArena, tokens: Token[]): Token | null;
/**
 * true if the token is a var() function
 * @param arena
 * @param token
 */
export declare function isVar(arena: AstArena, token: Token): boolean;
/**
 * true if a token or one of its descendants is a var() function, or a custom function call (`--fn()`)
 * @param arena
 * @param token
 * @param functions the custom function calls are evaluated
 */
export declare function hasReference(arena: AstArena, token: Token, functions?: boolean): boolean;
/**
 * render tokens
 * @param arena
 * @param tokens
 */
export declare function render(arena: AstArena, tokens: Token[]): string;
/**
 * render tokens, the var() functions that reference a private variable are replaced by a copy of the variable value,
 * the custom function calls are replaced by their result when the scope evaluates them.
 * null is returned when a variable is invalid and var() has no fallback: the value is not valid, it is left as is
 * @param arena
 * @param tokens
 * @param scope
 * @param descendant the tokens are used by a descendant of the element the mixin is applied to
 */
export declare function substitute(arena: AstArena, tokens: Token[], scope: VariableScope, descendant: boolean): string | null;
/**
 * replace the var() functions that reference a private variable with literal tokens holding the value
 * @param arena
 * @param parent
 * @param scope
 * @param descendant
 * @returns false when the value is not valid
 */
export declare function replaceVariables(arena: AstArena, parent: Token, scope: VariableScope, descendant: boolean): boolean;
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
export declare function substituteVariable(arena: AstArena, token: Token, scope: VariableScope, descendant: boolean): string | null | undefined;
/**
 * resolved value of a variable. null when the value is invalid
 * @param arena
 * @param entry
 * @param descendant the variable is used by a descendant of the element the mixin is applied to: the typed arguments
 * it references are the values computed on the element, see {@link TypedArgument}
 */
export declare function resolve(arena: AstArena, entry: VariableEntry, descendant: boolean): string | null;
/**
 * value tokens of a declaration, without `!important`
 * @param arena
 * @param declaration
 */
export declare function declarationValue(arena: AstArena, declaration: AstNode): Token[];
/**
 * true if the node is an at-rule with the given name
 * @param arena
 * @param node
 * @param name
 */
export declare function isAtRule(arena: AstArena, node: AstNode, name: string): boolean;
/**
 * true if the node is an at-rule with a block that may contain mixin definitions, see {@link scopeRules}. the name of
 * the at-rule is not created
 * @param arena
 * @param node
 */
export declare function isScopeRule(arena: AstArena, node: AstNode): boolean;
/**
 * true if the node is a custom property declaration
 * @param arena
 * @param node
 */
export declare function isCustomProperty(arena: AstArena, node: AstNode): boolean;
/**
 * custom properties declared by the children of a node
 * - the `!important` declarations override the other declarations
 * - the last declaration wins
 * @param arena
 * @param node
 * @param result
 */
export declare function collectProperties(arena: AstArena, node: AstNode, result: Map<string, VariableEntry>): void;
/**
 * syntax of a parameter type: `<color>` -> `<color>`, `type(<length> | auto)` -> `<length> | auto`.
 * null when the parameter is not typed or accepts any value
 * @param arena
 * @param tokens tokens between the parameter name and the default value
 */
export declare function parameterSyntax(arena: AstArena, tokens: Token[]): string | null;
/**
 * true if a value matches the type of a parameter. a value that is resolved by the browser is not checked: a variable
 * (`var()`, `env()`, ...) or a math function (`calc()`, `min()`, ...)
 * @param arena
 * @param syntax
 * @param value
 * @param options
 */
export declare function matchesType(arena: AstArena, syntax: string | null, value: string, options: ParserOptions): boolean;
/**
 * custom properties of the rule the `@apply` rule belongs to: the declarations of the nearest style rule and of the
 * at-rules between them. null when the `@apply` rule is not inside a style rule
 * @param arena
 * @param node
 */
export declare function ruleProperties(arena: AstArena, node: AstNode): Map<string, VariableEntry> | null;
/**
 * parse the parameters of a mixin or a custom function: `--name(--a, --b <color>: red)`. null when the parameters are
 * not valid. the comments are ignored
 * @param arena
 * @param reference function token
 */
export declare function parseParameters(arena: AstArena, reference: Token): Parameter[] | null;
/**
 * arguments of a mixin or a custom function call: the comments and the whitespace are ignored, the curly braces are
 * removed. `--name(/* comment *\/)` has no argument
 * @param arena
 * @param reference function token
 */
export declare function parseArguments(arena: AstArena, reference: Token): Token[][];
/**
 * the definitions visible from a reference (`@apply`, custom function call): a definition is visible in its parent
 * (the stylesheet, a rule or an at-rule) and in the descendants of its parent. the definitions of the innermost scope
 * that defines the name are returned: they hide the definitions of the outer scopes
 * @param arena
 * @param definitions the definitions of the name
 * @param site the reference
 */
export declare function resolveDefinitions<T extends {
    node: AstNode;
}>(arena: AstArena, definitions: T[] | undefined, site: AstNode): T[];
/**
 * name of a mixin or a custom function definition: `@mixin --name(...)`, `@function --name(...)`
 * @param arena
 * @param node
 */
export declare function definitionName(arena: AstArena, node: AstNode): string | null;
/**
 * collect the mixin or custom function definitions of a stylesheet, a conditional group rule or a cascade layer
 * @param arena
 * @param node
 * @param name at-rule name: `mixin`, `function`
 * @param parse parse a definition. null when the definition is not valid
 * @param definitions valid definitions by name, in document order
 * @param invalid the definitions that are not valid: they are ignored
 */
export declare function collectDefinitions<T>(arena: AstArena, node: AstNode, name: string, parse: (arena: AstArena, node: AstNode) => T | null, definitions: Map<string, T[]>, invalid: AstNode[]): Map<string, T[]>;
/**
 * the mixin or custom function at-rules of a stylesheet, with the scope they are defined in
 * @param arena
 * @param node
 * @param name at-rule name: `mixin`, `function`
 * @param result
 */
export declare function collectAtRules(arena: AstArena, node: AstNode, name: string, result?: AstNode[]): AstNode[];
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
export declare function finalizeDefinitions(arena: AstArena, ast: AstNode, name: string, kept: Set<AstNode>, keep: boolean, invalid: AstNode[]): void;
