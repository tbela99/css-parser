import {AstDeclaration, AstNode, ShorthandMapType, ShorthandPropertyType} from "../../@types";
import {PropertySet} from "./set";
import {getConfig} from "../utils";
import {PropertyMap} from "./map";

const config = getConfig();

export class PropertyList {

    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;

    constructor() {

        this.declarations = new Map<string, AstNode | PropertySet | PropertyMap>;
    }

    add(declaration: AstNode) {

        if (declaration.typ != 'Declaration') {

            this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
            return this;
        }

        const propertyName: string = <string>(<AstDeclaration>declaration).nam;

        if (propertyName in config.properties) {

            // @ts-ignore
            const shorthand: string = <string>config.properties[propertyName].shorthand;

            if (!this.declarations.has(shorthand)) {

                // @ts-ignore
                this.declarations.set(shorthand, new PropertySet(<ShorthandPropertyType>config.properties[shorthand]));
            }

            (<PropertySet>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            return this;
        }

        if (propertyName in config.map) {

            // @ts-ignore
            const shorthand: string = <string>config.map[propertyName].shorthand;

            if (!this.declarations.has(shorthand)) {

                // @ts-ignore
                this.declarations.set(shorthand, new PropertyMap(<ShorthandMapType>config.map[shorthand]));
            }

            (<PropertyMap>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            return this;
        }

        this.declarations.set(propertyName, declaration);
        return this;
    }

    [Symbol.iterator]() {

        let iterator: IterableIterator<AstNode | PropertySet | PropertyMap> = this.declarations.values();
        const iterators: Array<IterableIterator<AstNode | PropertySet | PropertyMap>> = [];

        return {
            next() {

                let value: IteratorResult<AstNode | PropertySet | PropertyMap> = iterator.next();

                while ((value.done && iterators.length > 0) ||
                value.value instanceof PropertySet ||
                value.value instanceof PropertyMap) {

                    if (value.value instanceof PropertySet || value.value instanceof PropertyMap) {

                        iterators.unshift(iterator);

                        // @ts-ignore
                        iterator = value.value[Symbol.iterator]();
                        value = iterator.next();
                    }

                    if (value.done && iterators.length > 0) {

                        iterator = <IterableIterator<AstNode | PropertySet | PropertyMap>>iterators.shift();
                        value = iterator.next();
                    }
                }

                return value;
            }
        }
    }
}