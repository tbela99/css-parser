import {Position} from "../../@types";
import {isNewLine} from "./syntax";

export function update(location: Position, css: Array<string>): Position {

    if (css.length == 0) {

        return location;
    }

    let i: number = -1;
    const j: number = css.length - 1;

    if (location.line == 0) {

        location.line = 1;
    }

    while (++i <= j) {

        if (isNewLine(css[i])) {

            location.line++;
            location.column = 0;

            if (css[i] == '\r' && css[i + 1] == '\n') {

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