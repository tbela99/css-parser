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
import type { AstNode, AstStyleSheet, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";
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
export declare class EvaluateMixinFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     * evaluate the mixins of a stylesheet
     * @param arena
     * @param ast
     * @param options
     */
    static evaluate(arena: AstArena, ast: AstStyleSheet, options?: ParserOptions): void;
    /**
     *
     * @param arena
     * @param ast
     * @param options
     */
    run(arena: AstArena, ast: AstStyleSheet, options?: ParserOptions): AstNode | null;
}
