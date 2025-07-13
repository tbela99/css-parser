import type {AstAtRule, AstNode, AstRule, Token, ValidationOptions} from "../../@types/index.d.ts";
import {EnumToken} from "../ast/index.ts";
import {validateKeyframeBlockList, validateRelativeSelectorList} from "./syntaxes/index.ts";
import type {ValidationResult} from "../../@types/validation.d.ts";
import {validateSelectorList} from "./syntaxes/selector-list.ts";

export function validateSelector(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResult {

    if (root == null) {

        return validateSelectorList(selector, root, options);
    }

    // @ts-ignore
    if (root.typ == EnumToken.AtRuleNodeType && root.nam.match(/^(-[a-z]+-)?keyframes$/)) {

        return validateKeyframeBlockList(selector, root as AstAtRule, options);
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
    return nestedSelector ? validateRelativeSelectorList(selector, root, {
        ...(options ?? {}),
        nestedSelector
    }) : validateSelectorList(selector, root as AstRule, {...(options ?? {}), nestedSelector});
}
