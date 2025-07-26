import { EnumToken, SyntaxValidationResult } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function validateLayerName(tokens) {
    const slice = tokens.reduce((acc, curr) => {
        if (curr.typ == EnumToken.CommaTokenType) {
            acc.push([]);
        }
        else if (curr.typ != EnumToken.CommentTokenType) {
            acc[acc.length - 1].push(curr);
        }
        return acc;
    }, [[]]);
    for (let i = 0; i < slice.length; i++) {
        if (slice[i].length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: tokens,
                node: null,
                syntax: null,
                error: 'Invalid ident',
                tokens
            };
        }
        for (let j = 0; j < slice[i].length; j++) {
            if (slice[i][j].typ != EnumToken.IdenTokenType && slice[i][j].typ != EnumToken.ClassSelectorTokenType) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    matches: tokens,
                    node: slice[i][j],
                    syntax: '<layer-name>',
                    error: 'expecting ident or class selector',
                    tokens
                };
            }
        }
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        matches: tokens,
        node: null,
        syntax: null,
        error: '',
        tokens
    };
}

export { validateLayerName };
