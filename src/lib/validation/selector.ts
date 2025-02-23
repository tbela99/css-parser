import type {AstAtRule, AstRule, AstRuleStyleSheet, Token, ValidationOptions} from "../../@types";
import {EnumToken} from "../ast";
import {validateKeyframeBlockList, validateRelativeSelectorList} from "./syntaxes";
import type {ValidationResult} from "../../@types/validation";
import {validateSelectorList} from "./syntaxes/selector-list";

export function validateSelector(selector: Token[], options: ValidationOptions, root?: AstAtRule | AstRule | AstRuleStyleSheet): ValidationResult {

    if (root == null) {

        return validateSelectorList(selector, root, options);
    }

    // @ts-ignore
    if (root.typ == EnumToken.AtRuleNodeType && root.nam.match(/^(-[a-z]+-)?keyframes$/)) {

        return validateKeyframeBlockList(selector, root, options);
    }

    let isNested: number = root.typ == EnumToken.RuleNodeType ? 1 : 0;
    let currentRoot = root.parent;

    while (currentRoot != null && isNested == 0) {

        if (currentRoot.typ == EnumToken.RuleNodeType) {

            isNested++;

            if (isNested > 0) {

                // @ts-ignore
                return validateRelativeSelectorList(selector, root, {...(options ?? {}), nestedSelector: true});
            }
        }

        currentRoot = currentRoot.parent;
    }

    const nestedSelector: boolean = isNested > 0;

    // @ts-ignore
    return nestedSelector ? validateRelativeSelectorList(selector, root, {...(options ?? {}), nestedSelector}) : validateSelectorList(selector, root, {...(options ?? {}), nestedSelector});
}
