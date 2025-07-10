import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function validateKeyframeSelector(tokens, options) {
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: null,
            error: 'expected keyframe selector'
        };
    }
    for (const t of splitTokenList(tokens)) {
        if (t.length != 1) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: t[0] ?? null,
                syntax: null,
                error: 'unexpected token'
            };
        }
        if (t[0].typ != EnumToken.PercentageTokenType && !(t[0].typ == EnumToken.IdenTokenType && ['from', 'to', 'cover', 'contain', 'entry', 'exit', 'entry-crossing', 'exit-crossing'].includes(t[0].val))) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: t[0],
                syntax: null,
                error: 'expected keyframe selector'
            };
        }
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: null,
        // @ts-ignore
        syntax: null,
        error: ''
    };
}

export { validateKeyframeSelector };
