/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { parseDeclarations } from '../../parser/parse.js';
import { resolveDefinitions, parseArguments, substitute, resolve, matchesType, isAtRule, UNDEFINED, firstToken, parseParameters, parameterSyntax, isCustomProperty, declarationValue, hasReference, RuleScope, ruleProperties } from './variables.js';

/**
 * maximum number of nested custom function calls
 */
const MAX_DEPTH = 32;
/**
 * variables visible from the body of a custom function
 */
class FunctionScope {
    locals;
    args;
    parent;
    functions;
    /**
     * @param locals local variables
     * @param args arguments and default values
     * @param parent scope of the call: the calling function, or the element
     * @param functions
     */
    constructor(locals, args, parent, functions) {
        this.locals = locals;
        this.args = args;
        this.parent = parent;
        this.functions = functions;
    }
    lookup(name, descendant) {
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
function parseFunction(arena, node) {
    const tokens = arena.tokens(node);
    const reference = firstToken(arena, tokens);
    if (reference == null || arena.dataTypes[reference] !== EnumToken.CustomFunctionTokenType) {
        return null;
    }
    const parameters = parseParameters(arena, reference);
    if (parameters == null) {
        return null;
    }
    // [ returns <css-type> ]?
    let returns = null;
    const index = tokens.findIndex((token) => arena.dataTypes[token] === EnumToken.IdenTokenType &&
        arena.stringEqualsIgnoreCase(arena.stringValue[token], "returns"));
    if (index !== -1) {
        returns = parameterSyntax(arena, tokens.slice(index + 1));
    }
    const definition = {
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
        }
        else if (isCustomProperty(arena, child)) {
            definition.locals.set(arena.resolveString(arena.name[child]), declarationValue(arena, child));
        }
        else if (arena.dataTypes[child] === EnumToken.DeclarationNodeType &&
            arena.stringEquals(arena.name[child], "result")) {
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
function localVariable(arena, name, tokens, values, context, scope, descendant) {
    if (tokens.length === 1 && arena.dataTypes[tokens[0]] === EnumToken.IdenTokenType) {
        if (arena.stringEqualsIgnoreCase(arena.stringValue[tokens[0]], "initial")) {
            return values.get(name) ?? { tokens: null, text: null, scope: null };
        }
        if (arena.stringEqualsIgnoreCase(arena.stringValue[tokens[0]], "inherit") ||
            arena.stringEqualsIgnoreCase(arena.stringValue[tokens[0]], "unset")) {
            const found = context.lookup(name, descendant);
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
class FunctionRegistry {
    definitions;
    options;
    /**
     * the function definitions that have been evaluated
     */
    evaluated = new Set();
    /**
     * the function definitions referenced by the calls that have not been evaluated: they are kept
     */
    pending = new Set();
    /**
     * number of evaluated calls
     */
    count = 0;
    /**
     * number of calls that are not evaluated: the calls of the functions that are defined but cannot be evaluated.
     * the `@apply` rules, the functions and the declarations that contain them are not evaluated
     */
    failed = 0;
    /**
     * the calls are located in a custom property declaration
     */
    customProperty = false;
    /**
     * location of the calls: the declaration or the `@apply` rule that contains them. the functions visible from it
     * are evaluated, see {@link resolveDefinitions}
     */
    site = 0;
    /**
     * functions being evaluated
     */
    stack = [];
    /**
     * the functions that call themselves, directly or through other functions
     */
    recursive = new Map();
    /**
     * @param definitions function definitions by name, in document order. the definitions that are not valid are null
     * @param options
     */
    constructor(definitions, options) {
        this.definitions = definitions;
        this.options = options;
    }
    call(arena, token, caller, descendant) {
        const name = arena.resolveString(arena.stringValue[token]);
        const all = this.definitions.get(name);
        // the function is not defined in the stylesheet
        if (all == null) {
            return undefined;
        }
        // the functions visible from the call: a function defined in a rule or an at-rule is not visible outside of it.
        // the function is defined only once in the innermost scope that defines it
        const definitions = resolveDefinitions(arena, all, this.site);
        const definition = definitions.length === 1 ? definitions[0] : null;
        if (definition == null ||
            definition.conditionalBody ||
            this.stack.length >= MAX_DEPTH ||
            this.isRecursive(arena, name) ||
            (this.customProperty &&
                (definition.returns != null ||
                    definition.parameters.some((parameter) => parameter.syntax != null)))) {
            // the visible definitions are kept
            for (const visible of definitions) {
                this.pending.add(visible.node);
            }
            this.failed++;
            return undefined;
        }
        const failed = this.failed;
        let result = this.evaluate(arena, definition, token, caller, descendant);
        // a call of the function body is not evaluated: the function is not evaluated
        if (result !== undefined && this.failed !== failed) {
            result = undefined;
        }
        if (result === undefined) {
            this.pending.add(definition.node);
            this.failed++;
        }
        else {
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
    evaluate(arena, definition, token, caller, descendant) {
        const args = parseArguments(arena, token);
        if (args.length > definition.parameters.length) {
            return undefined;
        }
        const values = new Map();
        const locals = new Map();
        // the variables of the call site: the custom properties of the rule, or the variables of the calling function
        const context = caller.dynamic ?? caller;
        const argumentScope = caller.arguments ?? caller;
        const scope = new FunctionScope(locals, values, context, this);
        for (let index = 0; index < definition.parameters.length; index++) {
            const parameter = definition.parameters[index];
            if (index < args.length) {
                // the arguments are evaluated in the scope of the call
                const text = substitute(arena, args[index], argumentScope, descendant);
                if (text === null) {
                    return undefined;
                }
                values.set(parameter.name, { tokens: null, text, scope: null });
            }
            else if (parameter.defaultValue != null) {
                values.set(parameter.name, { tokens: parameter.defaultValue, scope });
            }
            else {
                return undefined;
            }
        }
        for (const [name, tokens] of definition.locals) {
            locals.set(name, localVariable(arena, name, tokens, values, context, scope, descendant));
        }
        this.stack.push(definition.name);
        try {
            for (const parameter of definition.parameters) {
                const value = resolve(arena, values.get(parameter.name), descendant);
                if (value === null || !matchesType(arena, parameter.syntax, value, this.options)) {
                    return undefined;
                }
            }
            // no result: guaranteed-invalid value. the call is left as is
            if (definition.result == null) {
                return undefined;
            }
            const result = substitute(arena, definition.result, scope, descendant);
            // an invalid result or a result that does not match the return type: the call is left as is
            if (result === null || !matchesType(arena, definition.returns, result, this.options)) {
                return undefined;
            }
            return result;
        }
        finally {
            this.stack.pop();
        }
    }
    /**
     * true if a function calls itself, directly or through the functions it calls: it cannot be evaluated
     * @param arena
     * @param name
     * @param stack functions being checked
     */
    isRecursive(arena, name, stack = []) {
        if (stack.includes(name)) {
            return true;
        }
        if (this.recursive.has(name)) {
            return this.recursive.get(name);
        }
        let result = false;
        stack.push(name);
        for (const definition of this.definitions.get(name) ?? []) {
            const values = [...definition.locals.values()];
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
                    if (this.definitions.has(arena.resolveString(arena.stringValue[call])) &&
                        this.isRecursive(arena, arena.resolveString(arena.stringValue[call]), stack)) {
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
function findCalls(arena, tokens, result = []) {
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
function evaluateFunctions(arena, ast, registry) {
    const stack = [];
    for (let child = arena.lastChild[ast]; child !== 0; child = arena.previousSibling[child]) {
        stack.push(child);
    }
    while (stack.length > 0) {
        const node = stack.pop();
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
function evaluateDeclaration(arena, declaration, registry) {
    const tokens = arena.tokens(declaration);
    if (!tokens.some((token) => hasReference(arena, token, true))) {
        return;
    }
    // the var() functions of the declaration are not modified. the custom functions see the custom properties of
    // the rule: the call site
    const scope = new RuleScope(new Map(), registry, new RuleScope(ruleProperties(arena, declaration) ?? new Map(), registry));
    const count = registry.count;
    const failed = registry.failed;
    registry.customProperty = isCustomProperty(arena, declaration);
    registry.site = declaration;
    const value = substitute(arena, tokens, scope, false);
    // no call has been evaluated, a call is not evaluated or the value is not valid: the declaration is left as is
    if (registry.count === count || registry.failed !== failed || value === null) {
        return;
    }
    const nodes = parseDeclarations(arena.resolveString(arena.name[declaration]) + ":" + value, arena).nodes.filter((node) => arena.dataTypes[node] === EnumToken.DeclarationNodeType);
    if (nodes.length === 1) {
        arena.copyLocation(nodes[0], declaration);
        arena.replaceChild(declaration, nodes[0]);
    }
}

export { FunctionRegistry, evaluateFunctions, findCalls, parseFunction };
