import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import { validateDeclaration } from './declaration.js';

function validate(ast, errors, parent) {
    if (ast.typ === EnumToken.DeclarationNodeType) {
        return validateDeclaration(ast, errors);
    }
    return true;
}

export { validate };
