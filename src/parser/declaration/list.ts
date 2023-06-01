import {AstDeclaration, AstNode} from "../../@types";
import {PropertySet} from "./set";
import {getConfig} from "../utils/config";

const config = getConfig();

export class PropertyList {

    protected declarations: Map<string, AstNode | PropertySet>;

    constructor() {

        this.declarations = new Map<string, AstNode | PropertySet>;
    }

    add(declaration: AstNode) {

        if (declaration.typ != 'Declaration') {

            this.declarations.set(this.declarations.size.toString(), declaration);
            return this;
        }

        const propertyName: string = <string> (<AstDeclaration>declaration).nam;

        if (propertyName in config.properties) {

            const shorthand = <string>config.properties[propertyName].shorthand;

            if (!this.declarations.has(shorthand)) {

                this.declarations.set(shorthand, new PropertySet(config.properties[shorthand]));
            }

            (<PropertySet>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            return this;
        }

        this.declarations.set(propertyName, declaration);
        return this;
    }

    [Symbol.iterator]() {

        let iterator: IterableIterator<AstNode | PropertySet> = this.declarations.values();
        const iterators: Array<IterableIterator<AstNode | PropertySet>> = [];

        return {
            next() {

                let value: IteratorResult<AstNode | PropertySet> = iterator.next();

                while ((value.done && iterators.length > 0) ||
                value.value instanceof PropertySet) {

                    if (value.value instanceof PropertySet) {

                        iterators.unshift(iterator);

                        // @ts-ignore
                        iterator = value.value[Symbol.iterator]();

                        value = iterator.next();
                    }

                    if (value.done && iterators.length > 0) {

                        iterator = iterators.shift();
                        value = iterator.next();
                    }
                }

                return value;
            }
        }
    }
}