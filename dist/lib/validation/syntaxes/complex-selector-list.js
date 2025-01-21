import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateSelector } from './selector.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateComplexSelectorList(tokens, root, options) {
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            syntax: null,
            error: 'expecting complex selector list',
            tokens
        };
    }
    let i = -1;
    let j = 0;
    let result = null;
    while (i + 1 < tokens.length) {
        if (tokens[++i].typ == EnumToken.CommaTokenType) {
            result = validateSelector(tokens.slice(j, i), root, options);
            if (result.valid == ValidationLevel.Drop) {
                return result;
            }
            j = i + 1;
            i = j;
        }
    }
    return validateSelector(i == j ? tokens.slice(i) : tokens.slice(j, i + 1), root, options);
}

export { validateComplexSelectorList };
