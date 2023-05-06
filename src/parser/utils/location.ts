import {Position} from "../../@types";
import {isNewLine} from "./syntax";

export function update(location: Position, css: string): Position {

    if (css === '') {

        return location;
    }

    let i: number = 0;
    let codepoint: number;
    let offset: number;
    const j: number = css.length - 1;

    if (location.line == 0) {

        location.line = 1;
    }

    while (i <= j) {

        codepoint = <number>css.codePointAt(i);
        offset = codepoint < 256 ? 1 : String.fromCodePoint(codepoint).length;

        if (isNewLine(codepoint)) {

            location.line++;
            location.column = 0;

            // \r\n
            if (codepoint == 0xd && css.codePointAt(i + 1) == 0xa) {

                offset++;
                location.index++;
            }

        } else {

            location.column++;
        }

        location.index++;
        i += offset;
    }

    return location
}