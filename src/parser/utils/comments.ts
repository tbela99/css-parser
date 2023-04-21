export function parse_comment(str: string, index: number): number | null {

    let currentIndex: number = index;

    if (str[currentIndex] != '/' || str[++currentIndex] != '*') {

        return null;
    }

    while (currentIndex++ < str.length) {

        if (str.charAt(currentIndex) == '*' && str.charAt(currentIndex + 1) == '/') {

            return currentIndex + 1;
        }
    }

    return null;
}