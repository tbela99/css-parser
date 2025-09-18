import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../@types/index.d.ts";
import type {ValidationConfiguration, ValidationResult} from "../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../ast/index.ts";
import {getParsedSyntax, getSyntaxConfig} from "./config.ts";
import type {ValidationToken} from "./parser/types.d.ts";
import {ValidationSyntaxGroupEnum} from "./parser/index.ts";
import {
    validateAtRuleContainer,
    validateAtRuleCounterStyle,
    validateAtRuleDocument,
    validateAtRuleElse,
    validateAtRuleFontFeatureValues,
    validateAtRuleImport,
    validateAtRuleLayer,
    validateAtRuleMedia,
    validateAtRuleNamespace,
    validateAtRulePage,
    validateAtRulePageMarginBox,
    validateAtRuleSupports,
    validateAtRuleWhen
} from "./at-rules/index.ts";
import {validateAtRuleCustomMedia} from "./at-rules/custom-media.ts";

export function validateAtRule(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationResult {

    if (atRule.nam == 'charset') {

        const valid: boolean = atRule.val.match(/^"[a-zA-Z][a-zA-Z0-9_-]+"$/i) != null;

        return {

            valid: valid ? SyntaxValidationResult.Valid : SyntaxValidationResult.Drop,
            node: atRule,
            syntax: null,
            error: ''
        }
    }

    if (['font-face', 'view-transition', 'starting-style'].includes(atRule.nam)) {

        return {
            valid: SyntaxValidationResult.Valid,
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        }
    }

    if (atRule.nam == 'media') {

        return validateAtRuleMedia(atRule, options, root);
    }

    if (atRule.nam == 'import') {

        return validateAtRuleImport(atRule, options, root);
    }

    if (atRule.nam == 'supports') {

        return validateAtRuleSupports(atRule, options, root);
    }

    if (atRule.nam == 'counter-style') {

        return validateAtRuleCounterStyle(atRule, options, root);
    }

    if (atRule.nam == 'layer') {

        return validateAtRuleLayer(atRule, options, root);
    }

    if (atRule.nam == 'font-feature-values') {

        return validateAtRuleFontFeatureValues(atRule, options, root);
    }

    if (atRule.nam == 'namespace') {

        return validateAtRuleNamespace(atRule, options, root);
    }

    if (atRule.nam == 'when') {

        return validateAtRuleWhen(atRule, options, root);
    }

    if (atRule.nam == 'else') {

        return validateAtRuleElse(atRule, options, root);
    }

    if (atRule.nam == 'container') {

        return validateAtRuleContainer(atRule, options, root);
    }

    if (atRule.nam == 'document') {

        return validateAtRuleDocument(atRule, options, root);
    }

    if (atRule.nam == 'custom-media') {

        return validateAtRuleCustomMedia(atRule, options, root);
    }

    if (['position-try', 'property', 'font-palette-values'].includes(atRule.nam)) {

        if (!Array.isArray(atRule.tokens) || atRule!.tokens!.length == 0) {

            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected prelude'
            }
        }

        if (!('chi' in atRule)) {

            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected body'
            }
        }

        const chi: Token[] = (atRule.tokens as Token[]).filter((t: Token): boolean => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommentTokenType);

        if (chi.length != 1) {

            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected ' + (atRule.nam == 'property' ? 'custom-property-name' : 'dashed-ident')
            }
        }

        if (chi[0].typ != EnumToken.DashedIdenTokenType) {

            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected ' + (atRule.nam == 'property' ? 'custom-property-name' : 'dashed-ident')
            }
        }

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        }
    }

    // scope
    if (atRule.nam == 'page') {

        return validateAtRulePage(atRule, options, root);
    }

    if (['top-left-corner', 'top-left', 'top-center', 'top-right', 'top-right-corner', 'bottom-left-corner', 'bottom-left', 'bottom-center', 'bottom-right', 'bottom-right-corner', 'left-top', 'left-middle', 'left-bottom', 'right-top', 'right-middle', 'right-bottom'].includes(atRule.nam)) {

        if (!(root == null || (root.typ == EnumToken.AtRuleNodeType && (root as AstAtRule).nam == 'page'))) {

            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                node: atRule,
                syntax: '@page',
                error: 'not allowed here'
            }
        }

        return validateAtRulePageMarginBox(atRule, options, root);
    }

    // handle keyframe as special case
    // check if the node exists
    const config: ValidationConfiguration = getSyntaxConfig();

    let name: string = '@' + atRule.nam;

    if (!(name in config.atRules)) {

        if (name.charAt(1) == '-') {

            name = name.replace(/@-[a-zA-Z]+-([a-zA-Z][a-zA-Z0-9_-]*)/, '@$1');
        }
    }

    if (!(name in config.atRules)) {

        if (options.lenient) {

            return {
                valid: SyntaxValidationResult.Lenient,
                node: atRule,
                syntax: null,
                error: ''
            }
        }

        return {

            valid: SyntaxValidationResult.Drop,
            node: atRule,
            syntax: null,
            error: 'unknown at-rule'
        }
    }

    const syntax: ValidationToken = (getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, name) as ValidationToken[])?.[0];

    if ('chi' in syntax && !('chi' in atRule)) {

        return {
            valid: SyntaxValidationResult.Drop,
            node: atRule,
            syntax,
            error: 'missing at-rule body'
        }
    }

    // if ('prelude' in syntax) {
    //
    //     return validateSyntax(syntax.prelude as ValidationToken[], atRule.tokens as Token[], root, options);
    // }

    return {

        valid: SyntaxValidationResult.Valid,
        node: null,
        syntax,
        error: ''
    }
}
