import { PropertySet } from './set.js';
import { getConfig } from '../utils/config.js';
import { PropertyMap } from './map.js';
import { parseString } from '../parse.js';
import { EnumToken } from '../../ast/types.js';

const config = getConfig();
class PropertyList {
    options = { removeDuplicateDeclarations: true, computeShorthand: true };
    declarations;
    constructor(options = {}) {
        this.options = options;
        this.declarations = new Map();
    }
    set(nam, value) {
        return this.add({
            typ: EnumToken.DeclarationNodeType,
            nam,
            val: Array.isArray(value) ? value : parseString(String(value)),
        });
    }
    add(...declarations) {
        let name;
        for (const declaration of declarations) {
            name =
                declaration.typ != EnumToken.DeclarationNodeType
                    ? null
                    : declaration.nam.toLowerCase();
            if (declaration.typ != EnumToken.DeclarationNodeType ||
                "composes" === name ||
                (typeof this.options.removeDuplicateDeclarations === "string" &&
                    this.options.removeDuplicateDeclarations === name) ||
                (Array.isArray(this.options.removeDuplicateDeclarations)
                    ? this.options.removeDuplicateDeclarations.includes(declaration.nam)
                    : !this.options.removeDuplicateDeclarations)) {
                this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
                continue;
            }
            if (!this.options.computeShorthand) {
                this.declarations.set(declaration.nam, declaration);
                continue;
            }
            let propertyName = declaration.nam;
            let shortHandType;
            let shorthand;
            if (propertyName in config.properties) {
                // @ts-ignore
                if ("map" in config.properties[propertyName]) {
                    shortHandType = "map";
                    // @ts-ignore
                    shorthand = config.properties[propertyName].map;
                }
                else {
                    shortHandType = "set";
                    // @ts-ignore
                    shorthand = config.properties[propertyName].shorthand;
                }
            }
            else if (propertyName in config.map) {
                shortHandType = "map";
                // @ts-ignore
                shorthand = config.map[propertyName].shorthand;
            }
            // @ts-ignore
            if (shortHandType == "map") {
                // @ts-ignore
                if (!this.declarations.has(shorthand)) {
                    // @ts-ignore
                    this.declarations.set(shorthand, new PropertyMap(config.map[shorthand]));
                }
                // @ts-ignore
                this.declarations.get(shorthand).add(declaration);
            }
            // @ts-ignore
            else if (shortHandType == "set") {
                // @ts-ignore
                if (!this.declarations.has(shorthand)) {
                    // @ts-ignore
                    this.declarations.set(
                    // @ts-ignore
                    shorthand, 
                    // @ts-ignore
                    new PropertySet(config.properties[shorthand]));
                }
                // @ts-ignore
                this.declarations.get(shorthand).add(declaration);
            }
            else {
                this.declarations.set(propertyName, declaration);
            }
        }
        return this;
    }
    [Symbol.iterator]() {
        let iterator = this.declarations.values();
        const iterators = [];
        return {
            next() {
                let value = iterator.next();
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
                        iterator = iterators.shift();
                        value = iterator.next();
                    }
                }
                return value;
            },
        };
    }
}

export { PropertyList };
