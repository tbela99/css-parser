import {Position} from "../../@types";
import {isNewLine} from "./syntax";

export function update(location: Position, css: string): Position {

    if (css.length == 0) {

        return location;
    }

    let chr: string;
    let i: number = -1;
    const j: number = css.length - 1;

    while (++i <= j) {

        chr = css.charAt(i);

        if (chr === '') {

            break;
        }

        if (isNewLine(chr)) {

            location.line++;
            location.column = 0;

            if (chr == '\r' && css.charAt(i + 1) == '\n') {

                i++;
                location.index++;
            }
        } else {

            location.column++;
        }

        location.index++;
    }

    return location
}