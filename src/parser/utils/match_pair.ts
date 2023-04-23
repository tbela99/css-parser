export function match_pair(css: string[], index: number, open: string, close: string): number | null {

    const str: string[] = Array.isArray(css) ? css : [...css];
    let count: number = 1;
    let currentIndex: number = index;
    let j: number = str.length;

    while (currentIndex++ < j) {

        if (str[currentIndex] == '\\') {

            currentIndex++;
            continue;
        }

        if (open != str[currentIndex] && close != str[currentIndex] && '"\''.includes(str[currentIndex])) {

            let end: number = currentIndex;

            while (end++ < j) {

                if (str[end] == '\\') {

                } else if (str[end] == str[currentIndex]) {

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
        } else if (str[currentIndex] == open) {

            count++
        }
    }

    return null;
}