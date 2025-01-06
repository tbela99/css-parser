import { ValidationLevel } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import '../parser/utils/config.js';
import { getParsedSyntax, getSyntaxConfig } from './config.js';
import { validateSyntax } from './syntax.js';

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
    // if (!options.validation) {
    //
    //     return {
    //
    //         valid: ValidationLevel.Valid,
    //         node: atRule,
    //         syntax: null,
    //         error: ''
    //     }
    // }
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
        //     if (root?.typ == EnumToken.AtRuleNodeType) {
        //
        //         const syntax: ValidationToken = (getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, '@' + (root as AstAtRule).nam) as ValidationToken[])?.[0];
        //
        //         if ('chi' in syntax) {
        //
        //             return validateSyntax(syntax.chi as ValidationToken[], [atRule], root, options);
        //         }
        //     }
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
    if ('prelude' in syntax) {
        return validateSyntax(syntax.prelude, atRule.tokens, root, options);
    }
    return {
        valid: ValidationLevel.Valid,
        node: null,
        syntax,
        error: ''
    };
}

export { validateAtRule };
