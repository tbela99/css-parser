import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { mozExtensions, webkitExtensions } from '../../syntax/syntax.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { getSyntaxConfig } from '../config.js';

function validateCompoundSelector(tokens, root, options) {
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expected selector',
            tokens
        };
    }
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    const config = getSyntaxConfig();
    let match = 0;
    let length = tokens.length;
    while (tokens.length > 0) {
        while (tokens.length > 0 && tokens[0].typ == EnumToken.NestingSelectorTokenType) {
            if (!options?.nestedSelector) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    // @ts-ignore
                    node: tokens[0],
                    syntax: null,
                    error: 'nested selector not allowed'
                };
            }
            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }
        // <type-selector>
        while (tokens.length > 0 &&
            [
                EnumToken.IdenTokenType,
                EnumToken.NameSpaceAttributeTokenType,
                EnumToken.ClassSelectorTokenType,
                EnumToken.HashTokenType,
                EnumToken.UniversalSelectorTokenType
            ].includes(tokens[0].typ)) {
            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }
        while (tokens.length > 0 && tokens[0].typ == EnumToken.PseudoClassFuncTokenType) {
            if (!mozExtensions.has(tokens[0].val + '()') &&
                !webkitExtensions.has(tokens[0].val + '()') &&
                !((tokens[0].val + '()') in config.selectors)) {
                if (!options?.lenient || /^(:?)-webkit-/.test(tokens[0].val)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'unknown pseudo-class: ' + tokens[0].val + '()'
                    };
                }
            }
            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }
        while (tokens.length > 0 && (tokens[0].typ == EnumToken.PseudoElementTokenType || tokens[0].typ == EnumToken.PseudoClassTokenType)) {
            const isPseudoElement = tokens[0].typ == EnumToken.PseudoElementTokenType;
            if (
            // https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions#pseudo-elements
            !(isPseudoElement && tokens[0].val.startsWith('::-webkit-')) &&
                !mozExtensions.has(tokens[0].val) &&
                !webkitExtensions.has(tokens[0].val) &&
                !(tokens[0].val in config.selectors) &&
                !(!isPseudoElement &&
                    (':' + tokens[0].val) in config.selectors)) {
                if (!options?.lenient || /^(:?)-webkit-/.test(tokens[0].val)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'unknown pseudo-class: ' + tokens[0].val
                    };
                }
            }
            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }
        while (tokens.length > 0 && tokens[0].typ == EnumToken.AttrTokenType) {
            const children = tokens[0].chi.slice();
            consumeWhitespace(children);
            if (children.length == 0 || ![
                EnumToken.IdenTokenType,
                EnumToken.NameSpaceAttributeTokenType,
                EnumToken.MatchExpressionTokenType
            ].includes(children[0].typ)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: null,
                    error: 'invalid attribute selector'
                };
            }
            if (children[0].typ == EnumToken.MatchExpressionTokenType) {
                if (children.length != 1) {
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid <attribute-selector>'
                    };
                }
                if (![
                    EnumToken.IdenTokenType,
                    EnumToken.NameSpaceAttributeTokenType
                ].includes(children[0].l.typ) ||
                    ![
                        EnumToken.EqualMatchTokenType, EnumToken.DashMatchTokenType,
                        EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType,
                        EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType
                    ].includes(children[0].op.typ) ||
                    ![
                        EnumToken.StringTokenType,
                        EnumToken.IdenTokenType
                    ].includes(children[0].r.typ) ||
                    (children[0].attr != null && !['i', 's'].includes(children[0].attr))) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid attribute selector'
                    };
                }
            }
            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }
        if (length == tokens.length) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                // @ts-ignore
                node: tokens[0],
                // @ts-ignore
                syntax: null,
                error: 'expected compound selector'
            };
        }
        length = tokens.length;
    }
    return match == 0 ? {
        valid: SyntaxValidationResult.Drop,
        context: [],
        // @ts-ignore
        node: root,
        // @ts-ignore
        syntax: null,
        error: 'expected compound selector'
    } :
        // @ts-ignore
        {
            valid: SyntaxValidationResult.Valid,
            context: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: null
        };
}

export { validateCompoundSelector };
