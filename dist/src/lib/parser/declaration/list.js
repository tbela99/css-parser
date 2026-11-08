/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { PropertySet } from './set.js';
import { getConfig } from '../utils/config.js';
import { PropertyMap } from './map.js';
import { EnumAstNodeStatus, EnumToken } from '../../ast/types.js';
import { getParsedSyntax } from '../../validation/config.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { isValidDeclarationValue } from '../../validation/match.js';
import { equalsIgnoreCase, lowercase } from '../utils/text.js';
import { StructuralMemo } from '../../ast/cache.js';
import { parseString } from '../parse.js';

const config = getConfig();
/**
 * Results shared by the property lists of a minification, valid for the arena they were computed for:
 * - the keys of the declarations that are not merged by name (invalid declarations, custom properties, comments, ...):
 *   identical declarations have the same key
 * - the tokens of the default values of the shorthand properties: each value is parsed once, the tokens are cloned
 *
 * @internal
 */
class DeclarationMemo {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static shape = new DeclarationMemo();
    /**
     * key by structure. same equality as the structural signature: 0 and -0 are equal
     */
    keys = new StructuralMemo(true);
    /**
     * parsed values: detached tokens that are cloned, never attached to the tree
     */
    parsed = new Map();
    /**
     * tokens of a value, see {@link parseString}. the value is parsed once, the tokens are cloned
     * @param arena
     * @param value
     */
    parse(arena, value) {
        let template = this.parsed.get(value);
        if (template === undefined) {
            template = parseString(arena, value);
            this.parsed.set(value, template);
        }
        const tokens = new Array(template.length);
        for (let i = 0; i < template.length; i++) {
            tokens[i] = arena.clone(template[i], true);
        }
        return tokens;
    }
    /**
     * unique key of the structure of a node (type, name, values, tokens and children). identical nodes have the same key
     * @param arena
     * @param node
     */
    key(arena, node) {
        const slot = this.keys.token(arena, node);
        // inlined: this.keys.get(slot)
        let key = this.keys.values[slot];
        if (key === undefined) {
            // not a property name
            key = "\0" + slot;
            // inlined: this.keys.set(slot, key)
            this.keys.values[slot] = key;
        }
        return key;
    }
}
/**
 * Represents a list of property declarations, compute shorthand and remove duplicate declarations.
 */
class PropertyList {
    /**
     * options
     */
    options = { removeDuplicateDeclarations: true, computeShorthand: true };
    /**
     * declarations
     */
    declarations;
    /**
     * arena the declarations are stored in
     */
    arena;
    /**
     * keys shared by the lists that use the same arena
     */
    memo;
    /**
     *
     * @param arena
     * @param options
     * @param memo keys shared by the lists that use the same arena
     */
    constructor(arena, options = {}, memo = null) {
        this.arena = arena;
        this.options = options;
        this.declarations = new Map();
        this.memo = memo ?? new DeclarationMemo();
    }
    /**
     * add declarations
     * @param declarations node ids
     * @returns
     */
    add(declarations) {
        for (const declaration of declarations) {
            this.addDeclaration(declaration);
        }
        return this;
    }
    /**
     * add a declaration
     * @param declaration node id
     */
    addDeclaration(declaration) {
        let name;
        let syntaxRules = null;
        const arena = this.arena;
        name =
            arena.dataTypes[declaration] != EnumToken.DeclarationNodeType
                ? null
                : arena.strings[arena.name[declaration]];
        // do not compute shorthand for invalid declarations
        if (name == null) {
            this.declarations.set(this.memo.key(arena, declaration), declaration);
            return this;
        }
        // @functiom / result
        if (arena.flags[declaration] & EnumAstNodeStatus.Unknown && equalsIgnoreCase("result", name)) {
            this.declarations.set(name, declaration);
            return this;
        }
        if (arena.flags[declaration] &
            (EnumAstNodeStatus.Invalid | EnumAstNodeStatus.Unknown | EnumAstNodeStatus.ValidationFailed) ||
            equalsIgnoreCase("composes", name) ||
            (typeof this.options.removeDuplicateDeclarations === "string" &&
                this.options.removeDuplicateDeclarations === name) ||
            (Array.isArray(this.options.removeDuplicateDeclarations)
                ? this.options.removeDuplicateDeclarations.includes(name)
                : !this.options.removeDuplicateDeclarations)) {
            const key = this.memo.key(arena, declaration);
            if (this.declarations.has(key)) {
                this.declarations.delete(key);
            }
            this.declarations.set(key, declaration);
            return this;
        }
        if (!this.options.computeShorthand) {
            this.declarations.set(name, declaration);
            return this;
        }
        if (arena.flags[declaration] & EnumAstNodeStatus.Unvalidated) {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(name));
            if (syntaxRules != null) {
                arena.flags[declaration] |=
                    (isValidDeclarationValue(arena, syntaxRules, declaration, this.options)
                        ? EnumAstNodeStatus.Validated
                        : EnumAstNodeStatus.ValidationFailed) & ~EnumAstNodeStatus.Unvalidated;
            }
        }
        // do not compute shorthand for invalid declarations
        if (!(arena.flags[declaration] & EnumAstNodeStatus.Validated)) {
            this.declarations.set(this.memo.key(arena, declaration), declaration);
            return this;
        }
        let propertyName = name;
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
        if (this.declarations.has(shorthand)) {
            let existing = this.declarations.get(shorthand);
            if (existing instanceof PropertySet || existing instanceof PropertyMap) {
                existing = existing.declarations.get(name);
            }
            if (existing != null &&
                typeof existing == "number" &&
                arena.flags[existing] & EnumAstNodeStatus.ImportantDeclaration &&
                arena.flags[declaration] & ~EnumAstNodeStatus.ImportantDeclaration) {
                return this;
            }
        }
        // @ts-ignore
        if (shortHandType == "map") {
            let owner = this;
            const mapName = 
            // @ts-ignore
            config.map[propertyName]?.map ?? config.map[shorthand]?.properties?.[propertyName]?.map;
            if (typeof mapName === "string") {
                if (!this.declarations.has(mapName)) {
                    this.declarations.set(mapName, 
                    // @ts-ignore
                    new PropertyMap(arena, config.map[mapName], this.memo));
                }
                owner = this.declarations.get(mapName);
            }
            else if (!this.declarations.has(shorthand)) {
                // @ts-ignore
                this.declarations.set(shorthand, new PropertyMap(arena, config.map[shorthand], this.memo));
            }
            if (owner == this) {
                // @ts-ignore
                owner.declarations.get(shorthand).add(declaration);
            }
            else {
                if (!owner.declarations.has(shorthand)) {
                    owner.declarations.set(shorthand, 
                    // @ts-ignore
                    new PropertyMap(arena, config.map[shorthand], this.memo));
                }
                // @ts-ignore
                owner.declarations.get(shorthand).add(declaration);
            }
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
                new PropertySet(arena, config.properties[shorthand]));
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
        return this;
    }
    /**
     *
     * @param declaration
     * @param mapping
     */
    mapValues(declaration, mapping) {
        let name;
        const arena = this.arena;
        const declarationValues = arena.tokens(declaration);
        let values = declarationValues;
        if (mapping.pattern != null) {
            // match pattern
            for (const patterns of mapping.pattern) {
                const set = new Set(values.filter((v) => arena.dataTypes[v] !== EnumToken.CommentTokenType &&
                    arena.dataTypes[v] !== EnumToken.WhitespaceTokenType));
                const val = [];
                for (const pattern of patterns) {
                    switch (pattern) {
                        case "<length>":
                            for (const v of set) {
                                if (arena.dataTypes[v] === EnumToken.LengthTokenType ||
                                    (arena.dataTypes[v] === EnumToken.NumberTokenType && arena.numericValue[v] === 0)) {
                                    val.push(v);
                                    set.delete(v);
                                }
                            }
                        default: {
                            for (const v of set) {
                                if (arena.dataTypes[v] === EnumToken.IdenTokenType) {
                                    const value = arena.strings[arena.stringValue[v]].toLowerCase();
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
                            acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                        }
                        acc.push(curr);
                        return acc;
                    }, []);
                    break;
                }
            }
        }
        for (const val of declarationValues) {
            if (arena.dataTypes[val] === EnumToken.IdenTokenType) {
                name = arena.strings[arena.stringValue[val]].toLowerCase();
                if (mapping.mapping[name] != null) {
                    const typ = EnumToken[mapping.mapping[name].typ];
                    arena.resetToken(val, typ, mapping.mapping[name].val);
                }
            }
        }
        if (values != declarationValues) {
            arena.setTokenList(declaration, values);
        }
    }
    /**
     *
     * @returns
     */
    [Symbol.iterator]() {
        let iterator = this.declarations.values();
        const iterators = [];
        // @ts-ignore
        return {
            next() {
                let value = iterator.next();
                while ((value.done && iterators.length > 0) ||
                    value.value instanceof PropertySet ||
                    value.value instanceof PropertyMap) {
                    if (value.value instanceof PropertySet || value.value instanceof PropertyMap) {
                        // stack of the parent iterators
                        iterators.push(iterator);
                        // @ts-ignore
                        iterator = value.value[Symbol.iterator]();
                        value = iterator.next();
                    }
                    if (value.done && iterators.length > 0) {
                        iterator = iterators.pop();
                        value = iterator.next();
                    }
                }
                return value;
            },
        };
    }
}

export { DeclarationMemo, PropertyList };
