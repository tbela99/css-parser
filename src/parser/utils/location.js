import { isNewLine } from "./syntax";
export function update(location, css) {
    const str = Array.isArray(css) ? css : [...css];
    if (str.length == 0) {
        return location;
    }
    let i = -1;
    const j = str.length - 1;
    while (++i <= j) {
        if (isNewLine(str[i])) {
            location.line++;
            location.column = 0;
            if (str[i] == '\r' && str[i + 1] == '\n') {
                i++;
                location.index++;
            }
        }
        else {
            location.column++;
        }
        location.index++;
    }
    return location;
}
