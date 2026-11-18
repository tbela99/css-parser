/**
 * Evaluate the css mixins: the `@apply` rules are replaced by the body of the mixin they reference.
 *
 * https://drafts.csswg.org/css-mixins-1/#mixin-rule
 *
 * ```css
 * @mixin --shadowed-values(--color2: green, --color3: green) {
 *   @private { --color3: blue; }
 *   background: linear-gradient(var(--color1), var(--color2), var(--color3));
 * }
 * p {
 *   --color1: red;
 *   --color2: red;
 *   --color3: red;
 *   @apply --shadowed-values();
 * }
 * ```
 *
 * the `@apply` rule is replaced by
 *
 * ```css
 *   background: linear-gradient(red, green, blue);
 * ```
 *
 * the private variables (the custom properties visible to the mixin body) are substituted with a copy of their value.
 * by order of precedence:
 * - the custom properties declared with `@private`
 * - the mixin arguments and the default values of the mixin parameters
 * - the custom properties declared in the rule that contains the `@apply` rule
 *
 * the private variables of the mixin are only seen by the rule the mixin is applied to and its descendants (`&`,
 * `& *`, `& > *`, ...). they are undefined for its siblings (`& + *`, `& ~ *`, ...). the private variables of a nested
 * rule (`@private`) are private variables of its nested rules: each nested rule has its own context.
 *
 * a value that is not valid (a variable that is not defined and has no fallback, a dependency cycle) is left as is. a
 * mixin that is not valid (its parameters are not unique, ...) is ignored: it is left as is.
 *
 * the value of a typed argument (`--size <length>`) is computed on the element the mixin is applied to, the
 * descendants inherit the computed value: the value is stored in a registered custom property, see
 * {@link TypedArgument}.
 *
 * `@contents` is replaced with a copy of the contents block of the `@apply` rule (a declaration list). otherwise it is
 * replaced with a copy of its own block (the default contents), or it is removed. the content of `@result` is the
 * result of the mixin.
 *
 * an `@apply` rule is evaluated when
 * - the mixin is visible from the `@apply` rule: a mixin defined in a rule or an at-rule (`@media`, `@supports`,
 *   `@layer`, ...) is only visible inside of it, it hides the mixins with the same name of the outer scopes. it is
 *   defined only once in that scope. the mixins that contain conditional rules are evaluated
 * - the arguments match the mixin parameters: no extra argument, every parameter without default value has an
 *   argument, the arguments and the default values match the type of the parameter
 * - the custom functions called by the mixin body are evaluated
 * - the mixin does not apply itself, directly or through other mixins
 *
 * otherwise it is left as is. the comments and the whitespace of the arguments are ignored: a mixin applied with
 * comments only in the arguments list is applied without arguments.
 *
 * the evaluated mixins and the mixins that are not referenced are replaced with a comment, unless
 * {@link ParserOptions.keepMixins} is set. the mixins that are kept are reduced to their last definition in the same
 * scope
 *
 * @module
 * @internal
 */
import type { AstNode, AstStyleSheet, ParserOptions, Token } from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";
import { splitRule } from "../minify.ts";
import { parseDeclarations, parseRuleContent } from "../../parser/parse.ts";
import {
    type FunctionEvaluator,
    type Parameter,
    type VariableEntry,
    type VariableScope,
    declarationValue,
    firstToken,
    isAtRule,
    isCustomProperty,
    matchesType,
    parseArguments,
    parseParameters,
    render,
    resolve,
    ruleProperties,
    splitArguments,
    substitute,
    trim,
    UNDEFINED,
    collectDefinitions,
    finalizeDefinitions,
    resolveDefinitions,
    RuleScope,
} from "../mixins/variables.ts";
import {
    evaluateFunctions,
    findCalls,
    FunctionRegistry,
    parseFunction,
} from "../mixins/custom-function.ts";

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
 * variables declared by a rule of the mixin body (or by the mixin body itself)
 */
interface ScopeLevel {
    /**
     * custom properties declared with `@private`
     */
    privates: Map<string, VariableEntry>;

    /**
     * relation of the subject of the current rule to the subject of the rule that declares the variables
     */
    relation: number;
}

/**
 * mixin definition
 */
interface MixinDefinition {
    node: AstNode;
    name: string;
    parameters: Parameter[];

}

/**
 * evaluation state
 */
interface EvaluationState {
    /**
     * valid mixin definitions by name, in document order
     */
    definitions: Map<string, MixinDefinition[]>;

    /**
     * the mixins that are not valid: they are ignored and left as is
     */
    invalid: AstNode[];

    /**
     * the mixin definitions referenced by the `@apply` rules that have not been evaluated: they are kept
     */
    pending: Set<AstNode>;

    /**
     * mixins being applied, for each `@apply` rule generated by a mixin: recursion detection
     */
    chains: Map<AstNode, string[]>;

    /**
     * the mixins that apply themselves, directly or through other mixins
     */
    recursive: Map<string, boolean>;

    /**
     * the stylesheet
     */
    ast: AstNode;

    /**
     * the custom functions: the calls of the mixin bodies are evaluated with the mixins
     */
    registry: FunctionRegistry;

    /**
     * names of the custom properties of the stylesheet: the names of the registered custom properties are unique
     */
    names: Set<string>;

    options: ParserOptions;
}

/**
 * typed argument: its value is computed on the element the mixin is applied to, the descendants inherit the computed
 * value. `--size <length>` with the value `1em` is the font size of the element, it is not the font size of the
 * descendants. the value is stored in a registered custom property declared on the element:
 *
 * ```css
 * @mixin --same-size(--size <length>) {
 *   &, & > * { width: calc(10 * var(--size)); }
 * }
 * .parent {
 *   font-size: 10px;
 *   @apply --same-size(1em);
 * }
 * ```
 *
 * is evaluated as
 *
 * ```css
 * @property --same-size-size-1 { syntax: "<length>"; inherits: true; initial-value: 0px }
 * .parent {
 *   font-size: 10px;
 *   --same-size-size-1: 1em;
 *   & { width: calc(10 * 1em) }
 *   & > * { width: calc(10 * var(--same-size-size-1)) }
 * }
 * ```
 *
 * the registered custom property is named after the mixin and the parameter. the argument is not evaluated when its
 * type cannot be registered (`<image>`, ...)
 */
interface TypedArgument {
    /**
     * value computed on the element the mixin is applied to
     */
    value: string;

    /**
     * syntax of the parameter type
     */
    syntax: string;

    /**
     * registered custom property. allocated when the argument is referenced by a descendant
     */
    property: string | null;

    /**
     * variable that references the registered custom property
     */
    entry: VariableEntry | null;
}

/**
 * registered custom property of a typed argument
 */
interface RegisteredProperty {
    name: string;
    syntax: string;
    initialValue: string;
    value: string;
}

/**
 * application of a mixin: the variables shared by the scopes of the mixin body
 */
class MixinApplication {
    /**
     * mixin arguments and default values
     */
    public readonly args: Map<string, VariableEntry> = new Map();

    /**
     * the typed arguments that depend on the element the mixin is applied to
     */
    public readonly typed: Map<string, TypedArgument> = new Map();

    /**
     * registered custom properties of the typed arguments
     */
    public readonly registered: RegisteredProperty[] = [];

    /**
     * the mixin cannot be evaluated: a typed argument cannot be registered
     */
    public failed: boolean = false;

    /**
     * the variables visible from the bodies of the custom functions called by the mixin body: the custom properties
     * of the rule. the private variables are not visible
     */
    public readonly dynamic: RuleScope;

    /**
     * @param name mixin name
     * @param properties custom properties declared in the rule the mixin is applied to
     * @param contents serialized contents block of the `@apply` rule. null when the `@apply` rule has no contents block
     * @param names names of the custom properties of the stylesheet
     * @param registry the custom function calls of the mixin body are evaluated. null when they are not evaluated
     */
    constructor(
        public readonly name: string,
        public readonly properties: Map<string, VariableEntry>,
        public readonly contents: string | null,
        private readonly names: Set<string> | null,
        public readonly registry: FunctionRegistry | null = null,
    ) {
        this.dynamic = new RuleScope(properties, registry);
    }

    /**
     * variable that references the registered custom property of a typed argument. null when the argument cannot be
     * registered
     * @param name
     */
    typedEntry(name: string): VariableEntry | null {
        const argument: TypedArgument = this.typed.get(name)!;

        if (argument.entry == null) {
            const initialValue: string | null = initialValueOf(argument.syntax);

            if (initialValue == null || this.names == null) {
                this.failed = true;
                return null;
            }

            const prefix: string = `--${this.name.slice(2)}-${name.slice(2)}-`;
            let index: number = 1;

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
class MixinScope implements VariableScope {
    /**
     * the custom function calls of the mixin body are evaluated with the mixin
     */
    get functions(): FunctionEvaluator | null {
        return this.application.registry;
    }

    /**
     * the custom functions see the custom properties of the rule, not the private variables
     */
    get dynamic(): VariableScope {
        return this.application.dynamic;
    }

    /**
     * @param levels variables declared by the mixin body and the rules that contain the current node, outer first
     * @param application the mixin application
     * @param masked custom properties declared in the mixin body: they override the rule custom properties
     */
    constructor(
        public readonly levels: ScopeLevel[],
        public readonly application: MixinApplication,
        public readonly masked: Set<string>,
    ) {}

    /**
     * the subject of the current rule is a descendant of the element the mixin is applied to
     */
    get descendant(): boolean {
        return this.levels[0].relation === DESCENDANT;
    }

    /**
     * scope of a nested rule
     * @param relation relation of the subject of the nested rule to the subject of the current rule
     * @param masked custom properties declared in the nested rule
     */
    child(relation: number, masked: Set<string>): MixinScope {
        const levels: ScopeLevel[] = this.levels.map(
            (level: ScopeLevel): ScopeLevel => ({
                privates: level.privates,
                relation: compose(level.relation, relation),
            }),
        );

        levels.push({ privates: new Map(), relation: SELF });

        return new MixinScope(
            levels,
            this.application,
            masked.size === 0 ? this.masked : new Set([...this.masked, ...masked]),
        );
    }

    /**
     * find a variable
     * - the variable entry
     * - {@link UNDEFINED} if the variable is a private variable that is not visible
     * - null if the variable is not a private variable: the var() function is evaluated by the browser
     * @param name
     * @param descendant the variable is referenced by a descendant of the element the mixin is applied to
     */
    lookup(name: string, descendant: boolean): VariableEntry | typeof UNDEFINED | null {
        // the inner declarations override the outer declarations. the private variables of a nested rule are private
        // variables of its nested rules: each nested rule has its own context
        for (let i = this.levels.length - 1; i > 0; i--) {
            const entry: VariableEntry | undefined = this.levels[i].privates.get(name);

            if (entry !== undefined) {
                return entry;
            }
        }

        // the private variables of the mixin body are not visible from the siblings of the element the mixin is
        // applied to
        const visible: boolean = this.levels[0].relation !== OUTSIDE;
        const isPrivate: boolean = this.levels[0].privates.has(name);

        if (isPrivate && visible) {
            return this.levels[0].privates.get(name)!;
        }

        const application: MixinApplication = this.application;

        if (application.args.has(name)) {
            if (!visible) {
                return UNDEFINED;
            }

            // the descendants inherit the value computed on the element
            if (descendant && application.typed.has(name)) {
                return application.typedEntry(name) ?? application.args.get(name)!;
            }

            return application.args.get(name)!;
        }

        if (isPrivate) {
            return UNDEFINED;
        }

        // the custom properties of the rule the mixin is applied to. the descendants inherit them
        if (visible && !this.masked.has(name) && application.properties.has(name)) {
            return application.properties.get(name)!;
        }

        return null;
    }
}

/**
 * initial value of a registered custom property: a computationally independent value that matches the syntax.
 * null when the syntax is not supported
 * @param syntax
 */
function initialValueOf(syntax: string): string | null {
    const defaults: Record<string, string> = {
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
        const match: RegExpMatchArray | null = component.trim().match(/^(?:<([a-z-]+)>|([a-z][a-z0-9-]*))[+#]?$/i);

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
function compose(outer: number, relation: number): number {
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
function collectMasked(arena: AstArena, node: AstNode, result: Set<string> = new Set()): Set<string> {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (isCustomProperty(arena, child)) {
            result.add(arena.resolveString(arena.name[child]));
        } else if (
            arena.dataTypes[child] === EnumToken.AtRuleNodeType &&
            arena.flags[child] & EnumAstNodeStatus.HasChildren &&
            !isAtRule(arena, child, "private")
        ) {
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
function declarePrivates(arena: AstArena, node: AstNode, scope: MixinScope): void {
    const privates: Map<string, VariableEntry> = scope.levels[scope.levels.length - 1].privates;

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
function hasNestedRules(arena: AstArena, node: AstNode): boolean {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (
            arena.dataTypes[child] === EnumToken.RuleNodeType ||
            (arena.dataTypes[child] === EnumToken.AtRuleNodeType &&
                arena.flags[child] & EnumAstNodeStatus.HasChildren &&
                hasNestedRules(arena, child))
        ) {
            return true;
        }
    }

    return false;
}

/**
 * true if the compound selector part references the nesting selector: `&`, `:is(&)`, `:where(&)`
 * @param part
 */
function isNestingPart(part: string): boolean {
    return part === "&" || /^:(is|where)\(\s*&\s*\)$/i.test(part);
}

/**
 * relation of the subject of a nested selector to the subject of the rule that contains it
 * @param parts complex selector parts, see {@link splitRule}
 */
function selectorRelation(parts: string[]): number {
    const compounds: string[][] = [[]];
    const combinators: string[] = [];
    let whitespace: boolean = false;

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

    let index: number = -1;

    for (let i = compounds.length - 1; i >= 0; i--) {
        if (compounds[i].some(isNestingPart)) {
            index = i;
            break;
        }
    }

    if (index === -1) {
        // '&' used in a way that is not handled: `:not(&)`, `:has(+ &)`. the relation is unknown
        if (parts.some((part: string): boolean => part.includes("&"))) {
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
function serializeDeclaration(arena: AstArena, declaration: AstNode, scope: MixinScope): string {
    const name: string = arena.resolveString(arena.name[declaration]);

    if (scope.application.registry != null) {
        scope.application.registry.customProperty = arena.startsWith(declaration, "nam", "--");
    }

    // a custom property is inherited by the descendants: a typed argument is the value computed on the element
    const value: string | null = substitute(
        arena,
        arena.tokens(declaration),
        scope,
        scope.descendant || arena.startsWith(declaration, "nam", "--"),
    );

    // an invalid value is left as is
    return name + ":" + (value ?? render(arena, arena.tokens(declaration)));
}

/**
 * serialize an `@apply` rule of a mixin body. its arguments may reference the private variables
 * @param arena
 * @param node
 * @param scope
 */
function serializeApply(arena: AstArena, node: AstNode, scope: MixinScope): string {
    const tokens: Token[] = arena.tokens(node);
    const reference: Token | null = firstToken(arena, tokens);
    let prelude: string;

    if (reference != null && arena.dataTypes[reference] === EnumToken.CustomFunctionTokenType) {
        // the arguments are substituted one by one: an invalid argument is kept
        prelude =
            arena.resolveString(arena.stringValue[reference]) +
            "(" +
            splitArguments(arena, arena.tokens(reference))
                .map((arg: Token[]): string => substitute(arena, arg, scope, scope.descendant) ?? render(arena, arg))
                .join(",") +
            ")";
    } else {
        prelude = render(arena, trim(arena, tokens));
    }

    return (
        "@apply " +
        prelude +
        (arena.flags[node] & EnumAstNodeStatus.HasChildren
            ? "{" + serializeDeclarations(arena, node, scope) + "}"
            : ";")
    );
}

/**
 * serialize the declarations of a contents block: `@apply --mixin { color: red }`, `@contents { color: red }`
 * @param arena
 * @param node
 * @param scope
 */
function serializeDeclarations(arena: AstArena, node: AstNode, scope: MixinScope): string {
    let result: string = "";

    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.DeclarationNodeType) {
            result += serializeDeclaration(arena, child, scope) + ";";
        } else if (isAtRule(arena, child, "contents")) {
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
function serializeContents(arena: AstArena, node: AstNode, scope: MixinScope): string {
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
function serializeRule(arena: AstArena, rule: AstNode, scope: MixinScope): string {
    const groups: Map<number, string[]> = new Map();
    // the element and its descendants see the same variables, unless the rule has nested rules (the relation of the
    // nested rules depends on it) or a typed argument is computed on the element (the descendants inherit it)
    const merge: boolean = !hasNestedRules(arena, rule) && scope.application.typed.size === 0;

    for (const parts of splitRule(arena.resolveString(arena.name[rule]))) {
        let relation: number = selectorRelation(parts);

        if (merge && relation === DESCENDANT) {
            relation = SELF;
        }

        if (!groups.has(relation)) {
            groups.set(relation, []);
        }

        groups.get(relation)!.push(parts.join(""));
    }

    let result: string = "";
    const masked: Set<string> = collectMasked(arena, rule);

    for (const [relation, selectors] of groups) {
        const child: MixinScope = scope.child(relation, masked);

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
function serializeBlock(arena: AstArena, node: AstNode, scope: MixinScope): string {
    let result: string = "";

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

                const prelude: string = arena.resolveString(arena.stringValue[child]);

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
function locate(arena: AstArena, node: AstNode, location: AstNode): void {
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
function parseMixin(arena: AstArena, node: AstNode): MixinDefinition | null {
    const reference: Token | null = firstToken(arena, arena.tokens(node));

    if (reference == null) {
        return null;
    }

    let parameters: Parameter[] | null = [];

    if (arena.dataTypes[reference] === EnumToken.CustomFunctionTokenType) {
        parameters = parseParameters(arena, reference);

        if (parameters == null) {
            return null;
        }
    } else if (arena.dataTypes[reference] !== EnumToken.DashedIdenTokenType) {
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
function parseApply(arena: AstArena, node: AstNode): { name: string; args: Token[][] } | null {
    const reference: Token | null = firstToken(arena, arena.tokens(node));

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
function bindParameters(
    arena: AstArena,
    definition: MixinDefinition,
    args: Token[][],
    caller: MixinScope,
    scope: MixinScope,
    options: ParserOptions,
): boolean {
    const application: MixinApplication = scope.application;

    if (args.length > definition.parameters.length) {
        return false;
    }

    for (let index = 0; index < definition.parameters.length; index++) {
        const parameter: Parameter = definition.parameters[index];

        if (index < args.length) {
            application.args.set(parameter.name, {
                tokens: null,
                text: substitute(arena, args[index], caller, false),
                scope,
            });
        } else if (parameter.defaultValue != null) {
            // the default value may reference the other variables: it is resolved once the variables are declared
            application.args.set(parameter.name, { tokens: parameter.defaultValue, scope });
        } else {
            return false;
        }
    }

    // the private variables may be referenced by the default values
    declarePrivates(arena, definition.node, scope);

    for (const parameter of definition.parameters) {
        const value: string | null = resolve(arena, application.args.get(parameter.name)!, false);

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
function registerProperty(arena: AstArena, property: RegisteredProperty): AstNode {
    const node: AstNode = arena.createAtRule(
        EnumToken.AtRuleNodeType,
        "property",
        property.name,
        true,
        [arena.createToken(EnumToken.DashedIdenTokenType, property.name)],
        EnumAstNodeStatus.Validated,
        null,
    );

    arena.appendChildList(
        node,
        parseDeclarations(
            `syntax:${JSON.stringify(property.syntax)};inherits:true;initial-value:${property.initialValue}`,
            arena,
        ).nodes,
    );

    return node;
}

/**
 * true if a mixin applies itself, directly or through the mixins it applies: it cannot be evaluated
 * @param arena
 * @param name
 * @param state
 * @param stack mixins being checked
 */
function isRecursive(arena: AstArena, name: string, state: EvaluationState, stack: string[] = []): boolean {
    if (stack.includes(name)) {
        return true;
    }

    if (state.recursive.has(name)) {
        return state.recursive.get(name)!;
    }

    const definitions: MixinDefinition[] = state.definitions.get(name) ?? [];
    let result: boolean = false;

    stack.push(name);

    for (const definition of definitions) {
        for (const id of arena.walk(definition.node)) {
            if (id !== definition.node && isAtRule(arena, id, "apply")) {
                const reference: { name: string; args: Token[][] } | null = parseApply(arena, id);

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
function apply(arena: AstArena, node: AstNode, state: EvaluationState): AstNode[] | null {
    const reference: { name: string; args: Token[][] } | null = parseApply(arena, node);

    if (reference == null) {
        return null;
    }

    // the mixins visible from the `@apply` rule: a mixin defined in a rule or an at-rule is not visible outside of it.
    // the mixin is defined only once in the innermost scope that defines it
    const definitions: MixinDefinition[] = resolveDefinitions(arena, state.definitions.get(reference.name), node);
    const definition: MixinDefinition | null = definitions.length === 1 ? definitions[0] : null;
    const properties: Map<string, VariableEntry> | null = ruleProperties(arena, node);
    const chain: string[] = state.chains.get(node) ?? [];

    if (
        definition == null ||
        properties == null ||
        // a mixin that applies itself
        isRecursive(arena, reference.name, state) ||
        chain.includes(reference.name) ||
        chain.length >= MAX_DEPTH
    ) {
        // the visible definitions are kept
        for (const visible of definitions) {
            state.pending.add(visible.node);
        }

        return null;
    }

    // the contents block is a declaration list. its variables are not private variables: they are not substituted
    const contents: string | null =
        arena.flags[node] & EnumAstNodeStatus.HasChildren
            ? serializeDeclarations(
                  arena,
                  node,
                  new MixinScope(
                      [{ privates: new Map(), relation: SELF }],
                      new MixinApplication(reference.name, new Map(), null, null),
                      new Set(),
                  ),
              )
            : null;
    const application: MixinApplication = new MixinApplication(
        reference.name,
        properties,
        contents,
        state.names,
        state.registry,
    );
    // the arguments are evaluated in the context of the `@apply` rule
    const caller: MixinScope = new MixinScope(
        [{ privates: new Map(), relation: SELF }],
        new MixinApplication(reference.name, properties, null, null),
        new Set(),
    );
    const scope: MixinScope = new MixinScope(
        [{ privates: new Map(), relation: SELF }],
        application,
        collectMasked(arena, definition.node),
    );

    if (!bindParameters(arena, definition, reference.args, caller, scope, state.options)) {
        state.pending.add(definition.node);
        return null;
    }

    // the custom functions called by the mixin body are evaluated in the context of the `@apply` rule
    state.registry.site = node;

    const failed: number = state.registry.failed;
    let css: string = serializeBlock(arena, definition.node, scope);

    // a typed argument cannot be registered, or a custom function call is not evaluated
    if (application.failed || state.registry.failed !== failed) {
        state.pending.add(definition.node);
        return null;
    }


    if (application.registered.length > 0) {
        // the top level node that contains the `@apply` rule
        let top: AstNode = node;

        while (arena.parents[top] !== state.ast && arena.parents[top] !== 0) {
            top = arena.parents[top];
        }

        let declarations: string = "";

        for (const property of application.registered) {
            const registered: AstNode = registerProperty(arena, property);

            locate(arena, registered, node);
            arena.insertBefore(top, registered);
            // the value is computed on the element the mixin is applied to
            declarations += property.name + ":" + property.value + ";";
        }

        css = declarations + css;
    }

    // the body is parsed as the content of the rule the mixin is applied to: '&' is that rule
    const nodes: AstNode[] = parseRuleContent(css, arena, state.options);
    const nested: string[] = chain.concat(reference.name);

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
function keptDefinitions(arena: AstArena, state: EvaluationState, registry: FunctionRegistry): Set<AstNode> {
    const kept: Set<AstNode> = new Set([...state.pending, ...registry.pending]);

    for (const definitions of registry.definitions.values()) {
        for (const definition of definitions) {
            if (!registry.evaluated.has(definition.node)) {
                kept.add(definition.node);
            }
        }
    }

    const queue: AstNode[] = [...kept, ...state.invalid];

    while (queue.length > 0) {
        const node: AstNode = queue.pop()!;
        const referenced: AstNode[] = [];

        for (const id of arena.walk(node)) {
            if (id !== node && isAtRule(arena, id, "apply")) {
                const reference: { name: string; args: Token[][] } | null = parseApply(arena, id);

                if (reference != null) {
                    for (const definition of resolveDefinitions(arena, state.definitions.get(reference.name), id)) {
                        referenced.push(definition.node);
                    }
                }
            }

            for (const call of findCalls(arena, arena.tokens(id))) {
                const name: string = arena.resolveString(arena.stringValue[call]);

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
function evaluate(arena: AstArena, ast: AstNode, options: ParserOptions): void {
    const invalidMixins: AstNode[] = [];
    const invalidFunctions: AstNode[] = [];
    const registry: FunctionRegistry = new FunctionRegistry(
        collectDefinitions(arena, ast, "function", parseFunction, new Map(), invalidFunctions),
        options,
    );
    const state: EvaluationState = {
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
            } else if (isAtRule(arena, id, "property")) {
                state.names.add(arena.resolveString(arena.stringValue[id]).trim());
            }
        }

        // depth first traversal, in document order
        const stack: AstNode[] = [];

        for (let child = arena.lastChild[ast]; child !== 0; child = arena.previousSibling[child]) {
            stack.push(child);
        }

        while (stack.length > 0) {
            const node: AstNode = stack.pop()!;

            if (arena.dataTypes[node] === EnumToken.AtRuleNodeType) {
                // the mixin and the function bodies are evaluated when they are used
                if (isAtRule(arena, node, "mixin") || isAtRule(arena, node, "function")) {
                    continue;
                }

                if (isAtRule(arena, node, "apply")) {
                    const nodes: AstNode[] | null = apply(arena, node, state);

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

    const kept: Set<AstNode> = keptDefinitions(arena, state, registry);

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
export class EvaluateMixinFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.StyleSheetNodeType]);

    get ordering(): number {
        return 0;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Pre;
    }

    static register(options: ParserOptions): void {
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
    static evaluate(arena: AstArena, ast: AstStyleSheet, options: ParserOptions = {}): void {
        evaluate(arena, ast, options);
    }

    /**
     *
     * @param arena
     * @param ast
     * @param options
     */
    run(arena: AstArena, ast: AstStyleSheet, options: ParserOptions = {}): AstNode | null {
        evaluate(arena, ast, options);
        return null;
    }
}
