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
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import type { AstArena } from "../arena.ts";
import { parseDeclarations } from "../../parser/parse.ts";
import {
    type FunctionEvaluator,
    type Parameter,
    type VariableEntry,
    type VariableScope,
    declarationValue,
    firstToken,
    hasReference,
    isAtRule,
    isCustomProperty,
    matchesType,
    parameterSyntax,
    parseArguments,
    parseParameters,
    resolve,
    RuleScope,
    ruleProperties,
    substitute,
    UNDEFINED,
    resolveDefinitions,
} from "./variables.ts";

/**
 * maximum number of nested custom function calls
 */
const MAX_DEPTH = 32;

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
 * variables visible from the body of a custom function
 */
class FunctionScope implements VariableScope {
    /**
     * @param locals local variables
     * @param args arguments and default values
     * @param parent scope of the call: the calling function, or the element
     * @param functions
     */
    constructor(
        private readonly locals: Map<string, VariableEntry>,
        private readonly args: Map<string, VariableEntry>,
        private readonly parent: VariableScope,
        public readonly functions: FunctionEvaluator,
    ) {}

    lookup(name: string, descendant: boolean) {
        return this.locals.get(name) ?? this.args.get(name) ?? this.parent.lookup(name, descendant);
    }
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
export function parseFunction(arena: AstArena, node: AstNode): FunctionDefinition | null {
    const tokens: Token[] = arena.tokens(node);
    const reference: Token | null = firstToken(arena, tokens);

    if (reference == null || arena.dataTypes[reference] !== EnumToken.CustomFunctionTokenType) {
        return null;
    }

    const parameters: Parameter[] | null = parseParameters(arena, reference);

    if (parameters == null) {
        return null;
    }

    // [ returns <css-type> ]?
    let returns: string | null = null;
    const index: number = tokens.findIndex(
        (token: Token): boolean =>
            arena.dataTypes[token] === EnumToken.IdenTokenType &&
            arena.stringEqualsIgnoreCase(arena.stringValue[token], "returns"),
    );

    if (index !== -1) {
        returns = parameterSyntax(arena, tokens.slice(index + 1));
    }

    const definition: FunctionDefinition = {
        node,
        name: arena.resolveString(arena.stringValue[reference]),
        parameters,
        returns,
        conditionalBody: false,
        locals: new Map(),
        result: null,
    };

    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.AtRuleNodeType) {
            definition.conditionalBody = true;
        } else if (isCustomProperty(arena, child)) {
            definition.locals.set(arena.resolveString(arena.name[child]), declarationValue(arena, child));
        } else if (
            arena.dataTypes[child] === EnumToken.DeclarationNodeType &&
            arena.stringEquals(arena.name[child], "result")
        ) {
            definition.result = declarationValue(arena, child);
        }
    }

    return definition;
}

/**
 * local variable of a custom function. the css-wide keywords of the local variables:
 * - `initial`: the value of the parameter with the same name (the argument or the default value), otherwise the value
 *   is not valid
 * - `inherit`, `unset`: the value of the variable with the same name in the calling context (the calling function or
 *   the custom properties of the call site). otherwise the var() function is evaluated by the browser
 * @param arena
 * @param name
 * @param tokens
 * @param values arguments and default values
 * @param context calling context
 * @param scope scope of the function body
 * @param descendant
 */
function localVariable(
    arena: AstArena,
    name: string,
    tokens: Token[],
    values: Map<string, VariableEntry>,
    context: VariableScope,
    scope: VariableScope,
    descendant: boolean,
): VariableEntry {
    if (tokens.length === 1 && arena.dataTypes[tokens[0]] === EnumToken.IdenTokenType) {
        if (arena.stringEqualsIgnoreCase(arena.stringValue[tokens[0]], "initial")) {
            return values.get(name) ?? { tokens: null, text: null, scope: null };
        }

        if (
            arena.stringEqualsIgnoreCase(arena.stringValue[tokens[0]], "inherit") ||
            arena.stringEqualsIgnoreCase(arena.stringValue[tokens[0]], "unset")
        ) {
            const found: VariableEntry | typeof UNDEFINED | null = context.lookup(name, descendant);

            if (found === UNDEFINED) {
                return { tokens: null, text: null, scope: null };
            }

            return found ?? { tokens: null, text: `var(${name})`, scope: null };
        }
    }

    return { tokens, scope };
}

/**
 * evaluate the custom function calls
 */
export class FunctionRegistry implements FunctionEvaluator {
    /**
     * the function definitions that have been evaluated
     */
    public readonly evaluated: Set<AstNode> = new Set();

    /**
     * the function definitions referenced by the calls that have not been evaluated: they are kept
     */
    public readonly pending: Set<AstNode> = new Set();

    /**
     * number of evaluated calls
     */
    public count: number = 0;

    /**
     * number of calls that are not evaluated: the calls of the functions that are defined but cannot be evaluated.
     * the `@apply` rules, the functions and the declarations that contain them are not evaluated
     */
    public failed: number = 0;

    /**
     * the calls are located in a custom property declaration
     */
    public customProperty: boolean = false;

    /**
     * location of the calls: the declaration or the `@apply` rule that contains them. the functions visible from it
     * are evaluated, see {@link resolveDefinitions}
     */
    public site: AstNode = 0;

    /**
     * functions being evaluated
     */
    private readonly stack: string[] = [];

    /**
     * the functions that call themselves, directly or through other functions
     */
    private readonly recursive: Map<string, boolean> = new Map();

    /**
     * @param definitions function definitions by name, in document order. the definitions that are not valid are null
     * @param options
     */
    constructor(
        public readonly definitions: Map<string, FunctionDefinition[]>,
        private readonly options: ParserOptions,
    ) {}

    call(arena: AstArena, token: Token, caller: VariableScope, descendant: boolean): string | null | undefined {
        const name: string = arena.resolveString(arena.stringValue[token]);
        const all: FunctionDefinition[] | undefined = this.definitions.get(name);

        // the function is not defined in the stylesheet
        if (all == null) {
            return undefined;
        }

        // the functions visible from the call: a function defined in a rule or an at-rule is not visible outside of it.
        // the function is defined only once in the innermost scope that defines it
        const definitions: FunctionDefinition[] = resolveDefinitions(arena, all, this.site);
        const definition: FunctionDefinition | null = definitions.length === 1 ? definitions[0] : null;

        if (
            definition == null ||
            definition.conditionalBody ||
            this.stack.length >= MAX_DEPTH ||
            this.isRecursive(arena, name) ||
            (this.customProperty &&
                (definition.returns != null ||
                    definition.parameters.some((parameter: Parameter): boolean => parameter.syntax != null)))
        ) {
            // the visible definitions are kept
            for (const visible of definitions) {
                this.pending.add(visible.node);
            }

            this.failed++;
            return undefined;
        }

        const failed: number = this.failed;
        let result: string | undefined = this.evaluate(arena, definition, token, caller, descendant);

        // a call of the function body is not evaluated: the function is not evaluated
        if (result !== undefined && this.failed !== failed) {
            result = undefined;
        }

        if (result === undefined) {
            this.pending.add(definition.node);
            this.failed++;
        } else {
            this.evaluated.add(definition.node);
            this.count++;
        }

        return result;
    }

    /**
     * evaluate a call
     * @param arena
     * @param definition
     * @param token call token
     * @param caller
     * @param descendant
     * @returns the result, undefined when the arguments do not match the parameters or the result is not valid
     */
    private evaluate(
        arena: AstArena,
        definition: FunctionDefinition,
        token: Token,
        caller: VariableScope,
        descendant: boolean,
    ): string | undefined {
        const args: Token[][] = parseArguments(arena, token);

        if (args.length > definition.parameters.length) {
            return undefined;
        }

        const values: Map<string, VariableEntry> = new Map();
        const locals: Map<string, VariableEntry> = new Map();
        // the variables of the call site: the custom properties of the rule, or the variables of the calling function
        const context: VariableScope = caller.dynamic ?? caller;
        const argumentScope: VariableScope = caller.arguments ?? caller;
        const scope: FunctionScope = new FunctionScope(locals, values, context, this);

        for (let index = 0; index < definition.parameters.length; index++) {
            const parameter: Parameter = definition.parameters[index];

            if (index < args.length) {
                // the arguments are evaluated in the scope of the call
                const text: string | null = substitute(arena, args[index], argumentScope, descendant);

                if (text === null) {
                    return undefined;
                }

                values.set(parameter.name, { tokens: null, text, scope: null });
            } else if (parameter.defaultValue != null) {
                values.set(parameter.name, { tokens: parameter.defaultValue, scope });
            } else {
                return undefined;
            }
        }

        for (const [name, tokens] of definition.locals) {
            locals.set(name, localVariable(arena, name, tokens, values, context, scope, descendant));
        }

        this.stack.push(definition.name);

        try {
            for (const parameter of definition.parameters) {
                const value: string | null = resolve(arena, values.get(parameter.name)!, descendant);

                if (value === null || !matchesType(arena, parameter.syntax, value, this.options)) {
                    return undefined;
                }
            }

            // no result: guaranteed-invalid value. the call is left as is
            if (definition.result == null) {
                return undefined;
            }

            const result: string | null = substitute(arena, definition.result, scope, descendant);

            // an invalid result or a result that does not match the return type: the call is left as is
            if (result === null || !matchesType(arena, definition.returns, result, this.options)) {
                return undefined;
            }

            return result;
        } finally {
            this.stack.pop();
        }
    }

    /**
     * true if a function calls itself, directly or through the functions it calls: it cannot be evaluated
     * @param arena
     * @param name
     * @param stack functions being checked
     */
    private isRecursive(arena: AstArena, name: string, stack: string[] = []): boolean {
        if (stack.includes(name)) {
            return true;
        }

        if (this.recursive.has(name)) {
            return this.recursive.get(name)!;
        }

        let result: boolean = false;

        stack.push(name);

        for (const definition of this.definitions.get(name) ?? []) {
            const values: Token[][] = [...definition.locals.values()];

            if (definition.result != null) {
                values.push(definition.result);
            }

            for (const parameter of definition.parameters) {
                if (parameter.defaultValue != null) {
                    values.push(parameter.defaultValue);
                }
            }

            for (const tokens of values) {
                for (const call of findCalls(arena, tokens)) {
                    if (
                        this.definitions.has(arena.resolveString(arena.stringValue[call])) &&
                        this.isRecursive(arena, arena.resolveString(arena.stringValue[call]), stack)
                    ) {
                        result = true;
                        break;
                    }
                }

                if (result) {
                    break;
                }
            }

            if (result) {
                break;
            }
        }

        stack.pop();
        // a function that reaches one of the functions being checked is part of a cycle
        this.recursive.set(name, result);

        return result;
    }
}

/**
 * the custom function calls of a list of tokens and their descendants
 * @param arena
 * @param tokens
 * @param result
 */
export function findCalls(arena: AstArena, tokens: Token[], result: Token[] = []): Token[] {
    for (const token of tokens) {
        if (arena.dataTypes[token] === EnumToken.CustomFunctionTokenType) {
            result.push(token);
        }

        if (arena.firstToken[token] !== 0 || arena.firstChild[token] !== 0) {
            findCalls(arena, arena.subTokens(token), result);
        }
    }

    return result;
}

/**
 * replace the custom function calls of the declarations of a stylesheet with their result. the bodies of the mixins
 * and of the custom functions are not modified: they are evaluated when they are used
 * @param arena
 * @param ast
 * @param registry
 */
export function evaluateFunctions(arena: AstArena, ast: AstNode, registry: FunctionRegistry): void {
    const stack: AstNode[] = [];

    for (let child = arena.lastChild[ast]; child !== 0; child = arena.previousSibling[child]) {
        stack.push(child);
    }

    while (stack.length > 0) {
        const node: AstNode = stack.pop()!;

        if (isAtRule(arena, node, "mixin") || isAtRule(arena, node, "function")) {
            continue;
        }

        if (arena.dataTypes[node] === EnumToken.DeclarationNodeType) {
            evaluateDeclaration(arena, node, registry);
            continue;
        }

        if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
            for (let child = arena.lastChild[node]; child !== 0; child = arena.previousSibling[child]) {
                stack.push(child);
            }
        }
    }
}

/**
 * replace the custom function calls of a declaration with their result
 * @param arena
 * @param declaration
 * @param registry
 */
function evaluateDeclaration(arena: AstArena, declaration: AstNode, registry: FunctionRegistry): void {
    const tokens: Token[] = arena.tokens(declaration);

    if (!tokens.some((token: Token): boolean => hasReference(arena, token, true))) {
        return;
    }

    // the var() functions of the declaration are not modified. the custom functions see the custom properties of
    // the rule: the call site
    const scope: RuleScope = new RuleScope(
        new Map(),
        registry,
        new RuleScope(ruleProperties(arena, declaration) ?? new Map(), registry),
    );

    const count: number = registry.count;
    const failed: number = registry.failed;

    registry.customProperty = isCustomProperty(arena, declaration);
    registry.site = declaration;

    const value: string | null = substitute(arena, tokens, scope, false);

    // no call has been evaluated, a call is not evaluated or the value is not valid: the declaration is left as is
    if (registry.count === count || registry.failed !== failed || value === null) {
        return;
    }

    const nodes: AstNode[] = parseDeclarations(
        arena.resolveString(arena.name[declaration]) + ":" + value,
        arena,
    ).nodes.filter((node: AstNode): boolean => arena.dataTypes[node] === EnumToken.DeclarationNodeType);

    if (nodes.length === 1) {
        arena.copyLocation(nodes[0], declaration);
        arena.replaceChild(declaration, nodes[0]);
    }
}
