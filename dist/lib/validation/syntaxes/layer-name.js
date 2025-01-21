import { EnumToken, ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function validateLayerName(tokens) {
    const slice = tokens.reduce((acc, curr) => {
        if (curr.typ == EnumToken.CommaTokenType) {
            acc.push([]);
        }
        else if (curr.typ != EnumToken.CommentTokenType) {
            acc[acc.length - 1].push(curr);
        }
        return acc;
    }, [[]]).slice(1);
    for (let i = 0; i < slice.length; i++) {
        if (slice[i].length == 0) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: tokens,
                node: null,
                syntax: null,
                error: 'Invalid ident',
                tokens
            };
        }
        if (slice[i][0].typ != EnumToken.IdenTokenType) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: tokens,
                node: slice[i][0],
                syntax: 'ident',
                error: 'expecting ident',
                tokens
            };
        }
        for (let j = 1; j < slice[i].length; j++) {
            if (slice[i][j].typ != EnumToken.ClassSelectorTokenType) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: tokens,
                    node: slice[i][j],
                    syntax: 'layer-name',
                    error: 'expecting class selector',
                    tokens
                };
            }
        }
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: tokens,
        node: null,
        syntax: null,
        error: '',
        tokens
    };
}

export { validateLayerName };
