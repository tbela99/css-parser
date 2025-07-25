import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { EnumToken, SyntaxValidationResult } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { validateCompoundSelector } from './compound-selector.js';

const combinatorsTokens = [EnumToken.ChildCombinatorTokenType, EnumToken.ColumnCombinatorTokenType,
    // EnumToken.DescendantCombinatorTokenType,
    EnumToken.NextSiblingCombinatorTokenType, EnumToken.SubsequentSiblingCombinatorTokenType];
// <compound-selector> [ <combinator>? <compound-selector> ]*
function validateComplexSelector(tokens, root, options) {
    // [ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            // @ts-ignore
            node: root,
            syntax: null,
            error: 'expected selector'
        };
    }
    // const config = getSyntaxConfig();
    //
    // let match: number = 0;
    let result = null;
    // const combinators: EnumToken[] = combinatorsTokens.filter((t: EnumToken) => t != EnumToken.DescendantCombinatorTokenType);
    for (const t of splitTokenList(tokens, combinatorsTokens)) {
        result = validateCompoundSelector(t, root, options);
        if (result.valid == SyntaxValidationResult.Drop) {
            return result;
        }
    }
    // @ts-ignore
    return result ?? {
        valid: SyntaxValidationResult.Drop,
        context: [],
        node: root,
        syntax: null,
        error: 'expecting compound-selector'
    };
}

export { combinatorsTokens, validateComplexSelector };
