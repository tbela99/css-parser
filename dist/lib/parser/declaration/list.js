import { PropertySet } from './set.js';
import { getConfig } from '../utils/config.js';
import { PropertyMap } from './map.js';
import { parseString } from '../parse.js';
import { EnumToken, EnumAstNodeStatus } from '../../ast/types.js';
import { getParsedSyntax } from '../../validation/config.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { STATE } from '../../syntax/constants.js';
import { objectHash } from '../utils/hash.js';
import { equalsIgnoreCase } from '../utils/text.js';

const config = getConfig();
class PropertyList {
    options = { removeDuplicateDeclarations: true, computeShorthand: true };
    declarations;
    //  ketsey = new Map;
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
        let syntaxRules = null;
        let result;
        for (const declaration of declarations) {
            name = declaration.typ != EnumToken.DeclarationNodeType ? null : declaration.nam;
            if (declaration[STATE] == EnumAstNodeStatus.Invalid ||
                declaration[STATE] == EnumAstNodeStatus.Unknown ||
                declaration[STATE] == EnumAstNodeStatus.ValidationFailed ||
                declaration.typ != EnumToken.DeclarationNodeType ||
                equalsIgnoreCase("composes", name) ||
                (typeof this.options.removeDuplicateDeclarations === "string" &&
                    this.options.removeDuplicateDeclarations === name) ||
                (Array.isArray(this.options.removeDuplicateDeclarations)
                    ? this.options.removeDuplicateDeclarations.includes(declaration.nam)
                    : !this.options.removeDuplicateDeclarations)) {
                const key = objectHash(declaration);
                if (this.declarations.has(key)) {
                    this.declarations.delete(key);
                }
                this.declarations.set(key, declaration);
                continue;
            }
            if (!this.options.computeShorthand) {
                this.declarations.set(declaration.nam, declaration);
                continue;
            }
            if (declaration[STATE] == EnumAstNodeStatus.Unvalidated) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, declaration.nam.toLowerCase());
                if (syntaxRules != null) {
                    result = matchAllSyntaxes(syntaxRules, createValidationContext(declaration.val), this.options);
                    declaration[STATE] = result.success
                        ? EnumAstNodeStatus.Validated
                        : EnumAstNodeStatus.ValidationFailed;
                }
            }
            // do not compute shorthand for invalid declarations
            if (declaration[STATE] !== EnumAstNodeStatus.Validated) {
                // const key = objectHash(declaration);
                // if (!this.ketsey.has(key)) {
                //     this.ketsey.set(key, [declaration.nam]);
                //     console.error(
                //         `Adding declaration : ${(<AstDeclaration>declaration).nam} with key : ${key}`
                //     )
                // }
                // else {
                //     console.error(
                //         `Duplicate declaration found: ${(<AstDeclaration>declaration).nam} with key : [ ${key} => ${this.ketsey.get(key)} ]`
                //     )
                //     console.error(JSON.stringify(toSortedString(declaration)))
                //     this.ketsey.get(key).push(declaration.nam);
                // }
                this.declarations.set(objectHash(declaration), declaration);
                return this;
            }
            let propertyName = declaration.nam;
            let shortHandType;
            let shorthand = null;
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
            else if (propertyName in config.property) {
                shortHandType = "single";
                // @ts-ignore
                shorthand = config.property[propertyName];
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
                if (shorthand != null) {
                    this.mapValues(declaration, shorthand);
                }
                this.declarations.set(propertyName, declaration);
            }
        }
        return this;
    }
    mapValues(declaration, mapping) {
        let name;
        let values = declaration.val;
        if (mapping.pattern != null) {
            // match pattern
            for (const patterns of mapping.pattern) {
                const set = new Set(values.filter((v) => v.typ !== EnumToken.CommentTokenType && v.typ !== EnumToken.WhitespaceTokenType));
                const val = [];
                for (const pattern of patterns) {
                    switch (pattern) {
                        case "<length>":
                            for (const v of set) {
                                if (v.typ === EnumToken.LengthTokenType ||
                                    (v.typ === EnumToken.NumberTokenType && v.val === 0)) {
                                    val.push(v);
                                    set.delete(v);
                                }
                            }
                        default: {
                            for (const v of set) {
                                if (v.typ === EnumToken.IdenTokenType) {
                                    const value = v.val.toLowerCase();
                                    if (value === pattern || new RegExp(`(^|\|)${pattern}(\||$)`).test(value)) {
                                        val.push(v);
                                        set.delete(v);
                                    }
                                }
                            }
                        }
                    }
                }
                if (set.size === 0) {
                    values = val.reduce((acc, curr) => {
                        if (acc.length > 0) {
                            acc.push({ typ: EnumToken.WhitespaceTokenType });
                        }
                        acc.push(curr);
                        return acc;
                    }, []);
                    break;
                }
            }
        }
        for (const val of declaration.val) {
            if (val.typ === EnumToken.IdenTokenType) {
                name = val.val.toLowerCase();
                if (mapping.mapping[name] != null) {
                    // @ts-expect-error
                    Object.assign(val, mapping.mapping[name], { typ: EnumToken[mapping.mapping[name].typ] });
                }
            }
        }
        if (values != declaration.val) {
            declaration.val.length = 0;
            for (const v of values) {
                declaration.val.push(v);
            }
        }
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
