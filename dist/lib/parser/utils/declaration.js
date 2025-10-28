import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { walkValues } from '../../ast/walk.js';
import '../parse.js';
import '../tokenize.js';
import './config.js';
import { isWhiteSpace } from '../../syntax/syntax.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function parseDeclarationNode(node, errors, location) {
    while (node.val[0]?.typ == EnumToken.WhitespaceTokenType) {
        node.val.shift();
    }
    if (!node.nam.startsWith('--') && node.val.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ)).length == 0) {
        errors.push({
            action: 'drop',
            message: 'doParse: invalid declaration',
            location
        });
        return null;
    }
    if ('composes' == node.nam.toLowerCase()) {
        let left = [];
        let right = [];
        let current = 0;
        let hasFrom = 0;
        for (; current < node.val.length; current++) {
            if (EnumToken.WhitespaceTokenType == node.val[current].typ || EnumToken.CommentTokenType == node.val[current].typ) {
                if (!hasFrom) {
                    left.push(node.val[current]);
                }
                else {
                    right.push(node.val[current]);
                }
                continue;
            }
            if (EnumToken.IdenTokenType == node.val[current].typ || EnumToken.DashedIdenTokenType == node.val[current].typ || EnumToken.StringTokenType == node.val[current].typ) {
                if (EnumToken.IdenTokenType == node.val[current].typ) {
                    if ('from' == node.val[current].val) {
                        if (hasFrom) {
                            return null;
                        }
                        hasFrom++;
                        continue;
                    }
                }
                if (hasFrom) {
                    right.push(node.val[current]);
                }
                else {
                    left.push(node.val[current]);
                }
                continue;
            }
            break;
        }
        if (hasFrom <= 1 && current > 0) {
            if (hasFrom == 0) {
                node.val.splice(0, left.length, {
                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: null
                });
            }
            else {
                node.val.splice(0, current, {
                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: right.reduce((a, b) => {
                        return a == null ? b : b.typ == EnumToken.WhitespaceTokenType || b.typ == EnumToken.CommentTokenType ? a : b;
                    }, null)
                });
            }
        }
    }
    for (const { value: val, parent } of walkValues(node.val, node)) {
        if (val.typ == EnumToken.AttrTokenType && val.chi.every((t) => [EnumToken.IdenTokenType, EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ))) {
            // @ts-ignore
            val.typ = EnumToken.IdenListTokenType;
        }
        else if (val.typ == EnumToken.StringTokenType && (node.nam == 'grid' || node.nam == 'grid-template-areas' || node.nam == 'grid-template-rows' || node.nam == 'grid-template-columns')) {
            val.val = val.val.at(0) + parseGridTemplate(val.val.slice(1, -1)) + val.val.at(-1);
            // @ts-ignore
            const array = parent?.chi ?? node.val;
            const index = array.indexOf(val);
            if (index > 0 && array[index - 1].typ == EnumToken.WhitespaceTokenType) {
                array.splice(index - 1, 1);
            }
        }
    }
    return node;
}
function parseGridTemplate(template) {
    let result = '';
    let buffer = '';
    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        if (isWhiteSpace(char.codePointAt(0))) {
            while (i + 1 < template.length && isWhiteSpace(template[i + 1].codePointAt(0))) {
                i++;
            }
            result += buffer + ' ';
            buffer = '';
        }
        else if (char == '.') {
            while (i + 1 < template.length && template[i + 1] == '.') {
                i++;
            }
            if (isWhiteSpace((result.at(-1)?.codePointAt(0)))) {
                result = result.slice(0, -1);
            }
            result += buffer + char;
            buffer = '';
        }
        else {
            buffer += char;
        }
    }
    return buffer.length > 0 ? result + buffer : result;
}

export { parseDeclarationNode };
