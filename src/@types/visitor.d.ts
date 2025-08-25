import {AstAtRule, AstDeclaration, AstRule} from "./ast.d.ts";

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = (node: AstDeclaration) => (AstDeclaration | AstDeclaration[] | null | Promise<AstDeclaration> | Promise<AstDeclaration[]> | Promise<null>);
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = (node: AstRule) => (AstRule | AstRule[] | null | Promise<AstRule> | Promise<AstRule[]> | Promise<null>);

/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = (node: AstAtRule) => (AstAtRule | AstAtRule[] | null | Promise<AstAtRule> | Promise<AstAtRule[]> | Promise<null>);

/**
 * node visitor callback map
 *
 */
export declare interface VisitorNodeMap {

    /**
     * at rule visitor
     *
     * Example: change media at-rule prelude
     *
     * ```ts
     *
     * import {transform, AstAtRule, ParserOptions} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         AtRule: {
     *
     *             media: (node: AstAtRule): AstAtRule => {
     *
     *                 node.val = 'tv,screen';
     *                 return node
     *             }
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * @media screen {
     *
     *     .foo {
     *
     *             height: calc(100px * 2/ 15);
     *     }
     * }
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // @media tv,screen{.foo{height:calc(40px/3)}}
     * ```
     */
    AtRule?: Record<string, AtRuleVisitorHandler> | AtRuleVisitorHandler;
    /**
     * declaration visitor
     *
     *  Example: add 'width: 3px' everytime a declaration with the name 'height' is found
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Declaration: {
     *
     *             // called only for height declaration
     *             height: (node: AstDeclaration): AstDeclaration[] => {
     *
     *
     *                 return [
     *                     node,
     *                     {
     *
     *                         typ: EnumToken.DeclarationNodeType,
     *                         nam: 'width',
     *                         val: [
     *                             <LengthToken>{
     *                                 typ: EnumToken.LengthTokenType,
     *                                 val: 3,
     *                                 unit: 'px'
     *                             }
     *                         ]
     *                     }
     *                 ];
     *             }
     *            }
     *         }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     * }
     * .selector {
     * color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180))
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
     * ```
     *
     * Example: rename 'margin' to 'padding' and 'height' to 'width'
     *
     * ```ts
     * import {AstDeclaration, ParserOptions, transform} from "../src/node.ts";
     *
     * const options: ParserOptions = {
     *
     *     visitor: {
     *
     *         // called for every declaration
     *         Declaration: (node: AstDeclaration): null => {
     *
     *
     *             if (node.nam == 'height') {
     *
     *                 node.nam = 'width';
     *             }
     *
     *             else if (node.nam == 'margin') {
     *
     *                 node.nam = 'padding'
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     height: calc(100px * 2/ 15);
     *     margin: 10px;
     * }
     * .selector {
     *
     * margin: 20px;}
     * `;
     *
     * const result = await transform(css, options);
     *
     * console.debug(result.code);
     *
     * // .foo{width:calc(40px/3);padding:10px}.selector{padding:20px}
     * ```
     */
    Declaration?: Record<string, DeclarationVisitorHandler> | DeclarationVisitorHandler;

    /**
     * rule visitor
     *
     *  Example: add 'width: 3px' to every rule with the selector '.foo'
     *
     * ```ts
     *
     * import {transform, parseDeclarations} from "@tbela99/css-parser";
     *
     * const options: ParserOptions = {
     *
     *     removeEmpty: false,
     *     visitor: {
     *
     *         Rule: async (node: AstRule): Promise<AstRule | null> => {
     *
     *             if (node.sel == '.foo') {
     *
     *                 node.chi.push(...await parseDeclarations('width: 3px'));
     *                 return node;
     *             }
     *
     *             return null;
     *         }
     *     }
     * };
     *
     * const css = `
     *
     * .foo {
     *     .foo {
     *     }
     * }
     * `;
     *
     * console.debug(await transform(css, options));
     *
     * // .foo{width:3px;.foo{width:3px}}
     * ```
     */
    Rule?: RuleVisitorHandler;
}
