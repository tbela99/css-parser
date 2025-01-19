import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateFamilyName(tokens, atRule) {
    let node;
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: null,
            error: 'expected at-rule prelude',
            tokens
        };
    }
    if (tokens[0].typ == EnumToken.CommaTokenType) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'unexpected token',
            tokens
        };
    }
    while (tokens.length > 0) {
        // @ts-ignore
        if (tokens[0].typ == EnumToken.CommaTokenType) {
            node = tokens.shift();
            consumeWhitespace(tokens);
            if (tokens.length == 0) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node,
                    syntax: null,
                    error: 'unexpected token',
                    tokens
                };
            }
        }
        node = tokens[0];
        if (![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(node.typ)) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node,
                syntax: null,
                error: 'unexpected token',
                tokens
            };
        }
        tokens.shift();
        consumeWhitespace(tokens);
        // @ts-ignore
        if (tokens.length > 0 && node.typ == EnumToken.BadStringTokenType && tokens[0].typ != EnumToken.CommaTokenType) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: null,
                error: 'expected comma token',
                tokens
            };
        }
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

export { validateFamilyName };
