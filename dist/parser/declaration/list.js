import { PropertySet } from './set.js';
import { getConfig } from '../utils/config.js';
import { PropertyMap } from './map.js';

const config = getConfig();
class PropertyList {
    declarations;
    constructor() {
        this.declarations = new Map;
    }
    add(declaration) {
        if (declaration.typ != 'Declaration') {
            this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
            return this;
        }
        const propertyName = declaration.nam;
        if (propertyName in config.properties) {
            const shorthand = config.properties[propertyName].shorthand;
            if (!this.declarations.has(shorthand)) {
                this.declarations.set(shorthand, new PropertySet(config.properties[shorthand]));
            }
            this.declarations.get(shorthand).add(declaration);
            return this;
        }
        if (propertyName in config.map) {
            const shorthand = config.map[propertyName].shorthand;
            if (!this.declarations.has(shorthand)) {
                this.declarations.set(shorthand, new PropertyMap(config.map[shorthand]));
            }
            this.declarations.get(shorthand).add(declaration);
            return this;
        }
        this.declarations.set(propertyName, declaration);
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
            }
        };
    }
}

export { PropertyList };
