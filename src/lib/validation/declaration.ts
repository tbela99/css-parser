import {getConfig} from "./config";
import {AstDeclaration, AstRuleList} from "../../@types/index.d";
import {ErrorDescription, ValidationConfiguration} from "../../@types/validation.d";
import {ValidationAction} from "../ast";
import {validateSyntax} from "./syntax";

export function validateDeclaration(ast: AstDeclaration, errors?: ErrorDescription[], parent?: AstRuleList): boolean {

    const config: ValidationConfiguration = getConfig();

    if (ast.nam.startsWith('--')) {

        return true;
    }

    if (!(ast.nam in config.declarations)) {

        const isShortHand: boolean = ast.nam.match(/^-[a-z]+-/) != null;

        errors?.push({
            action: isShortHand ? ValidationAction.Ignore : ValidationAction.Drop,
            message: `unknown declaration '${ast.nam}'`,
            location: ast.loc == null ? null : {
                src: ast.loc.src,
                lin: ast.loc.sta.lin,
                col: ast.loc.sta.col
            }
        });

        return isShortHand
    }

    if (!validateSyntax(config.declarations[ast.nam].ast, ast.val.slice(), errors)) {

        console.error(ast);

        errors?.push({
            action: ValidationAction.Drop,
            message: `invalid declaration '${ast.nam}'`,
            location: ast.loc == null ? null : {
                src: ast.loc.src,
                lin: ast.loc.sta.lin,
                col: ast.loc.sta.col
            }
        });

        return false;
    }

    return true;
}