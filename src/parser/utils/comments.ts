export function parse_comment(str: Array<string>, index: number): number | null {

    let currentIndex = index;

    if (str[currentIndex] != '/' || str[++currentIndex] != '*') {

        return null;
    }

    while (currentIndex++ < str.length) {

        if (str[currentIndex] == '*' && str[currentIndex + 1] == '/') {

            return currentIndex + 1;
        }
    }

    return null;
}