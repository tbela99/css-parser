import {find} from "./find";
import {ParsedBlock} from "../../@types";
import {match_pair} from "./match_pair";

export function getType(block: string): 'Rule' | 'AtRule' | null {

    const ch = block.trimStart()[0];

    if (ch == '@') {

        return 'AtRule'
    }

    if (/\S/.test(ch)) {

        return 'Rule';
    }

    return null;
}

export function parseBlock(str: string | string[], startIndex: number, matchIndex: number | null = null): ParsedBlock {

    const css: string[] = Array.isArray(str) ? <string[]>str : [...str];
    // @ts-ignore
    let endPos: number | null = Number.isInteger(matchIndex) ? matchIndex : find(css, startIndex, ';}{');
    let endBody: number | null = null;

    if (endPos != null) {

        if (css[endPos] == '{') {

            endBody = match_pair(css, endPos, '{', '}');
        } else {

            const match: string[] = css.slice(startIndex, endPos);
            const type = match[0] == '@' ? 'AtRule' : 'Declaration';

            // @ts-ignore
            const [name, value] = type == 'AtRule' ? parseAtRule(match) : parseDeclaration(match);

            return <ParsedBlock>{
                type,
                name: Array.isArray(name) ? name : [...name],
                value: Array.isArray(value) ? value : [...value],
                body: match,
                block: match.concat(css[endPos])
            }
        }
    }

    // @ts-ignore
    const selector: string[] = css.slice(startIndex, matchIndex == null ? endPos : matchIndex);

    return <ParsedBlock>{
        type: (endBody == null ? 'Invalid' : '') + (selector[0] == '@' ? 'AtRule' : 'Rule'),
        selector,
        body: endBody == null ? css.slice(startIndex + selector.length + 1) : css.slice(startIndex + selector.length + 1, endBody),
        block: endPos == null ? css.slice(startIndex + 1) : css.slice(startIndex, endBody == null ? endPos + 1 : endBody + 1)
    }
}

export function parseAtRule(block: string | string[]): string[] {

    const match = (Array.isArray(block) ? block.join('') : block).trimStart().match(/^@(\S+)(\s*(.*?))?\s*([;{}]|$)/sm);

    if (match) {

        return [match[1].trim(), match[3].trim()];
    }

    return [];
}

export function parseDeclaration(str: string | string[]): string[] | null {

    const index: number | null = find(str, 0, ':');

    if (index == null) {

        return null
    }

    if (Array.isArray(str)) {

        return [

            str.slice(0, index).join('').trim(),
            str.slice(index + 1).join('').trim()
        ]
    }

    return [

        str.slice(0, index).trim(),
        str.slice(index + 1).trim()
    ]
}