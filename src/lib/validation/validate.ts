import {AstDeclaration, AstRuleList, Node} from "../../@types";
import {EnumToken} from "../ast";
import {validateDeclaration} from "./declaration";
import {ErrorDescription} from "../../@types/validation";


export function validate(ast: Node, errors?: ErrorDescription[], parent?: AstRuleList): boolean {

    if (ast.typ === EnumToken.DeclarationNodeType) {
        return validateDeclaration(ast as AstDeclaration, errors, parent);
    }

    return true;
}