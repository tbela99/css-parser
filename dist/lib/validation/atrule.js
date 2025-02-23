import { ValidationLevel, EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import '../parser/utils/config.js';
import { getSyntaxConfig, getParsedSyntax } from './config.js';
import { validateAtRuleMedia } from './at-rules/media.js';
import { validateAtRuleCounterStyle } from './at-rules/counter-style.js';
import { validateAtRulePage } from './at-rules/page.js';
import { validateAtRulePageMarginBox } from './at-rules/page-margin-box.js';
import { validateAtRuleSupports } from './at-rules/supports.js';
import { validateAtRuleImport } from './at-rules/import.js';
import { validateAtRuleLayer } from './at-rules/layer.js';
import { validateAtRuleFontFeatureValues } from './at-rules/font-feature-values.js';
import { validateAtRuleNamespace } from './at-rules/namespace.js';
import { validateAtRuleDocument } from './at-rules/document.js';
import { validateAtRuleKeyframes } from './at-rules/keyframes.js';
import { validateAtRuleWhen } from './at-rules/when.js';
import { validateAtRuleElse } from './at-rules/else.js';
import { validateAtRuleContainer } from './at-rules/container.js';
import { validateAtRuleCustomMedia } from './at-rules/custom-media.js';

function validateAtRule(atRule, options, root) {
    if (atRule.nam == 'charset') {
        const valid = atRule.val.match(/^"[a-zA-Z][a-zA-Z0-9_-]+"$/i) != null;
        return {
            valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
            node: atRule,
            syntax: null,
            error: ''
        };
    }
    if (atRule.nam == 'keyframes') {
        return validateAtRuleKeyframes(atRule);
    }
    if (['font-face', 'view-transition', 'starting-style'].includes(atRule.nam)) {
        return {
            valid: ValidationLevel.Valid,
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    if (atRule.nam == 'media') {
        return validateAtRuleMedia(atRule);
    }
    if (atRule.nam == 'import') {
        return validateAtRuleImport(atRule);
    }
    if (atRule.nam == 'supports') {
        return validateAtRuleSupports(atRule);
    }
    if (atRule.nam == 'counter-style') {
        return validateAtRuleCounterStyle(atRule);
    }
    if (atRule.nam == 'layer') {
        return validateAtRuleLayer(atRule);
    }
    if (atRule.nam == 'font-feature-values') {
        return validateAtRuleFontFeatureValues(atRule);
    }
    if (atRule.nam == 'namespace') {
        return validateAtRuleNamespace(atRule);
    }
    if (atRule.nam == 'when') {
        return validateAtRuleWhen(atRule);
    }
    if (atRule.nam == 'else') {
        return validateAtRuleElse(atRule);
    }
    if (atRule.nam == 'container') {
        return validateAtRuleContainer(atRule);
    }
    if (atRule.nam == 'document') {
        return validateAtRuleDocument(atRule);
    }
    if (atRule.nam == 'custom-media') {
        return validateAtRuleCustomMedia(atRule);
    }
    if (['position-try', 'property', 'font-palette-values'].includes(atRule.nam)) {
        if (!('tokens' in atRule)) {
            return {
                valid: ValidationLevel.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected prelude'
            };
        }
        if (!('chi' in atRule)) {
            return {
                valid: ValidationLevel.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected body'
            };
        }
        const chi = atRule.tokens.filter((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommentTokenType);
        if (chi.length != 1) {
            return {
                valid: ValidationLevel.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected ' + (atRule.nam == 'property' ? 'custom-property-name' : 'dashed-ident')
            };
        }
        if (chi[0].typ != EnumToken.DashedIdenTokenType) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected ' + (atRule.nam == 'property' ? 'custom-property-name' : 'dashed-ident')
            };
        }
        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    // scope
    if (atRule.nam == 'page') {
        return validateAtRulePage(atRule);
    }
    if (['top-left-corner', 'top-left', 'top-center', 'top-right', 'top-right-corner', 'bottom-left-corner', 'bottom-left', 'bottom-center', 'bottom-right', 'bottom-right-corner', 'left-top', 'left-middle', 'left-bottom', 'right-top', 'right-middle', 'right-bottom'].includes(atRule.nam)) {
        if (!(root == null || (root.typ == EnumToken.AtRuleNodeType && root.nam == 'page'))) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                node: atRule,
                syntax: '@page',
                error: 'not allowed here'
            };
        }
        return validateAtRulePageMarginBox(atRule);
    }
    // handle keyframe as special case
    // check if the node exists
    const config = getSyntaxConfig();
    let name = '@' + atRule.nam;
    if (!(name in config.atRules)) {
        if (name.charAt(1) == '-') {
            name = name.replace(/@-[a-zA-Z]+-([a-zA-Z][a-zA-Z0-9_-]*)/, '@$1');
        }
    }
    if (!(name in config.atRules)) {
        if (options.lenient) {
            return {
                valid: ValidationLevel.Lenient,
                node: atRule,
                syntax: null,
                error: ''
            };
        }
        return {
            valid: ValidationLevel.Drop,
            node: atRule,
            syntax: null,
            error: 'unknown at-rule'
        };
    }
    const syntax = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, name)?.[0];
    if ('chi' in syntax && !('chi' in atRule)) {
        return {
            valid: ValidationLevel.Drop,
            node: atRule,
            syntax,
            error: 'missing at-rule body'
        };
    }
    // if ('prelude' in syntax) {
    //
    //     return validateSyntax(syntax.prelude as ValidationToken[], atRule.tokens as Token[], root, options);
    // }
    return {
        valid: ValidationLevel.Valid,
        node: null,
        syntax,
        error: ''
    };
}

export { validateAtRule };
