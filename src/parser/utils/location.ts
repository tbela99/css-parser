import {Position} from "../../@types";
import {isNewLine} from "./syntax";

export function update(location: Position, css: string | Array<string>): Position {

    const str: Array<string> = Array.isArray(css) ? css : [...css];

    if (str.length == 0) {

        return location;
    }

    let i: number = -1;
    const j: number = str.length - 1;

    while (++i <= j) {

        if (isNewLine(str[i])) {

            location.line++;
            location.column = 0;

            if (str[i] == '\r' && str[i + 1] == '\n') {

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