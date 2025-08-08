import { EnumToken, SyntaxValidationResult } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateURL(token) {
    // if (token.typ == EnumToken.UrlTokenTokenType) {
    //
    //     // @ts-ignore
    //     return {
    //         valid: SyntaxValidationResult.Valid,
    //         context: [],
    //         node: token,
    //         // @ts-ignore
    //         syntax: 'url()',
    //         error: ''
    //     }
    // }
    // if (token.typ != EnumToken.UrlFunctionTokenType) {
    //
    //     // @ts-ignore
    //     return {
    //         valid: SyntaxValidationResult.Drop,
    //         context: [],
    //         node: token,
    //         // @ts-ignore
    //         syntax: 'url()',
    //         error: 'expected url()'
    //     }
    // }
    const children = token.chi.slice();
    consumeWhitespace(children);
    if (children.length > 0 && [EnumToken.UrlTokenTokenType, EnumToken.StringTokenType, EnumToken.HashTokenType].includes(children[0].typ)) {
        children.shift();
        // @ts-ignore
        // return {
        //     valid: SyntaxValidationResult.Drop,
        //     context: [],
        //     node: children[0] ?? token,
        //     // @ts-ignore
        //     syntax: 'url()',
        //     error: 'expected url-token'
        // }
    }
    consumeWhitespace(children);
    if (children.length > 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: children[0] ?? token,
            // @ts-ignore
            syntax: 'url()',
            error: 'unexpected token'
        };
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: token,
        // @ts-ignore
        syntax: 'url()',
        error: ''
    };
}

export { validateURL };
