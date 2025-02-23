import { EnumToken, ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateSyntax } from '../syntax.js';
import { getParsedSyntax } from '../config.js';

function validateImage(token) {
    if (token.typ == EnumToken.UrlFunctionTokenType) {
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: token,
            syntax: 'url()',
            error: '',
            tokens: []
        };
    }
    if (token.typ == EnumToken.ImageFunctionTokenType) {
        return validateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, token.val + '()'), token.chi);
    }
    return {
        valid: ValidationLevel.Drop,
        matches: [],
        node: token,
        syntax: 'image()',
        error: 'expected <image> or <url>',
        tokens: []
    };
}

export { validateImage };
