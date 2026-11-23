/**
 * Evaluate the custom functions: a custom function call (`<dashed-function>`) is replaced by the result of the
 * function, like var() is replaced by the value of a custom property.
 *
 * https://drafts.csswg.org/css-mixins-1/#defining-custom-functions
 *
 * ```css
 * @function --negative(--value) {
 *   result: calc(-1 * var(--value));
 * }
 * .x {
 *   padding: --negative(var(--gap));
 * }
 * ```
 *
 * is evaluated as
 *
 * ```css
 * .x {
 *   padding: calc(-1 * var(--gap));
 * }
 * ```
 *
 * the var() functions of the function body reference, by order of precedence:
 * - the local variables: the custom properties declared in the function body. `initial` is the value of the parameter
 *   with the same name, `inherit` (or `unset`) is the value of the variable with the same name in the calling context
 * - the arguments and the default values of the parameters
 * - the local variables and the arguments of the calling functions
 * - the custom properties of the call site: the custom properties declared by the rule that calls the function
 * - otherwise the var() function is kept, it is evaluated by the browser on the element that uses the function
 *
 * a call is evaluated when
 * - the function is visible from the call: a function defined in a rule or an at-rule is only visible inside of it,
 *   it hides the functions with the same name of the outer scopes. it is defined only once in that scope
 * - the function body does not contain conditional rules: the result does not depend on a condition
 * - the arguments match the parameters: no extra argument, every parameter without default value has an argument,
 *   the arguments and the default values match the type of the parameter, the result matches the return type
 * - the function does not call itself, directly or through other functions
 * - the function is valid: a function whose parameters contain the same name more than once is dropped (the
 *   functions are only dropped when the feature is enabled)
 * - the call is not located in a custom property declaration, or the function is not typed: the value of a typed
 *   argument or result is computed on the element that declares the custom property, the descendants inherit it
 *
 * otherwise the call is left as is, as well as a call that returns an invalid result or no result. a call that is not
 * evaluated makes the declaration, the function and the mixin that contain it fail: they are not evaluated.
 *
 * @module
 * @internal
 */
import type { AstNode, ParserOptions, Token } from "../../../@types/index.js";
import type { AstArena } from "../arena.ts";
import { type FunctionEvaluator, type Parameter, type VariableScope } from "./variables.ts";
/**
 * custom function definition
 */
export interface FunctionDefinition {
    node: AstNode;
    name: string;
    parameters: Parameter[];
    /**
     * syntax of the return type: `returns <length>`. null when the result is not typed
     */
    returns: string | null;
    /**
     * the function body contains conditional rules: the local variables or the result depend on conditions, the
     * function is not evaluated
     */
    conditionalBody: boolean;
    /**
     * local variables: the custom properties declared in the function body. the last declaration wins
     */
    locals: Map<string, Token[]>;
    /**
     * result tokens: the last `result` descriptor. null when the function has no result
     */
    result: Token[] | null;
}
/**
 * parse a custom function definition. null if the prelude is not valid
 *
 * ```css
 * @function --name(--a <length>: 1px) returns <length> { result: calc(2 * var(--a)) }
 * ```
 * @param arena
 * @param node
 */
export declare function parseFunction(arena: AstArena, node: AstNode): FunctionDefinition | null;
/**
 * evaluate the custom function calls
 */
export declare class FunctionRegistry implements FunctionEvaluator {
    readonly definitions: Map<string, FunctionDefinition[]>;
    private readonly options;
    /**
     * the function definitions that have been evaluated
     */
    readonly evaluated: Set<AstNode>;
    /**
     * the function definitions referenced by the calls that have not been evaluated: they are kept
     */
    readonly pending: Set<AstNode>;
    /**
     * number of evaluated calls
     */
    count: number;
    /**
     * number of calls that are not evaluated: the calls of the functions that are defined but cannot be evaluated.
     * the `@apply` rules, the functions and the declarations that contain them are not evaluated
     */
    failed: number;
    /**
     * the calls are located in a custom property declaration
     */
    customProperty: boolean;
    /**
     * location of the calls: the declaration or the `@apply` rule that contains them. the functions visible from it
     * are evaluated, see {@link resolveDefinitions}
     */
    site: AstNode;
    /**
     * functions being evaluated
     */
    private readonly stack;
    /**
     * the functions that call themselves, directly or through other functions
     */
    private readonly recursive;
    /**
     * @param definitions function definitions by name, in document order. the definitions that are not valid are null
     * @param options
     */
    constructor(definitions: Map<string, FunctionDefinition[]>, options: ParserOptions);
    call(arena: AstArena, token: Token, caller: VariableScope, descendant: boolean): string | null | undefined;
    /**
     * evaluate a call
     * @param arena
     * @param definition
     * @param token call token
     * @param caller
     * @param descendant
     * @returns the result, undefined when the arguments do not match the parameters or the result is not valid
     */
    private evaluate;
    /**
     * true if a function calls itself, directly or through the functions it calls: it cannot be evaluated
     * @param arena
     * @param name
     * @param stack functions being checked
     */
    private isRecursive;
}
/**
 * the custom function calls of a list of tokens and their descendants
 * @param arena
 * @param tokens
 * @param result
 */
export declare function findCalls(arena: AstArena, tokens: Token[], result?: Token[]): Token[];
/**
 * replace the custom function calls of the declarations of a stylesheet with their result. the bodies of the mixins
 * and of the custom functions are not modified: they are evaluated when they are used
 * @param arena
 * @param ast
 * @param registry
 */
export declare function evaluateFunctions(arena: AstArena, ast: AstNode, registry: FunctionRegistry): void;
