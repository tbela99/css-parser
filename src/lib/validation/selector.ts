import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../@types";
import {EnumToken} from "../ast";
import {getParsedSyntax} from "./config";
import type {ValidationResult} from "../../@types/validation";
import {ValidationSyntaxGroupEnum, ValidationToken} from "./parser";
import {validateSyntax} from "./syntax";

export function validateSelector(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResult {

    const isKeyframe: boolean = root?.typ == EnumToken.AtRuleNodeType && /^(-[a-zA-Z]+-)?keyframes/i.test((root as AstAtRule).nam);
    let isNested: boolean = false;

    if (!isKeyframe && root != null) {

        let node = root;

        while (node != null) {

            if (node.typ == EnumToken.RuleNodeType) {

                isNested = true;
                break;
            }

            // @ts-ignore
            node = node.parent;
        }
    }

    // @ts-ignore
    return validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, isKeyframe ? 'keyframe-selector' : (isNested ? 'relative-selector-list' : 'complex-selector-list')) as ValidationToken[], selector, isNested ? root : null, options);
}
