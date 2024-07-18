import { getConfig } from './config.js';
import { ValidationAction } from '../ast/types.js';
import '../ast/minify.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import { validateSyntax } from './syntax.js';

function validateDeclaration(ast, errors, parent) {
    const config = getConfig();
    if (ast.nam.startsWith('--')) {
        return true;
    }
    if (!(ast.nam in config.declarations)) {
        const isShortHand = ast.nam.match(/^-[a-z]+-/) != null;
        errors?.push({
            action: isShortHand ? ValidationAction.Ignore : ValidationAction.Drop,
            message: `unknown declaration '${ast.nam}'`,
            location: ast.loc == null ? null : {
                src: ast.loc.src,
                lin: ast.loc.sta.lin,
                col: ast.loc.sta.col
            }
        });
        return isShortHand;
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

export { validateDeclaration };
