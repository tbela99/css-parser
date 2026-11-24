/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { FeatureWalkMode } from './type.js';
import { splitRule } from '../minify.js';
import { parseRuleContent, parseDeclarations } from '../../parser/parse.js';
import { collectDefinitions, isCustomProperty, isAtRule, finalizeDefinitions, resolveDefinitions, ruleProperties, firstToken, parseParameters, parseArguments, UNDEFINED, RuleScope, substitute, resolve, matchesType, render, declarationValue, splitArguments, trim } from '../mixins/variables.js';
import { FunctionRegistry, evaluateFunctions, parseFunction, findCalls } from '../mixins/custom-function.js';

/**
 * the subject of the rule is the element the mixin is applied to: `&`, `&.active`, `&::before`
 */
const SELF = 0;
/**
 * the subject of the rule is a descendant of the element the mixin is applied to: `& *`, `& > *`, `.child`
 */
const DESCENDANT = 1;
/**
 * the subject of the rule is not in the subtree of the element the mixin is applied to: `& + *`, `& ~ *`
 */
const OUTSIDE = 2;
/**
 * maximum number of nested `@apply` rules: guard against the mixins that apply each other
 */
const MAX_DEPTH = 32;
/**
 * application of a mixin: the variables shared by the scopes of the mixin body
 */
class MixinApplication {
    name;
    properties;
    contents;
    names;
    registry;
    /**
     * mixin arguments and default values
     */
    args = new Map();
    /**
     * the typed arguments that depend on the element the mixin is applied to
     */
    typed = new Map();
    /**
     * registered custom properties of the typed arguments
     */
    registered = [];
    /**
     * the mixin cannot be evaluated: a typed argument cannot be registered
     */
    failed = false;
    /**
     * the variables visible from the bodies of the custom functions called by the mixin body: the custom properties
     * of the rule. the private variables are not visible
     */
    dynamic;
    /**
     * @param name mixin name
     * @param properties custom properties declared in the rule the mixin is applied to
     * @param contents serialized contents block of the `@apply` rule. null when the `@apply` rule has no contents block
     * @param names names of the custom properties of the stylesheet
     * @param registry the custom function calls of the mixin body are evaluated. null when they are not evaluated
     */
    constructor(name, properties, contents, names, registry = null) {
        this.name = name;
        this.properties = properties;
        this.contents = contents;
        this.names = names;
        this.registry = registry;
        this.dynamic = new RuleScope(properties, registry);
    }
    /**
     * variable that references the registered custom property of a typed argument. null when the argument cannot be
     * registered
     * @param name
     */
    typedEntry(name) {
        const argument = this.typed.get(name);
        if (argument.entry == null) {
            const initialValue = initialValueOf(argument.syntax);
            if (initialValue == null || this.names == null) {
                this.failed = true;
                return null;
            }
            const prefix = `--${this.name.slice(2)}-${name.slice(2)}-`;
            let index = 1;
            while (this.names.has(prefix + index)) {
                index++;
            }
            argument.property = prefix + index;
            argument.entry = { tokens: null, text: `var(${argument.property})`, scope: null };
            argument.entry.descendantText = argument.entry.text;
            this.names.add(argument.property);
            this.registered.push({
                name: argument.property,
                syntax: argument.syntax,
                initialValue,
                value: argument.value,
            });
        }
        return argument.entry;
    }
}
/**
 * variables visible from a node of a mixin body
 */
class MixinScope {
    levels;
    application;
    masked;
    /**
     * the custom function calls of the mixin body are evaluated with the mixin
     */
    get functions() {
        return this.application.registry;
    }
    /**
     * the custom functions see the custom properties of the rule, not the private variables
     */
    get dynamic() {
        return this.application.dynamic;
    }
    /**
     * @param levels variables declared by the mixin body and the rules that contain the current node, outer first
     * @param application the mixin application
     * @param masked custom properties declared in the mixin body: they override the rule custom properties
     */
    constructor(levels, application, masked) {
        this.levels = levels;
        this.application = application;
        this.masked = masked;
    }
    /**
     * the subject of the current rule is a descendant of the element the mixin is applied to
     */
    get descendant() {
        return this.levels[0].relation === DESCENDANT;
    }
    /**
     * scope of a nested rule
     * @param relation relation of the subject of the nested rule to the subject of the current rule
     * @param masked custom properties declared in the nested rule
     */
    child(relation, masked) {
        const levels = this.levels.map((level) => ({
            privates: level.privates,
            relation: compose(level.relation, relation),
        }));
        levels.push({ privates: new Map(), relation: SELF });
        return new MixinScope(levels, this.application, masked.size === 0 ? this.masked : new Set([...this.masked, ...masked]));
    }
    /**
     * find a variable
     * - the variable entry
     * - {@link UNDEFINED} if the variable is a private variable that is not visible
     * - null if the variable is not a private variable: the var() function is evaluated by the browser
     * @param name
     * @param descendant the variable is referenced by a descendant of the element the mixin is applied to
     */
    lookup(name, descendant) {
        // the inner declarations override the outer declarations. the private variables of a nested rule are private
        // variables of its nested rules: each nested rule has its own context
        for (let i = this.levels.length - 1; i > 0; i--) {
            const entry = this.levels[i].privates.get(name);
            if (entry !== undefined) {
                return entry;
            }
        }
        // the private variables of the mixin body are not visible from the siblings of the element the mixin is
        // applied to
        const visible = this.levels[0].relation !== OUTSIDE;
        const isPrivate = this.levels[0].privates.has(name);
        if (isPrivate && visible) {
            return this.levels[0].privates.get(name);
        }
        const application = this.application;
        if (application.args.has(name)) {
            if (!visible) {
                return UNDEFINED;
            }
            // the descendants inherit the value computed on the element
            if (descendant && application.typed.has(name)) {
                return application.typedEntry(name) ?? application.args.get(name);
            }
            return application.args.get(name);
        }
        if (isPrivate) {
            return UNDEFINED;
        }
        // the custom properties of the rule the mixin is applied to. the descendants inherit them
        if (visible && !this.masked.has(name) && application.properties.has(name)) {
            return application.properties.get(name);
        }
        return null;
    }
}
/**
 * initial value of a registered custom property: a computationally independent value that matches the syntax.
 * null when the syntax is not supported
 * @param syntax
 */
function initialValueOf(syntax) {
    const defaults = {
        length: "0px",
        "length-percentage": "0px",
        percentage: "0%",
        number: "0",
        integer: "0",
        angle: "0deg",
        time: "0s",
        resolution: "1dppx",
        color: "transparent",
        "custom-ident": "none",
        string: '""',
        "transform-function": "scale(1)",
        "transform-list": "scale(1)",
    };
    for (const component of syntax.split("|")) {
        const match = component.trim().match(/^(?:<([a-z-]+)>|([a-z][a-z0-9-]*))[+#]?$/i);
        if (match == null) {
            // the syntax is not supported by a registered custom property
            return null;
        }
        if (match[2] != null) {
            return match[2];
        }
        if (match[1].toLowerCase() in defaults) {
            return defaults[match[1].toLowerCase()];
        }
    }
    return null;
}
/**
 * relation of the subject of a nested rule to the subject of an outer rule
 * @param outer relation of the current rule to the outer rule
 * @param relation relation of the nested rule to the current rule
 */
function compose(outer, relation) {
    if (outer === SELF) {
        return relation;
    }
    // the siblings and the descendants of a descendant are descendants.
    // the siblings and the descendants of an element outside the subtree are outside the subtree
    return outer;
}
/**
 * names of the custom properties declared by a mixin body or a rule. the declarations of the nested at-rules
 * (`@media`, `@supports`, ...) are included, the declarations of the nested rules and `@private` are not
 * @param arena
 * @param node
 * @param result
 */
function collectMasked(arena, node, result = new Set()) {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (isCustomProperty(arena, child)) {
            result.add(arena.resolveString(arena.name[child]));
        }
        else if (arena.dataTypes[child] === EnumToken.AtRuleNodeType &&
            arena.flags[child] & EnumAstNodeStatus.HasChildren &&
            !isAtRule(arena, child, "private")) {
            collectMasked(arena, child, result);
        }
    }
    return result;
}
/**
 * declare the private variables (`@private`) of a mixin body or a rule in the innermost level of the scope
 * @param arena
 * @param node
 * @param scope
 */
function declarePrivates(arena, node, scope) {
    const privates = scope.levels[scope.levels.length - 1].privates;
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (!isAtRule(arena, child, "private")) {
            continue;
        }
        for (let node = arena.firstChild[child]; node !== 0; node = arena.nextSibling[node]) {
            if (isCustomProperty(arena, node)) {
                // the last declaration wins
                privates.set(arena.resolveString(arena.name[node]), { tokens: declarationValue(arena, node), scope });
            }
        }
    }
}
/**
 * true if a node contains nested rules
 * @param arena
 * @param node
 */
function hasNestedRules(arena, node) {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.RuleNodeType ||
            (arena.dataTypes[child] === EnumToken.AtRuleNodeType &&
                arena.flags[child] & EnumAstNodeStatus.HasChildren &&
                hasNestedRules(arena, child))) {
            return true;
        }
    }
    return false;
}
/**
 * true if the compound selector part references the nesting selector: `&`, `:is(&)`, `:where(&)`
 * @param part
 */
function isNestingPart(part) {
    return part === "&" || /^:(is|where)\(\s*&\s*\)$/i.test(part);
}
/**
 * relation of the subject of a nested selector to the subject of the rule that contains it
 * @param parts complex selector parts, see {@link splitRule}
 */
function selectorRelation(parts) {
    const compounds = [[]];
    const combinators = [];
    let whitespace = false;
    for (const part of parts) {
        if (part.trim() === "") {
            whitespace = true;
            continue;
        }
        if (part === ">" || part === "+" || part === "~" || part === "||") {
            combinators.push(part);
            compounds.push([]);
            whitespace = false;
            continue;
        }
        if (whitespace && compounds[compounds.length - 1].length > 0) {
            // descendant combinator
            combinators.push(" ");
            compounds.push([]);
        }
        whitespace = false;
        compounds[compounds.length - 1].push(part);
    }
    // relative selector: `> .child`, `+ .sibling`
    if (compounds[0].length === 0) {
        compounds[0].push("&");
    }
    let index = -1;
    for (let i = compounds.length - 1; i >= 0; i--) {
        if (compounds[i].some(isNestingPart)) {
            index = i;
            break;
        }
    }
    if (index === -1) {
        // '&' used in a way that is not handled: `:not(&)`, `:has(+ &)`. the relation is unknown
        if (parts.some((part) => part.includes("&"))) {
            return OUTSIDE;
        }
        // the selector is implicitly prefixed with `& `
        return DESCENDANT;
    }
    if (index === compounds.length - 1) {
        return SELF;
    }
    return combinators[index] === " " || combinators[index] === ">" ? DESCENDANT : OUTSIDE;
}
/**
 * serialize a declaration of a mixin body. the declaration is left as is when it references an invalid variable
 * without fallback
 * @param arena
 * @param declaration
 * @param scope
 */
function serializeDeclaration(arena, declaration, scope) {
    const name = arena.resolveString(arena.name[declaration]);
    if (scope.application.registry != null) {
        scope.application.registry.customProperty = arena.startsWith(declaration, "nam", "--");
    }
    // a custom property is inherited by the descendants: a typed argument is the value computed on the element
    const value = substitute(arena, arena.tokens(declaration), scope, scope.descendant || arena.startsWith(declaration, "nam", "--"));
    // an invalid value is left as is
    return name + ":" + (value ?? render(arena, arena.tokens(declaration)));
}
/**
 * serialize an `@apply` rule of a mixin body. its arguments may reference the private variables
 * @param arena
 * @param node
 * @param scope
 */
function serializeApply(arena, node, scope) {
    const tokens = arena.tokens(node);
    const reference = firstToken(arena, tokens);
    let prelude;
    if (reference != null && arena.dataTypes[reference] === EnumToken.CustomFunctionTokenType) {
        // the arguments are substituted one by one: an invalid argument is kept
        prelude =
            arena.resolveString(arena.stringValue[reference]) +
                "(" +
                splitArguments(arena, arena.tokens(reference))
                    .map((arg) => substitute(arena, arg, scope, scope.descendant) ?? render(arena, arg))
                    .join(",") +
                ")";
    }
    else {
        prelude = render(arena, trim(arena, tokens));
    }
    return ("@apply " +
        prelude +
        (arena.flags[node] & EnumAstNodeStatus.HasChildren
            ? "{" + serializeDeclarations(arena, node, scope) + "}"
            : ";"));
}
/**
 * serialize the declarations of a contents block: `@apply --mixin { color: red }`, `@contents { color: red }`
 * @param arena
 * @param node
 * @param scope
 */
function serializeDeclarations(arena, node, scope) {
    let result = "";
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.DeclarationNodeType) {
            result += serializeDeclaration(arena, child, scope) + ";";
        }
        else if (isAtRule(arena, child, "contents")) {
            // the contents block is forwarded: `@apply --mixin { @contents; }`
            result += serializeContents(arena, child, scope);
        }
    }
    return result;
}
/**
 * serialize a `@contents` rule: the contents block of the `@apply` rule, otherwise the default contents block of the
 * `@contents` rule, otherwise nothing. the contents block is a copy: it is parsed again
 * @param arena
 * @param node `@contents` rule
 * @param scope
 */
function serializeContents(arena, node, scope) {
    if (scope.application.contents != null) {
        return scope.application.contents;
    }
    return arena.flags[node] & EnumAstNodeStatus.HasChildren ? serializeDeclarations(arena, node, scope) : "";
}
/**
 * serialize a nested rule of a mixin body. the rule is split when its selectors do not have the same relation to the
 * rule the mixin is applied to: the private variables are visible to some of them only
 * @param arena
 * @param rule
 * @param scope
 */
function serializeRule(arena, rule, scope) {
    const groups = new Map();
    // the element and its descendants see the same variables, unless the rule has nested rules (the relation of the
    // nested rules depends on it) or a typed argument is computed on the element (the descendants inherit it)
    const merge = !hasNestedRules(arena, rule) && scope.application.typed.size === 0;
    for (const parts of splitRule(arena.resolveString(arena.name[rule]))) {
        let relation = selectorRelation(parts);
        if (merge && relation === DESCENDANT) {
            relation = SELF;
        }
        if (!groups.has(relation)) {
            groups.set(relation, []);
        }
        groups.get(relation).push(parts.join(""));
    }
    let result = "";
    const masked = collectMasked(arena, rule);
    for (const [relation, selectors] of groups) {
        const child = scope.child(relation, masked);
        declarePrivates(arena, rule, child);
        result += selectors.join(",") + "{" + serializeBlock(arena, rule, child) + "}";
    }
    return result;
}
/**
 * serialize the children of a mixin body, a nested rule or a nested at-rule. the private variables are substituted
 * @param arena
 * @param node
 * @param scope
 */
function serializeBlock(arena, node, scope) {
    let result = "";
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        switch (arena.dataTypes[child]) {
            case EnumToken.DeclarationNodeType:
                result += serializeDeclaration(arena, child, scope) + ";";
                break;
            case EnumToken.RuleNodeType:
                result += serializeRule(arena, child, scope);
                break;
            case EnumToken.AtRuleNodeType: {
                // the private variables are substituted
                if (arena.stringEquals(arena.name[child], "private")) {
                    break;
                }
                if (arena.stringEquals(arena.name[child], "apply")) {
                    result += serializeApply(arena, child, scope);
                    break;
                }
                // the content of `@result` is the result of the mixin
                if (arena.stringEquals(arena.name[child], "result")) {
                    result += serializeBlock(arena, child, scope);
                    break;
                }
                if (arena.stringEquals(arena.name[child], "contents")) {
                    result += serializeContents(arena, child, scope);
                    break;
                }
                const prelude = arena.resolveString(arena.stringValue[child]);
                result +=
                    "@" +
                        arena.resolveString(arena.name[child]) +
                        (prelude === "" ? "" : " " + prelude) +
                        (arena.flags[child] & EnumAstNodeStatus.HasChildren
                            ? "{" + serializeBlock(arena, child, scope) + "}"
                            : ";");
                break;
            }
        }
    }
    return result;
}
/**
 * the generated nodes are located at the `@apply` rule
 * @param arena
 * @param node
 * @param location
 */
function locate(arena, node, location) {
    arena.copyLocation(node, location);
    if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
        for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
            locate(arena, child, location);
        }
    }
}
/**
 * parse a mixin definition. null if the prelude is not valid
 * @param arena
 * @param node
 */
function parseMixin(arena, node) {
    const reference = firstToken(arena, arena.tokens(node));
    if (reference == null) {
        return null;
    }
    let parameters = [];
    if (arena.dataTypes[reference] === EnumToken.CustomFunctionTokenType) {
        parameters = parseParameters(arena, reference);
        if (parameters == null) {
            return null;
        }
    }
    else if (arena.dataTypes[reference] !== EnumToken.DashedIdenTokenType) {
        return null;
    }
    return {
        node,
        name: arena.resolveString(arena.stringValue[reference]),
        parameters,
    };
}
/**
 * parse the prelude of an `@apply` rule: the name of the mixin and the arguments. the comments and the whitespace
 * are ignored: `@apply --mixin( /* comment *\/ )` has no argument
 * @param arena
 * @param node
 */
function parseApply(arena, node) {
    const reference = firstToken(arena, arena.tokens(node));
    if (reference == null) {
        return null;
    }
    if (arena.dataTypes[reference] === EnumToken.DashedIdenTokenType) {
        return { name: arena.resolveString(arena.stringValue[reference]), args: [] };
    }
    if (arena.dataTypes[reference] !== EnumToken.CustomFunctionTokenType) {
        return null;
    }
    return { name: arena.resolveString(arena.stringValue[reference]), args: parseArguments(arena, reference) };
}
/**
 * bind the arguments to the mixin parameters. false when the arguments do not match the parameters:
 * - more arguments than parameters
 * - a parameter without default value has no argument
 * - an argument or a default value does not match the type of the parameter, or is invalid
 * @param arena
 * @param definition
 * @param args argument tokens
 * @param caller scope of the `@apply` rule, the arguments are evaluated in this scope
 * @param scope scope of the mixin body, the default values are evaluated in this scope
 * @param options
 */
function bindParameters(arena, definition, args, caller, scope, options) {
    const application = scope.application;
    if (args.length > definition.parameters.length) {
        return false;
    }
    for (let index = 0; index < definition.parameters.length; index++) {
        const parameter = definition.parameters[index];
        if (index < args.length) {
            application.args.set(parameter.name, {
                tokens: null,
                text: substitute(arena, args[index], caller, false),
                scope,
            });
        }
        else if (parameter.defaultValue != null) {
            // the default value may reference the other variables: it is resolved once the variables are declared
            application.args.set(parameter.name, { tokens: parameter.defaultValue, scope });
        }
        else {
            return false;
        }
    }
    // the private variables may be referenced by the default values
    declarePrivates(arena, definition.node, scope);
    for (const parameter of definition.parameters) {
        const value = resolve(arena, application.args.get(parameter.name), false);
        if (value === null || !matchesType(arena, parameter.syntax, value, options)) {
            return false;
        }
        // the value of a typed argument is computed on the element the mixin is applied to
        if (parameter.syntax != null) {
            application.typed.set(parameter.name, { value, syntax: parameter.syntax, property: null, entry: null });
        }
    }
    return true;
}
/**
 * create the registered custom property of a typed argument
 * ```css
 * @property --same-size-size-1 { syntax: "<length>"; inherits: true; initial-value: 0px }
 * ```
 * @param arena
 * @param property
 */
function registerProperty(arena, property) {
    const node = arena.createAtRule(EnumToken.AtRuleNodeType, "property", property.name, true, [arena.createToken(EnumToken.DashedIdenTokenType, property.name)], EnumAstNodeStatus.Validated, null);
    arena.appendChildList(node, parseDeclarations(`syntax:${JSON.stringify(property.syntax)};inherits:true;initial-value:${property.initialValue}`, arena).nodes);
    return node;
}
/**
 * true if a mixin applies itself, directly or through the mixins it applies: it cannot be evaluated
 * @param arena
 * @param name
 * @param state
 * @param stack mixins being checked
 */
function isRecursive(arena, name, state, stack = []) {
    if (stack.includes(name)) {
        return true;
    }
    if (state.recursive.has(name)) {
        return state.recursive.get(name);
    }
    const definitions = state.definitions.get(name) ?? [];
    let result = false;
    stack.push(name);
    for (const definition of definitions) {
        for (const id of arena.walk(definition.node)) {
            if (id !== definition.node && isAtRule(arena, id, "apply")) {
                const reference = parseApply(arena, id);
                if (reference != null && isRecursive(arena, reference.name, state, stack)) {
                    result = true;
                    break;
                }
            }
        }
        if (result) {
            break;
        }
    }
    stack.pop();
    // a mixin that reaches one of the mixins being checked is part of a cycle
    state.recursive.set(name, result);
    return result;
}
/**
 * replace an `@apply` rule with the evaluated body of the mixin. the `@apply` rule is left as is when it cannot be
 * evaluated
 * @param arena
 * @param node
 * @param state
 * @returns the inserted nodes, null when the `@apply` rule is not evaluated
 */
function apply(arena, node, state) {
    const reference = parseApply(arena, node);
    if (reference == null) {
        return null;
    }
    // the mixins visible from the `@apply` rule: a mixin defined in a rule or an at-rule is not visible outside of it.
    // the mixin is defined only once in the innermost scope that defines it
    const definitions = resolveDefinitions(arena, state.definitions.get(reference.name), node);
    const definition = definitions.length === 1 ? definitions[0] : null;
    const properties = ruleProperties(arena, node);
    const chain = state.chains.get(node) ?? [];
    if (definition == null ||
        properties == null ||
        // a mixin that applies itself
        isRecursive(arena, reference.name, state) ||
        chain.includes(reference.name) ||
        chain.length >= MAX_DEPTH) {
        // the visible definitions are kept
        for (const visible of definitions) {
            state.pending.add(visible.node);
        }
        return null;
    }
    // the contents block is a declaration list. its variables are not private variables: they are not substituted
    const contents = arena.flags[node] & EnumAstNodeStatus.HasChildren
        ? serializeDeclarations(arena, node, new MixinScope([{ privates: new Map(), relation: SELF }], new MixinApplication(reference.name, new Map(), null, null), new Set()))
        : null;
    const application = new MixinApplication(reference.name, properties, contents, state.names, state.registry);
    // the arguments are evaluated in the context of the `@apply` rule
    const caller = new MixinScope([{ privates: new Map(), relation: SELF }], new MixinApplication(reference.name, properties, null, null), new Set());
    const scope = new MixinScope([{ privates: new Map(), relation: SELF }], application, collectMasked(arena, definition.node));
    if (!bindParameters(arena, definition, reference.args, caller, scope, state.options)) {
        state.pending.add(definition.node);
        return null;
    }
    // the custom functions called by the mixin body are evaluated in the context of the `@apply` rule
    state.registry.site = node;
    const failed = state.registry.failed;
    let css = serializeBlock(arena, definition.node, scope);
    // a typed argument cannot be registered, or a custom function call is not evaluated
    if (application.failed || state.registry.failed !== failed) {
        state.pending.add(definition.node);
        return null;
    }
    if (application.registered.length > 0) {
        // the top level node that contains the `@apply` rule
        let top = node;
        while (arena.parents[top] !== state.ast && arena.parents[top] !== 0) {
            top = arena.parents[top];
        }
        let declarations = "";
        for (const property of application.registered) {
            const registered = registerProperty(arena, property);
            locate(arena, registered, node);
            arena.insertBefore(top, registered);
            // the value is computed on the element the mixin is applied to
            declarations += property.name + ":" + property.value + ";";
        }
        css = declarations + css;
    }
    // the body is parsed as the content of the rule the mixin is applied to: '&' is that rule
    const nodes = parseRuleContent(css, arena, state.options);
    const nested = chain.concat(reference.name);
    for (const child of nodes) {
        locate(arena, child, node);
        arena.insertBefore(node, child);
        // the `@apply` rules of the mixin body
        for (const id of arena.walk(child)) {
            if (isAtRule(arena, id, "apply")) {
                state.chains.set(id, nested);
            }
        }
    }
    arena.detach(node);
    return nodes;
}
/**
 * the definitions that are kept:
 * - the mixins and the custom functions referenced by an `@apply` rule or a call that is not evaluated
 * - the custom functions that are not called
 * - the definitions referenced by the definitions that are kept or not valid: a mixin that is kept may apply a mixin or
 *   call a function that is evaluated. the references are resolved from their location, see {@link resolveDefinitions}
 *
 * the mixins that are not referenced are dropped
 * @param arena
 * @param state
 * @param registry
 */
function keptDefinitions(arena, state, registry) {
    const kept = new Set([...state.pending, ...registry.pending]);
    for (const definitions of registry.definitions.values()) {
        for (const definition of definitions) {
            if (!registry.evaluated.has(definition.node)) {
                kept.add(definition.node);
            }
        }
    }
    const queue = [...kept, ...state.invalid];
    while (queue.length > 0) {
        const node = queue.pop();
        const referenced = [];
        for (const id of arena.walk(node)) {
            if (id !== node && isAtRule(arena, id, "apply")) {
                const reference = parseApply(arena, id);
                if (reference != null) {
                    for (const definition of resolveDefinitions(arena, state.definitions.get(reference.name), id)) {
                        referenced.push(definition.node);
                    }
                }
            }
            for (const call of findCalls(arena, arena.tokens(id))) {
                const name = arena.resolveString(arena.stringValue[call]);
                for (const definition of resolveDefinitions(arena, registry.definitions.get(name), id)) {
                    referenced.push(definition.node);
                }
            }
        }
        for (const definition of referenced) {
            if (!kept.has(definition)) {
                kept.add(definition);
                queue.push(definition);
            }
        }
    }
    return kept;
}
/**
 * evaluate the mixins and the custom functions of a stylesheet
 * @param arena
 * @param ast
 * @param options
 */
function evaluate(arena, ast, options) {
    const invalidMixins = [];
    const invalidFunctions = [];
    const registry = new FunctionRegistry(collectDefinitions(arena, ast, "function", parseFunction, new Map(), invalidFunctions), options);
    const state = {
        definitions: collectDefinitions(arena, ast, "mixin", parseMixin, new Map(), invalidMixins),
        invalid: invalidMixins,
        pending: new Set(),
        chains: new Map(),
        recursive: new Map(),
        ast,
        registry,
        names: new Set(),
        options,
    };
    // the custom functions that are not valid are dropped
    for (const node of invalidFunctions) {
        arena.detach(node);
    }
    if (state.definitions.size === 0 && registry.definitions.size === 0) {
        return;
    }
    if (state.definitions.size > 0) {
        for (const id of arena.walk(ast)) {
            if (isCustomProperty(arena, id)) {
                state.names.add(arena.resolveString(arena.name[id]));
            }
            else if (isAtRule(arena, id, "property")) {
                state.names.add(arena.resolveString(arena.stringValue[id]).trim());
            }
        }
        // depth first traversal, in document order
        const stack = [];
        for (let child = arena.lastChild[ast]; child !== 0; child = arena.previousSibling[child]) {
            stack.push(child);
        }
        while (stack.length > 0) {
            const node = stack.pop();
            if (arena.dataTypes[node] === EnumToken.AtRuleNodeType) {
                // the mixin and the function bodies are evaluated when they are used
                if (isAtRule(arena, node, "mixin") || isAtRule(arena, node, "function")) {
                    continue;
                }
                if (isAtRule(arena, node, "apply")) {
                    const nodes = apply(arena, node, state);
                    if (nodes != null) {
                        // the mixin body may apply other mixins
                        for (let i = nodes.length - 1; i >= 0; i--) {
                            stack.push(nodes[i]);
                        }
                        continue;
                    }
                }
            }
            if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                for (let child = arena.lastChild[node]; child !== 0; child = arena.previousSibling[child]) {
                    stack.push(child);
                }
            }
        }
    }
    // the custom function calls, including the calls of the evaluated mixins
    if (registry.definitions.size > 0) {
        evaluateFunctions(arena, ast, registry);
    }
    const kept = keptDefinitions(arena, state, registry);
    finalizeDefinitions(arena, ast, "mixin", kept, !!options.keepMixins, invalidMixins);
    finalizeDefinitions(arena, ast, "function", kept, !!options.keepMixins, []);
}
/**
 * Evaluate the css mixins and the custom functions: the `@apply` rules are replaced by the body of the mixin they
 * reference, the custom function calls are replaced by the result of the function.
 * the feature is enabled with the {@link ParserOptions.evaluateMixins} option.
 *
 * https://drafts.csswg.org/css-mixins-1/
 *
 * ```ts
 * import {transform} from '@tbela99/css-parser';
 *
 * const css = `
 * @mixin --only-descs(--arg) {
 *   color: var(--arg);
 *   & * { color: var(--arg, red); }
 *   & + * { color: var(--arg, red); }
 * }
 * .foo {
 *   @apply --only-descs(green);
 * }
 * `;
 *
 * const result = await transform(css, {evaluateMixins: true, expandNestingRules: true, beautify: true});
 *
 * console.log(result.code);
 * // .foo,.foo * {
 * //  color: green
 * // }
 * // .foo+* {
 * //  color: red
 * // }
 * ```
 */
class EvaluateMixinFeature {
    accept = new Set([EnumToken.StyleSheetNodeType]);
    get ordering() {
        return 0;
    }
    get processMode() {
        return FeatureWalkMode.Pre;
    }
    static register(options) {
        if (options.evaluateMixins) {
            // @ts-ignore
            options.features.push(new EvaluateMixinFeature());
        }
    }
    /**
     * evaluate the mixins of a stylesheet
     * @param arena
     * @param ast
     * @param options
     */
    static evaluate(arena, ast, options = {}) {
        evaluate(arena, ast, options);
    }
    /**
     *
     * @param arena
     * @param ast
     * @param options
     */
    run(arena, ast, options = {}) {
        evaluate(arena, ast, options);
        return null;
    }
}

export { EvaluateMixinFeature };
