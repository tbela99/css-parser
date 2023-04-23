import {find} from "./find";
import {ParsedBlock} from "../../@types";
import {match_pair} from "./match_pair";

export function getType(block: string): 'Rule' | 'AtRule' | null {

    const ch: string = block.trimStart()[0];

    if (ch == '@') {

        return 'AtRule'
    }

    if (/\S/.test(ch)) {

        return 'Rule';
    }

    return null;
}

export function parseBlock(str: string[], startIndex: number, matchIndex: number | null = null): ParsedBlock {

    // @ts-ignore
    let endPos: number | null = Number.isInteger(matchIndex) ? matchIndex : find(str, startIndex, ';}{');
    let endBody: number | null = null;

    if (endPos != null) {

        if (str[endPos] == '{') {

            endBody = match_pair(str, endPos, '{', '}');
        } else {

            // console.debug({startIndex, endPos, str: str.slice(startIndex, endPos)});
            const match: string[] = str.slice(startIndex, endPos);
            const type = match[0] == '@' ? 'AtRule' : 'Declaration';

            // @ts-ignore
            const [name, value] = type == 'AtRule' ? parseAtRule(match) : parseDeclaration(match);

            return <ParsedBlock>{
                type,
                name,
                value,
                body: match,
                block: match.concat(str[endPos])
            }
        }
    }

    // @ts-ignore
    const selector: string[] = str.slice(startIndex, matchIndex == null ? endPos : matchIndex);

    return <ParsedBlock>{
        type: selector[0] == '@' ? 'AtRule' : 'Rule',
        selector,
        body: endBody == null ? str.slice(startIndex + selector.length + 1) : str.slice(startIndex + selector.length + 1, endBody),
        block: endPos == null || endBody == null ? str.slice(startIndex) : str.slice(startIndex, endBody + 1)
    }
}

export function parseAtRule(block: string[]): string[] {

    const match = block.join('').trimStart().match(/^@(\S+)(\s*(.*?))?\s*([;{}]|$)/sm);

    if (match) {

        return [match[1].trim(), match[3].trim()];
    }

    return [];
}

export function parseDeclaration(str: string[]): string[] | null {

    const index: number | null = find(str, 0, ':');

    if (index == null) {

        return [];
    }

    return [

        str.slice(0, index).join('').trim(),
        str.slice(index + 1).join('').trim()
    ]
}