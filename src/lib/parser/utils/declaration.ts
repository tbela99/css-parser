import {AstDeclaration, ErrorDescription, FunctionToken, ParensToken, Position, Token} from "../../../@types";
import {EnumToken, walkValues} from "../../ast";
import {isWhiteSpace} from "./syntax";

export function parseDeclaration(node: AstDeclaration, errors: ErrorDescription[], src: string, position: Position): AstDeclaration | null {

    while (node.val[0]?.typ == EnumToken.WhitespaceTokenType) {
        node.val.shift();
    }

    if (node.val.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ)).length == 0) {

        errors.push(<ErrorDescription>{
            action: 'drop',
            message: 'doParse: invalid declaration',
            location: {src, ...position}
        });

        return null;
    }

    for (const {value: val, parent} of walkValues(node.val, node)) {

        if (val.typ == EnumToken.AttrTokenType && val.chi.every((t: Token) => [EnumToken.IdenTokenType, EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ))) {

            // @ts-ignore
            val.typ = EnumToken.IdenListTokenType;

        } else if (val.typ == EnumToken.StringTokenType && (node.nam == 'grid' || node.nam == 'grid-template-areas' || node.nam == 'grid-template-rows' || node.nam == 'grid-template-columns')) {

            val.val = val.val.at(0) + parseGridTemplate(val.val.slice(1, -1)) + val.val.at(-1);

            // @ts-ignore
            const array: Token[] = (<FunctionToken | ParensToken>parent)?.chi ?? node.val;

            const index: number = array.indexOf(val);

            if (index > 0 && array[index - 1].typ == EnumToken.WhitespaceTokenType) {

                array.splice(index - 1, 1);
            }
        }
    }

    return node;
}

function parseGridTemplate(template: string): string {

    let result: string = '';
    let buffer: string = '';

    for (let i = 0; i < template.length; i++) {

        const char: string = template[i];

        if (isWhiteSpace(<number>char.codePointAt(0))) {

            while (i + 1 < template.length && isWhiteSpace(<number>template[i + 1].codePointAt(0))) {

                i++;
            }

            result += buffer + ' ';
            buffer = '';
        } else if (char == '.') {

            while (i + 1 < template.length && template[i + 1] == '.') {

                i++;
            }

            if (isWhiteSpace(<number>(result.at(-1)?.codePointAt(0)))) {

                result = result.slice(0, -1);
            }

            result += buffer + char;
            buffer = '';
        } else {

            buffer += char;
        }
    }

    return buffer.length > 0 ? result + buffer : result;
}