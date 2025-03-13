import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function validateKeyframeSelector(tokens, options) {
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: null,
            error: 'expected keyframe selector',
            tokens
        };
    }
    for (const t of splitTokenList(tokens)) {
        if (t.length != 1) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0] ?? null,
                syntax: null,
                error: 'unexpected token',
                tokens
            };
        }
        if (t[0].typ != EnumToken.PercentageTokenType && !(t[0].typ == EnumToken.IdenTokenType && ['from', 'to', 'cover', 'contain', 'entry', 'exit', 'entry-crossing', 'exit-crossing'].includes(t[0].val))) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0],
                syntax: null,
                error: 'expected keyframe selector',
                tokens
            };
        }
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        // @ts-ignore
        syntax: null,
        error: '',
        tokens
    };
}

export { validateKeyframeSelector };
