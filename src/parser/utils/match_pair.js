export function match_pair(css, index, open, close) {
    const str = Array.isArray(css) ? css : [...css];
    let count = 1;
    let currentIndex = index;
    let j = str.length;
    while (currentIndex++ < j) {
        if (str[currentIndex] == '\\') {
            currentIndex++;
            continue;
        }
        if ('"\''.includes(str[currentIndex])) {
            let end = currentIndex;
            while (end++ < j) {
                if (str[end] == '\\') {
                }
                else if (str[end] == str[currentIndex]) {
                    break;
                }
            }
            currentIndex = end;
            continue;
        }
        if (str[currentIndex] == close) {
            count--;
            if (count == 0) {
                return currentIndex;
            }
        }
        else if (str[currentIndex] == open) {
            count++;
        }
    }
    return null;
}
