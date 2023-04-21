import { find } from "./find";
import { match_pair } from "./match_pair";
export function getType(block) {
    const ch = block.trimStart()[0];
    if (ch == '@') {
        return 'AtRule';
    }
    if (/\S/.test(ch)) {
        return 'Rule';
    }
    return null;
}
export function parseBlock(str, startIndex, matchIndex = null) {
    const css = Array.isArray(str) ? str : [...str];
    // @ts-ignore
    let endPos = Number.isInteger(matchIndex) ? matchIndex : find(css, startIndex, ';}{');
    let endBody = null;
    if (endPos != null) {
        if (css[endPos] == '{') {
            endBody = match_pair(css, endPos, '{', '}');
        }
        else {
            const match = css.slice(startIndex, endPos);
            const type = match[0] == '@' ? 'AtRule' : 'Declaration';
            // @ts-ignore
            const [name, value] = type == 'AtRule' ? parseAtRule(match) : parseDeclaration(match);
            return {
                type,
                name: Array.isArray(name) ? name : [...name],
                value: Array.isArray(value) ? value : [...value],
                body: match,
                block: match.concat(css[endPos])
            };
        }
    }
    // @ts-ignore
    const selector = css.slice(startIndex, matchIndex == null ? endPos : matchIndex);
    return {
        type: (endBody == null ? 'Invalid' : '') + (selector[0] == '@' ? 'AtRule' : 'Rule'),
        selector,
        body: endBody == null ? css.slice(startIndex + selector.length + 1) : css.slice(startIndex + selector.length + 1, endBody),
        block: endPos == null ? css.slice(startIndex + 1) : css.slice(startIndex, endBody == null ? endPos + 1 : endBody + 1)
    };
}
export function parseAtRule(block) {
    const match = (Array.isArray(block) ? block.join('') : block).trimStart().match(/^@(\S+)(\s*(.*?))?\s*([;{}]|$)/sm);
    if (match) {
        return [match[1].trim(), match[3].trim()];
    }
    return [];
}
export function parseDeclaration(str) {
    const index = find(str, 0, ':');
    if (index == null) {
        return null;
    }
    if (Array.isArray(str)) {
        return [
            str.slice(0, index).join('').trim(),
            str.slice(index + 1).join('').trim()
        ];
    }
    return [
        str.slice(0, index).trim(),
        str.slice(index + 1).trim()
    ];
}
