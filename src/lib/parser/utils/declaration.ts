import type {
    AstDeclaration,
    AttrToken,
    ErrorDescription,
    FunctionToken,
    Location,
    ParensToken,
    StringToken,
    Token
} from "../../../@types/index.d.ts";
import {EnumToken, walkValues} from "../../ast/index.ts";
import {isWhiteSpace} from "../../syntax/syntax.ts";

export function parseDeclarationNode(node: AstDeclaration, errors: ErrorDescription[], location: Location): AstDeclaration | null {

    while (node.val[0]?.typ == EnumToken.WhitespaceTokenType) {
        node.val.shift();
    }

    if (!node.nam.startsWith('--') && node.val.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ)).length == 0) {

        errors.push(<ErrorDescription>{
            action: 'drop',
            message: 'doParse: invalid declaration',
            location
        });

        return null;
    }

    for (const {value: val, parent} of walkValues(node.val, node)) {

        if (val.typ == EnumToken.AttrTokenType && (val as AttrToken).chi.every((t: Token) => [EnumToken.IdenTokenType, EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ))) {

            // @ts-ignore
            val.typ = EnumToken.IdenListTokenType;

        } else if (val.typ == EnumToken.StringTokenType && (node.nam == 'grid' || node.nam == 'grid-template-areas' || node.nam == 'grid-template-rows' || node.nam == 'grid-template-columns')) {

            (val as StringToken).val = (val as StringToken).val.at(0) + parseGridTemplate((val as StringToken).val.slice(1, -1)) + (val as StringToken).val.at(-1);

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