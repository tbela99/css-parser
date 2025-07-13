import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateFamilyName(tokens, atRule) {
    let node;
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: null,
            error: 'expected at-rule prelude',
            tokens
        };
    }
    if (tokens[0].typ == EnumToken.CommaTokenType) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
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
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
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
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
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
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: [],
                node: tokens[0],
                syntax: null,
                error: 'expected comma token',
                tokens
            };
        }
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        matches: [],
        node: null,
        syntax: null,
        error: '',
        tokens
    };
}

export { validateFamilyName };
