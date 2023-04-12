/**
 * find the position of chr
 * @param css
 * @param start
 * @param chr
 */
export function find(css: string | string[], start: number, chr: string): number | null {

    const str: string[] = Array.isArray(css) ? css : [...css];
    let position: number = start - 1;
    let k;
    const j: number = str.length - 1;

    while (position++ < j) {

        if (str[position] == '\\') {

            position++
        }

        else if (str[position] == '"' || str[position] == "'") {

            // match quoted string
            const match = str[position];

            k = position;

            while (k++ < j) {

                if (str[k] == '\\') {

                    k++
                }

                else if (str[k] == match) {

                    break;
                }
            }

            position = k;

        }

        else if (str[position] == '/' && str[position + 1] == '*') {

            k = position + 1;

            while (k++ < j) {

                if (str[k] == '\\') {

                    k++
                }

                else if (str[k] == '*' && str[k + 1] == '/') {

                    k++;
                    break;
                }
            }

            position = k;
        }

        else if (chr.includes(str[position])) {

            return position;
        }
    }

    return null;
}