import { EnumToken, ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateURL(token) {
    if (token.typ == EnumToken.UrlTokenTokenType) {
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: token,
            syntax: 'url()',
            error: '',
            tokens: []
        };
    }
    if (token.typ != EnumToken.UrlFunctionTokenType) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: token,
            syntax: 'url()',
            error: 'expected url()',
            tokens: []
        };
    }
    const children = token.chi.slice();
    consumeWhitespace(children);
    if (children.length == 0 || ![EnumToken.UrlTokenTokenType, EnumToken.StringTokenType, EnumToken.HashTokenType].includes(children[0].typ)) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: children[0] ?? token,
            syntax: 'url()',
            error: 'expected url-token',
            tokens: children
        };
    }
    children.shift();
    consumeWhitespace(children);
    if (children.length > 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: children[0] ?? token,
            syntax: 'url()',
            error: 'unexpected token',
            tokens: children
        };
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: token,
        syntax: 'url()',
        error: '',
        tokens: []
    };
}

export { validateURL };
