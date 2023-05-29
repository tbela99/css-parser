import {AstDeclaration, AstNode} from "../../@types";

import config from '../../config.json' assert {type: 'json'};
import {PropertySet} from "./set";

export class PropertyList {

    private declarations: Map<any, any>;

    constructor() {

        this.declarations = new Map<string, AstDeclaration>;
    }

    add(declaration: AstNode) {

        if (declaration.typ != 'Declaration') {

            this.declarations.set(this.declarations.size, declaration);
            return this;
        }

        const propertyName: string = <string> (<AstDeclaration>declaration).nam;

        if (propertyName in config) {

            const shorthand = config.properties[propertyName].shorthand;

            if (!this.declarations.has(shorthand)) {

                this.declarations.set(shorthand, new PropertySet(config[propertyName]));
            }

            this.declarations.get(shorthand)
        }

        this.declarations.set(propertyName, declaration);

        return this;
    }
}