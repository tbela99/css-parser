import { consumeWhitespace } from '../utils/whitespace.js';
import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function validateKeyframeSelector(tokens, atRule) {
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: null,
            error: 'expected keyframe selector',
            tokens
        };
    }
    if (tokens[0].typ == EnumToken.PercentageTokenType) {
        tokens.shift();
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            return {
                valid: ValidationLevel.Valid,
                matches: [],
                node: atRule,
                syntax: null,
                error: '',
                tokens
            };
        }
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'unexpected token',
            tokens
        };
    }
    if (tokens[0].typ != EnumToken.IdenTokenType) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'expected keyframe selector',
            tokens
        };
    }
    if (['from', 'to'].includes(tokens[0].val)) {
        tokens.shift();
        consumeWhitespace(tokens);
        if (tokens.length > 0) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: null,
                error: 'unexpected token',
                tokens
            };
        }
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: null,
            error: '',
            tokens
        };
    }
    if (!['cover', 'contain', 'entry', 'exit', 'entry-crossing', 'exit-crossing'].includes(tokens[0].val)) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'unexpected token',
            tokens
        };
    }
    tokens.shift();
    consumeWhitespace(tokens);
    // @ts-ignore
    if (tokens.length == 0 || tokens[0].typ != EnumToken.PercentageTokenType) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'expecting percentage token',
            tokens
        };
    }
    tokens.shift();
    consumeWhitespace(tokens);
    if (tokens.length > 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'unexpected token',
            tokens
        };
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        syntax: null,
        error: '',
        tokens
    };
}

export { validateKeyframeSelector };
