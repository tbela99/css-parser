import { EnumToken, ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateRelativeSelector } from './relative-selector.js';

function validateRelativeSelectorList(tokens, root, options) {
    let i = 0;
    let j = 0;
    let result = null;
    while (i + 1 < tokens.length) {
        if (tokens[++i].typ == EnumToken.CommaTokenType) {
            result = validateRelativeSelector(tokens.slice(j, i), root, options);
            if (result.valid == ValidationLevel.Drop) {
                return result;
            }
            j = i + 1;
            i = j;
        }
    }
    return validateRelativeSelector(i == j ? tokens.slice(i) : tokens.slice(j, i + 1), root, options);
}

export { validateRelativeSelectorList };
