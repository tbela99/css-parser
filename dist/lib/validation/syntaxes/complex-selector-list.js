import { ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateSelector } from './selector.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';

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
    let result = null;
    for (const t of splitTokenList(tokens)) {
        result = validateSelector(t, root, options);
        if (result.valid == ValidationLevel.Drop) {
            return result;
        }
    }
    // @ts-ignore
    return result ?? {
        valid: ValidationLevel.Drop,
        matches: [],
        // @ts-ignore
        node: root,
        syntax: null,
        error: 'expecting complex selector list',
        tokens
    };
}

export { validateComplexSelectorList };
