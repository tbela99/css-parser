import {AstDeclaration, ShorthandPropertyType, Token} from "../../@types";

export class PropertySet {

    private config: ShorthandPropertyType;
    private declarations: Map<string, AstDeclaration>;

    constructor(config: ShorthandPropertyType) {

        this.config = config;
        this.declarations = new Map<string, AstDeclaration>;
    }

    add(declaration: AstDeclaration) {

        if (<string>declaration.nam == this.config.shorthand) {

            this.declarations.clear();

            let isValid = true;
            const tokens: Token[] = [];

            for (let token of declaration.val) {

                if (this.config.types.includes(token.typ)) {

                    tokens.push(token);
                    continue;
                }

                if (token.typ != 'Whitespace' && token.typ != 'Comment') {

                    isValid = false;
                    break;
                }
            }

            if (!isValid) {

                this.declarations.set(<string> declaration.nam, declaration);
            }

            else {

            }
        }

        else {

            this.declarations.set(<string> declaration.nam, declaration);
        }

        return this;
    }
}