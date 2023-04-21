/**
 * find the position of chr
 * @param css
 * @param start
 * @param chr
 */
export function find(css: string, start: number, chr: string): number | null {

    let char: string;
    let position: number = start - 1;
    let k: number;
    const j: number = css.length - 1;

    while (position++ < j) {

        char = css.charAt(position);

        if (char === '') {

            return null;
        }

        if (char == '\\') {

            position++
        } else if (char == '"' || char == "'") {

            // match quoted string
            const match = char;

            k = position;

            while (k++ < j) {

                char = css.charAt(k);

                if (char === '') {

                    return null;
                }

                if (char == '\\') {

                    k++;
                } else if (char == match) {

                    break;
                }
            }

            position = k;
        } else if (css.charAt(position) == '/' && css.charAt(position + 1) == '*') {

            k = position + 1;

            while (k++ < j) {

                char = css.charAt(k);

                if (char === '') {

                    return null;
                }

                if (char == '\\') {

                    k++;
                } else if (char == '*' && css.charAt(k + 1) == '/') {

                    k++;
                    break;
                }
            }

            position = k;
        } else if (chr.includes(char)) {

            return position;
        }
    }

    return null;
}