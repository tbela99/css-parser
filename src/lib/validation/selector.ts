import type {AstNode, Token, ValidationOptions} from "../../@types";
import {EnumToken} from "../ast";
import {getParsedSyntax} from "./config";
import type {ValidationResult} from "../../@types/validation";
import {ValidationSyntaxGroupEnum, ValidationToken} from "./parser";
import {validateSyntax} from "./syntax";

export function validateSelector(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResult {

    let isNested: boolean = false;

    if (root != null) {

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
    return validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, root?.typ == EnumToken.AtRuleNodeType && root.nam.match(/(-[a-zA-Z]+-)?keyframes/i) ? 'keyframe-block-list' : (isNested ? 'relative-selector-list' : 'complex-selector-list')) as ValidationToken[], selector, isNested ? root : null, options);

}
