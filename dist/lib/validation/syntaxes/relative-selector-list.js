import { ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { validateRelativeSelector } from './relative-selector.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';

function validateRelativeSelectorList(tokens, root, options) {
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expecting relative selector list',
            tokens
        };
    }
    for (const t of splitTokenList(tokens)) {
        if (t.length == 0) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                // @ts-ignore
                node: root,
                // @ts-ignore
                syntax: null,
                error: 'unexpected comma',
                tokens
            };
        }
        const result = validateRelativeSelector(t, root, options);
        if (result.valid == ValidationLevel.Drop) {
            return result;
        }
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        // @ts-ignore
        node: root,
        // @ts-ignore
        syntax: null,
        error: '',
        tokens
    };
}

export { validateRelativeSelectorList };
