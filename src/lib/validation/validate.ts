import {AstDeclaration, AstRuleList, Node} from "../../@types/index.d";
import {EnumToken} from "../ast";
import {validateDeclaration} from "./declaration";
import {ErrorDescription} from "../../@types/validation.d";


export function validate(ast: Node, errors?: ErrorDescription[], parent?: AstRuleList): boolean {

    if (ast.typ === EnumToken.DeclarationNodeType) {
        return validateDeclaration(ast as AstDeclaration, errors, parent);
    }

    return true;
}