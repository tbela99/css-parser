import { consumeWhitespace } from '../utils/whitespace.js';
import { ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateSelector } from './selector.js';
import { combinatorsTokens } from './complex-selector.js';

function validateRelativeSelector(tokens, root, options) {
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expected selector',
            tokens
        };
    }
    // , EnumToken.DescendantCombinatorTokenType
    if (combinatorsTokens.includes(tokens[0].typ)) {
        tokens.shift();
        consumeWhitespace(tokens);
    }
    return validateSelector(tokens, root, options);
}

export { validateRelativeSelector };
