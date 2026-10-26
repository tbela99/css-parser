import {isWhiteSpace} from "../../syntax/syntax.ts";
import {combinators} from "../../syntax/constants.ts";

/**
 * Split selector string
 * @param buffer
 *
 * @internal
 */
export function splitRule(buffer: string): string[][] {
    const result: string[][] = [[]];
    let str: string = "";

    for (let i = 0; i < buffer.length; i++) {
        let chr: string = buffer.charAt(i);

        if (isWhiteSpace(chr.charCodeAt(0))) {
            if (str !== "") {
                // @ts-ignore
                result.at(-1).push(str);
                str = "";
            }

            // @ts-ignore
            if (result.at(-1).length > 0) {
                // @ts-ignore
                result.at(-1).push(" ");
            }

            // i = k;
            continue;
        }

        if (chr == ",") {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            result.push([]);
            continue;
        }

        if (chr == ".") {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            str += chr;
            continue;
        }

        if (combinators.includes(chr)) {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            if (chr == "|" && buffer.charAt(i + 1) == "|") {
                chr += buffer.charAt(++i);
            }

            result.at(-1)!.push(chr);
            continue;
        }

        if (chr == ":") {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            if (buffer.charAt(i + 1) == ":") {
                chr += buffer.charAt(++i);
            }

            str += chr;
            continue;
        }

        str += chr;
        if (chr == "\\") {
            str += buffer.charAt(++i);
            continue;
        }

        if (chr == "(" || chr == "[") {
            const open = chr;
            const close = chr == "(" ? ")" : "]";
            let inParens: number = 1;
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                if (chr == "\\") {
                    str += buffer.slice(k, k + 2);
                    k++;
                    continue;
                }
                str += chr;
                if (chr == open) {
                    inParens++;
                } else if (chr == close) {
                    inParens--;
                }
                if (inParens == 0) {
                    break;
                }
            }
            i = k;
        }
    }

    if (str !== "") {
        result.at(-1)!.push(str);
    }

    return result;
}