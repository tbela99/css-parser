import {
    AstDeclaration,
    AstNode,
    PropertyListOptions,
    ShorthandMapType,
    ShorthandPropertyType,
    PropertiesConfig,
    Token
} from "../../../@types";
import {PropertySet} from "./set";
import {getConfig} from "../utils";
import {PropertyMap} from "./map";
import {parseString} from "../parse";
import {EnumToken} from "../../ast";

const config: PropertiesConfig = getConfig();

export class PropertyList {

    protected options: PropertyListOptions = {removeDuplicateDeclarations: true, computeShorthand: true};
    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;

    constructor(options: PropertyListOptions = {}) {

        this.options = options;
        // for (const key of Object.keys(this.options)) {
        //
        //     if (key in options) {
        //
        //         // @ts-ignore
        //         this.options[key] = options[key];
        //     }
        // }

        this.declarations = new Map<string, AstNode | PropertySet | PropertyMap>;
    }

    set(nam: string, value: string | Token[]) {

        return this.add({
            typ: EnumToken.DeclarationNodeType,
            nam,
            val: Array.isArray(value) ? value : parseString(String(value))
        });
    }

    add(declaration: AstNode) {

        if (declaration.typ != EnumToken.DeclarationNodeType || !this.options.removeDuplicateDeclarations) {

            this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
            return this;
        }

        if (!this.options.computeShorthand) {

            this.declarations.set((<AstDeclaration>declaration).nam, declaration);
            return this;
        }

        let propertyName: string = <string>(<AstDeclaration>declaration).nam;
        let shortHandType: 'map' | 'set';
        let shorthand: string;

        if (propertyName in config.properties) {

            // @ts-ignore
            if ('map' in (<ShorthandPropertyType>config.properties[propertyName])) {

                shortHandType = 'map';
                // @ts-ignore
                shorthand = <string>config.properties[propertyName].map;
            } else {

                shortHandType = 'set';
                // @ts-ignore
                shorthand = <string>config.properties[propertyName].shorthand;
            }
        } else if (propertyName in config.map) {

            shortHandType = 'map';
            // @ts-ignore
            shorthand = <string>config.map[propertyName].shorthand;
        }

        // @ts-ignore
        if (shortHandType == 'map') {

            // @ts-ignore
            if (!this.declarations.has(shorthand)) {

                // @ts-ignore
                this.declarations.set(shorthand, new PropertyMap(<ShorthandMapType>config.map[shorthand], this.options));
            }

            // @ts-ignore
            (<PropertyMap>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            // return this;
        }

        // @ts-ignore
        else if (shortHandType == 'set') {

            // @ts-ignore
            // const shorthand: string = <string>config.properties[propertyName].shorthand;

            if (!this.declarations.has(shorthand)) {

                // @ts-ignore
                this.declarations.set(shorthand, new PropertySet(<ShorthandPropertyType>config.properties[shorthand], this.options));
            }

            // @ts-ignore
            (<PropertySet>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            // return this;
        } else {

            this.declarations.set(propertyName, declaration);
        }

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

                return <{ value: AstNode, done: boolean }>value;
            }
        }
    }
}