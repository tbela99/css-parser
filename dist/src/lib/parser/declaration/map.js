/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { eqToken } from '../utils/eq.js';
import { getConfig } from '../utils/config.js';
import { matchType } from '../utils/type.js';
import { EnumToken } from '../../ast/types.js';
import { renderValue } from '../../printer/render.js';
import { parseString } from '../parse.js';
import { PropertySet } from './set.js';

const propertiesConfig = getConfig();
/**
 * token type of a configuration token
 * @param config
 */
function configType(config) {
    return EnumToken[config.typ];
}
/**
 * create a token from the shorthand configuration
 * @param arena
 * @param config
 */
function configToken(arena, config) {
    if (config == null) {
        return arena.createToken(EnumToken.WhitespaceTokenType);
    }
    return arena.createToken(configType(config), config.val);
}
/**
 * true if the token matches the configuration token
 * @param arena
 * @param token
 * @param config
 */
function matchConfigToken(arena, token, config) {
    return (config != null &&
        arena.dataTypes[token] === configType(config) &&
        (config.val == null || arena.strings[arena.stringValue[token]] === config.val));
}
/**
 * map of declarations that can be merged into a single shorthand declaration.
 * declarations are arena node ids
 */
class PropertyMap {
    declarations;
    config;
    arena;
    requiredCount;
    pattern;
    /**
     * longhand property name of the matched tokens
     */
    propertyNames = new Map();
    /**
     * results shared by the lists of a minification: the default values are parsed once
     */
    memo;
    /**
     * @param arena
     * @param config
     * @param memo results shared by the lists of a minification
     */
    constructor(arena, config, memo = null) {
        this.memo = memo;
        const values = Object.values(config.properties);
        this.arena = arena;
        this.requiredCount =
            values.reduce((acc, curr) => (curr.required ? ++acc : acc), 0) ||
                values.length;
        this.config = config;
        this.declarations = new Map();
        this.pattern = config.pattern.split(/\s/);
    }
    /**
     *
     * @param declaration
     */
    add(declaration) {
        const arena = this.arena;
        const nam = arena.strings[arena.name[declaration]];
        if (nam === this.config.shorthand) {
            this.declarations.clear();
            this.declarations.set(nam, declaration);
            this.matchTypes(declaration);
        }
        else {
            const separator = this.config.separator ?? null;
            // expand shorthand
            if (this.declarations.has(this.config.shorthand)) {
                const tokens = {};
                const values = [];
                const val = [[]];
                for (const curr of arena.tokens(this.declarations.get(this.config.shorthand))) {
                    if (matchConfigToken(arena, curr, separator)) {
                        val.push([]);
                        continue;
                    }
                    val[val.length - 1].push(curr);
                }
                for (let current = 0; current < val.length; current++) {
                    values.push(...this.pattern.reduce((acc, property) => {
                        // let current: number = 0;
                        const props = this.config.properties[property];
                        for (let i = 0; i < acc.length; i++) {
                            if (arena.dataTypes[acc[i]] === EnumToken.CommentTokenType ||
                                arena.dataTypes[acc[i]] === EnumToken.WhitespaceTokenType) {
                                acc.splice(i, 1);
                                i--;
                                continue;
                            }
                            if (this.propertyNames.get(acc[i]) === property || matchType(arena, acc[i], props)) {
                                if ("prefix" in props && props.previous != null && !(props.previous in tokens)) {
                                    return acc;
                                }
                                if (!(property in tokens)) {
                                    tokens[property] = [[acc[i]]];
                                }
                                else {
                                    if (current === tokens[property].length) {
                                        tokens[property].push([acc[i]]);
                                    }
                                    else {
                                        tokens[property][current].push(arena.createToken(EnumToken.WhitespaceTokenType), acc[i]);
                                    }
                                }
                                acc.splice(i, 1);
                                i--;
                                if ("prefix" in props &&
                                    i >= 0 &&
                                    matchConfigToken(arena, acc[i], props.prefix)) {
                                    acc.splice(i, 1);
                                    i--;
                                }
                                if (props.multiple) {
                                    continue;
                                }
                                return acc;
                            }
                            else {
                                if (property in tokens && tokens[property].length > current) {
                                    return acc;
                                }
                            }
                        }
                        if (property in tokens && tokens[property].length > current) {
                            return acc;
                        }
                        // default
                        if (props.default.length > 0) {
                            // inlined: this.parse(props.default[0])
                            const defaults = this.memo == null
                                ? parseString(this.arena, props.default[0])
                                : this.memo.parse(this.arena, props.default[0]);
                            if (!(property in tokens)) {
                                tokens[property] = [[...defaults]];
                            }
                            else {
                                if (current === tokens[property].length) {
                                    tokens[property].push([]);
                                    for (let i = 0; i < defaults.length; i++) {
                                        tokens[property][current].push(defaults[i]);
                                    }
                                }
                                else {
                                    tokens[property][current].push(arena.createToken(EnumToken.WhitespaceTokenType));
                                    for (let i = 0; i < defaults.length; i++) {
                                        tokens[property][current].push(defaults[i]);
                                    }
                                }
                            }
                        }
                        return acc;
                    }, val[current]));
                }
                if (values.length === 0) {
                    this.declarations = Object.entries(tokens).reduce((acc, curr) => {
                        acc.set(curr[0], arena.createDeclaration(EnumToken.DeclarationNodeType, curr[0], curr[1].reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push(configToken(arena, separator));
                            }
                            for (let i = 0; i < curr.length; i++) {
                                acc.push(this.take(curr[i]));
                            }
                            return acc;
                        }, []), null, null));
                        return acc;
                    }, new Map());
                }
            }
            // @ts-ignore
            const config = propertiesConfig.properties[nam];
            let property = nam;
            if (config != null) {
                property = config.shorthand;
                let value = this.declarations.get(property);
                if (!(value instanceof PropertySet)) {
                    this.declarations.set(property, 
                    // @ts-ignore
                    new PropertySet(arena, propertiesConfig.properties[config.shorthand]));
                    // Token[]
                    if (value != null) {
                        // @ts-ignore
                        this.declarations.get(property).add(value);
                    }
                }
                this.declarations.get(property).add(declaration);
            }
            else {
                this.declarations.set(nam, declaration);
            }
        }
        return this;
    }
    [Symbol.iterator]() {
        const arena = this.arena;
        const propertiesMapping = { ...this.config.properties };
        const patterns = this.config.pattern.split(" ");
        let hasMapping = false;
        let iterable;
        let requiredCount = 0;
        let property;
        let isShorthand = true;
        let declarations = this.declarations;
        for (const key of declarations.keys()) {
            if (declarations.has(key) && declarations.get(key) instanceof PropertyMap) {
                hasMapping = true;
                break;
            }
        }
        if (hasMapping) {
            const mapped = {};
            let key;
            for (const value of declarations.values()) {
                if (value instanceof PropertyMap) {
                    for (const [k, v] of value.declarations) {
                        if (k === value.config.shorthand) {
                            const values = arena.tokens(v);
                            for (const [key] of Object.entries(value.config.properties)) {
                                mapped[key] = arena.clone(v);
                                const mappedValues = [];
                                for (let i = 0; i < values.length; i++) {
                                    if (key === value.propertyNames.get(values[i])) {
                                        if (mappedValues.length > 0) {
                                            mappedValues.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                        }
                                        mappedValues.push(value.take(values[i]));
                                    }
                                }
                                if (mappedValues.length === 0) {
                                    mappedValues.push(
                                    // inlined: this.parse((value as PropertyMap).config.properties[key].default[0])
                                    ...(this.memo == null
                                        ? parseString(this.arena, value.config.properties[key].default[0])
                                        : this.memo.parse(this.arena, value.config.properties[key].default[0])));
                                }
                                arena.setTokenList(mapped[key], mappedValues);
                            }
                        }
                        else {
                            mapped[k] = v;
                        }
                    }
                }
                else {
                    // a property set has no name
                    key =
                        value instanceof PropertySet ? "undefined" : arena.strings[arena.name[value]];
                    mapped[key] = value;
                }
            }
            // console.error(mapped);
            if (patterns.length === Object.keys(mapped).length) {
                declarations = new Map();
                for (const key of patterns) {
                    if (mapped[key] != null) {
                        declarations.set(key, mapped[key]);
                    }
                }
            }
        }
        for (property of Object.keys(propertiesMapping)) {
            if (propertiesMapping[property].required) {
                if (!declarations.has(property)) {
                    isShorthand = false;
                    break;
                }
                else {
                    const val = declarations.get(property);
                    if (val instanceof PropertySet && !val.isShortHand()) {
                        isShorthand = false;
                        break;
                    }
                    else {
                        requiredCount++;
                    }
                }
            }
        }
        if (requiredCount === 0) {
            requiredCount = declarations.size;
        }
        if (!isShorthand || requiredCount < this.requiredCount) {
            if (isShorthand && declarations.has(this.config.shorthand)) {
                const cache = new Map();
                const removeDefaults = (declaration) => {
                    let i;
                    let t;
                    let map = new Map();
                    let value = [];
                    let values = [];
                    const sep = this.config.separator ?? null;
                    const typ = sep == null ? EnumToken.CommaTokenType : configType(sep);
                    const separator = sep == null ? "," : (sep.val ?? "");
                    this.matchTypes(declaration);
                    values.push(value);
                    const declarationValues = arena.tokens(declaration);
                    for (i = 0; i < declarationValues.length; i++) {
                        t = declarationValues[i];
                        if (!cache.has(t)) {
                            cache.set(t, renderValue(arena, t, { minify: true }));
                        }
                        if (arena.dataTypes[t] === typ && separator === cache.get(t)) {
                            this.removeDefaults(map, value);
                            value = [];
                            values.push(value);
                            map.clear();
                            continue;
                        }
                        value.push(t);
                        const propertyName = this.propertyNames.get(t);
                        if (propertyName != null) {
                            if (!map.has(propertyName)) {
                                map.set(propertyName, { t: [t], value: [cache.get(t)] });
                            }
                            else {
                                const v = map.get(propertyName);
                                v.t.push(t);
                                v.value.push(cache.get(t));
                            }
                        }
                    }
                    this.removeDefaults(map, value);
                    const result = values.reduce((acc, curr) => {
                        if (sep != null && acc.length > 0) {
                            acc.push(configToken(arena, sep));
                        }
                        for (const cr of curr) {
                            if (arena.dataTypes[cr] === EnumToken.WhitespaceTokenType &&
                                acc.length > 0 &&
                                arena.dataTypes[acc[acc.length - 1]] === EnumToken.WhitespaceTokenType) {
                                continue;
                            }
                            acc.push(cr);
                        }
                        return acc;
                    }, []);
                    while (result.length > 0 &&
                        arena.dataTypes[result[result.length - 1]] === EnumToken.WhitespaceTokenType) {
                        result.pop();
                    }
                    while (result.length > 0 && arena.dataTypes[result[0]] === EnumToken.WhitespaceTokenType) {
                        result.shift();
                    }
                    arena.setTokenList(declaration, result);
                    return declaration;
                };
                const values = [...declarations.values()].reduce((acc, curr) => {
                    if (curr instanceof PropertySet || curr instanceof PropertyMap) {
                        for (const declaration of curr) {
                            acc.push(declaration);
                        }
                    }
                    else {
                        acc.push(curr);
                    }
                    return acc;
                }, []);
                let isImportant = false;
                let dec;
                const filtered = [];
                for (const declaration of values) {
                    dec = removeDefaults(declaration);
                    for (const t of arena.tokens(dec)) {
                        if (arena.dataTypes[t] === EnumToken.ImportantTokenType) {
                            isImportant = true;
                        }
                        if (filtered.length === 0 &&
                            arena.dataTypes[t] !== EnumToken.WhitespaceTokenType &&
                            arena.dataTypes[t] !== EnumToken.ImportantTokenType) {
                            filtered.push(dec);
                        }
                    }
                }
                if (filtered.length === 0 && this.config.default.length > 0) {
                    filtered.push(arena.createDeclaration(EnumToken.DeclarationNodeType, this.config.shorthand, 
                    // inlined: this.parse(this.config.default[0])
                    this.memo == null
                        ? parseString(this.arena, this.config.default[0])
                        : this.memo.parse(this.arena, this.config.default[0]), null, null));
                    if (isImportant) {
                        arena.appendToken(filtered[0], arena.createToken(EnumToken.ImportantTokenType));
                    }
                }
                return (filtered.length > 0 ? filtered : values)[Symbol.iterator]();
            }
            for (const declaration of declarations.values()) {
                if (declaration instanceof PropertySet || declaration instanceof PropertyMap) {
                    continue;
                }
                const nam = arena.strings[arena.name[declaration]];
                const config = nam === this.config.shorthand ? this.config : (propertiesMapping[nam] ?? this.config);
                if (!("mapping" in config)) {
                    continue;
                }
                const declarationValues = arena.tokens(declaration);
                // @ts-ignore
                for (const [key, val] of Object.entries(config.mapping)) {
                    // inlined: this.parse(key)
                    const keys = this.memo == null ? parseString(this.arena, key) : this.memo.parse(this.arena, key);
                    if (keys.length !== declarationValues.length) {
                        continue;
                    }
                    if (keys.every((k, index) => eqToken(arena, k, declarationValues[index]))) {
                        // inlined: this.parse(val as string)
                        arena.setTokenList(declaration, this.memo == null
                            ? parseString(this.arena, val)
                            : this.memo.parse(this.arena, val));
                        break;
                    }
                }
            }
            // @ts-ignore
            iterable = declarations.values();
        }
        else {
            let count = 0;
            let match;
            const separator = this.config.separator ?? null;
            const tokens = {};
            // @ts-ignore
            Object.entries(propertiesMapping).reduce((acc, curr) => {
                if (!declarations.has(curr[0])) {
                    if (curr[1].required) {
                        acc.push(curr[0]);
                    }
                    return acc;
                }
                let current = 0;
                const props = propertiesMapping[curr[0]];
                const properties = (declarations.get(curr[0]));
                for (const declaration of properties instanceof PropertySet ||
                    properties instanceof PropertyMap
                    ? [...properties].flat()
                    : [properties]) {
                    for (const val of arena.tokens(declaration)) {
                        if (matchConfigToken(arena, val, separator)) {
                            current++;
                            if (tokens[curr[0]].length === current) {
                                tokens[curr[0]].push([]);
                            }
                            continue;
                        }
                        const valType = arena.dataTypes[val];
                        if (valType === EnumToken.WhitespaceTokenType || valType === EnumToken.CommentTokenType) {
                            continue;
                        }
                        if (props.multiple &&
                            props.separator != null &&
                            configType(props.separator) === valType &&
                            (valType === EnumToken.CommaTokenType ||
                                props.separator.val === arena.strings[arena.stringValue[val]])) {
                            continue;
                        }
                        match = matchType(arena, val, curr[1]);
                        if (isShorthand) {
                            isShorthand = match;
                        }
                        if (this.propertyNames.get(val) === property || match) {
                            if (!(curr[0] in tokens)) {
                                tokens[curr[0]] = [[]];
                            }
                            // is default value
                            tokens[curr[0]][current].push(val);
                        }
                        else {
                            acc.push(curr[0]);
                            break;
                        }
                    }
                }
                if (count === 0) {
                    count = current;
                }
                return acc;
            }, []);
            // grid-template
            if (this.config.shorthand === "grid-template" && patterns.length === Object.keys(tokens).length) {
                const k = tokens[patterns[0]][0].length;
                const l = tokens[patterns[1]][0].length;
                const j = k < l ? k : l;
                const result = [];
                let i;
                for (i = 0; i < j; i++) {
                    if (i < k) {
                        result.push(tokens[patterns[0]][0][i]);
                    }
                    if (i < l) {
                        result.push(tokens[patterns[1]][0][i]);
                    }
                }
                if (j < k) {
                    result.push(...tokens[patterns[0]][0].slice(j));
                }
                if (j < l) {
                    result.push(...tokens[patterns[1]][0].slice(j));
                }
                const separator = this.config.properties[patterns[2]]?.prefix;
                result.push(configToken(arena, separator), ...tokens[patterns[2]][0].reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                    }
                    acc.push(curr);
                    return acc;
                }, []));
                const declaration = arena.clone(declarations.get(patterns[0]));
                arena.name[declaration] = arena.internString(this.config.shorthand);
                arena.setTokenList(declaration, result.map((t) => this.take(t)));
                return [declaration][Symbol.iterator]();
            }
            count++;
            if (!isShorthand ||
                Object.entries(propertiesMapping).some((entry) => {
                    // missing required property
                    return entry[1].required && !(entry[0] in tokens);
                }) ||
                // @ts-ignore
                !Object.values(tokens).every((v) => 
                // `v` holds token groups: only single token groups were type checked by the former
                // `arena.dataTypes[group]` lookup (the group is converted to a string key)
                v.filter((t) => t.length !== 1 || arena.dataTypes[t[0]] !== EnumToken.CommentTokenType).length === count)) {
                // @ts-ignore
                iterable = declarations.values();
            }
            else if (hasMapping) {
                if (patterns.length === Object.keys(tokens).length) {
                    const declaration = arena.clone(declarations.get(patterns[0]));
                    const declarationValues = arena.tokens(declaration);
                    arena.name[declaration] = arena.internString(this.config.shorthand);
                    for (let i = 0; i < patterns.length; i++) {
                        if (declarationValues.length > 0) {
                            declarationValues.push(configToken(arena, separator));
                        }
                        declarationValues.push(...tokens[patterns[i]].reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                            }
                            acc.push(...curr.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                                }
                                acc.push(this.take(curr));
                                return acc;
                            }, []));
                            return acc;
                        }, []));
                    }
                    arena.setTokenList(declaration, declarationValues);
                    return [declaration][Symbol.iterator]();
                }
                iterable = declarations.values();
            }
            else {
                let values = Object.entries(tokens)
                    .reduce((acc, curr) => {
                    const props = propertiesMapping[curr[0]];
                    for (let i = 0; i < curr[1].length; i++) {
                        if (acc.length === i) {
                            acc.push([]);
                        }
                        // if (acc[acc.length - 1].length > 0) {
                        //     acc[acc.length - 1].push(
                        //         // @ts-ignore
                        //         this.config.separator != null  ?
                        //         {
                        //             ...this.config.separator,
                        //             typ: EnumToken[this.config.separator.typ as keyof typeof EnumToken],
                        //         } : <Token>{ typ: EnumToken.WhitespaceTokenType },
                        //     )
                        // }
                        let values = curr[1][i];
                        // .reduce(
                        //     (acc, curr) => {
                        //         // if (acc.length > 0) {
                        //         //     acc.push(<Token>{ typ: EnumToken.WhitespaceTokenType });
                        //         // }
                        //         acc.push(curr);
                        //         return acc;
                        //     },
                        //     <Token[]>[],
                        //);
                        if (props.default.includes(curr[1][i]
                            .reduce((acc, curr) => acc + renderValue(arena, curr) + " ", "")
                            .trimEnd())) {
                            if (!propertiesMapping[curr[0]].required) {
                                continue;
                            }
                        }
                        // remove default values
                        let doFilterDefault = true;
                        if (curr[0] in propertiesConfig.properties) {
                            for (let v of values) {
                                if (![
                                    EnumToken.WhitespaceTokenType,
                                    EnumToken.CommentTokenType,
                                    EnumToken.IdenTokenType,
                                ].includes(arena.dataTypes[v]) ||
                                    (arena.dataTypes[v] === EnumToken.IdenTokenType &&
                                        !propertiesMapping[curr[0]].default.includes(arena.strings[arena.stringValue[v]]))) {
                                    doFilterDefault = false;
                                    break;
                                }
                            }
                        }
                        // remove default values
                        const filtered = values.filter((val) => {
                            if (arena.dataTypes[val] === EnumToken.WhitespaceTokenType ||
                                arena.dataTypes[val] === EnumToken.CommentTokenType) {
                                return false;
                            }
                            return (!doFilterDefault ||
                                !(arena.dataTypes[val] === EnumToken.IdenTokenType &&
                                    props.default.includes(arena.strings[arena.stringValue[val]])));
                        });
                        if (filtered.length > 0 ||
                            !(this.requiredCount == requiredCount && propertiesMapping[curr[0]].required)) {
                            values = filtered;
                        }
                        if (values.length > 0) {
                            if ("mapping" in props) {
                                if (!("constraints" in props) ||
                                    // @ts-ignore
                                    !("max" in props.constraints) ||
                                    values.length <= props.constraints.mapping.max) {
                                    let i = values.length;
                                    while (i--) {
                                        if (arena.dataTypes[values[i]] === EnumToken.IdenTokenType &&
                                            // @ts-expect-error
                                            arena.strings[arena.stringValue[values[i]]] in props.mapping) {
                                            // inlined: this.parse(props.mapping[arena.strings[arena.stringValue[values[i]]]])
                                            values.splice(i, 1, ...(this.memo == null
                                                ? parseString(this.arena, 
                                                // @ts-ignore
                                                props.mapping[arena.strings[arena.stringValue[values[i]]]])
                                                : this.memo.parse(this.arena, 
                                                // @ts-ignore
                                                props.mapping[arena.strings[arena.stringValue[values[i]]]])));
                                        }
                                    }
                                }
                            }
                            if ("prefix" in props) {
                                acc[i].push(configToken(arena, props.prefix));
                            }
                            else if (acc[i].length > 0) {
                                acc[i].push(arena.createToken(EnumToken.WhitespaceTokenType));
                            }
                            for (const v of values.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push(configToken(arena, props.separator));
                                }
                                acc.push(this.take(curr));
                                return acc;
                            }, [])) {
                                acc[i].push(v);
                            }
                        }
                    }
                    return acc;
                }, [])
                    .reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push(configToken(arena, separator));
                    }
                    if (curr.length === 0 && this.config.default.length > 0) {
                        curr.push(
                        // inlined: this.parse(this.config.default[0])
                        ...(this.memo == null
                            ? parseString(this.arena, this.config.default[0])
                            : this.memo.parse(this.arena, this.config.default[0])).reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                            }
                            acc.push(curr);
                            return acc;
                        }, []));
                    }
                    for (const c of curr) {
                        acc.push(c);
                    }
                    return acc;
                }, []);
                if (this.config.mapping != null) {
                    const val = values.reduce((acc, curr) => acc +
                        renderValue(arena, curr, {
                            removeComments: true,
                            minify: true,
                        }), "");
                    if (val in this.config.mapping) {
                        values.length = 0;
                        values.push(arena.createToken(['"', "'"].includes(val.charAt(0))
                            ? EnumToken.StringTokenType
                            : EnumToken.IdenTokenType, 
                        // @ts-ignore
                        this.config.mapping[val]));
                    }
                }
                if (values.length === 1 &&
                    arena.stringValue[values[0]] !== 0 &&
                    this.config.default.includes(arena.strings[arena.stringValue[values[0]]].toLowerCase()) &&
                    this.config.default[0] !== arena.strings[arena.stringValue[values[0]]].toLowerCase()) {
                    // inlined: this.parse(this.config.default[0])
                    values =
                        this.memo == null
                            ? parseString(this.arena, this.config.default[0])
                            : this.memo.parse(this.arena, this.config.default[0]);
                }
                iterable = [
                    arena.createDeclaration(EnumToken.DeclarationNodeType, this.config.shorthand, values, null, null),
                ][Symbol.iterator]();
            }
        }
        const iterators = [];
        // @ts-ignore
        return {
            // @ts-ignore
            next() {
                let v = iterable.next();
                // @ts-ignore
                while (v.done || v.value instanceof PropertySet) {
                    if (v.value instanceof PropertySet) {
                        // @ts-ignore
                        iterators.push(iterable);
                        iterable = v.value[Symbol.iterator]();
                        v = iterable.next();
                    }
                    if (v.done) {
                        if (iterators.length > 0) {
                            // @ts-ignore
                            iterable = iterators.pop();
                            v = iterable.next();
                        }
                        if (v.done && iterators.length === 0) {
                            break;
                        }
                    }
                }
                return v;
            },
        };
    }
    /**
     * detach a token from its declaration: tokens are cloned when they are still attached to a declaration
     * @param token
     */
    take(token) {
        if (this.arena.parents[token] === 0) {
            return token;
        }
        const clone = this.arena.clone(token, true);
        const propertyName = this.propertyNames.get(token);
        if (propertyName != null) {
            this.propertyNames.set(clone, propertyName);
        }
        return clone;
    }
    matchTypes(declaration) {
        const arena = this.arena;
        const patterns = this.pattern.slice();
        const values = [];
        const declarationValues = arena.tokens(declaration);
        let i;
        let j;
        const map = new Map();
        for (i = 0; i < declarationValues.length; i++) {
            values.push(declarationValues[i]);
        }
        for (i = 0; i < patterns.length; i++) {
            for (j = 0; j < values.length; j++) {
                if (!map.has(patterns[i])) {
                    // @ts-ignore
                    map.set(patterns[i], this.config.properties?.[patterns[i]]?.constraints?.mapping?.max ?? 1);
                }
                let count = map.get(patterns[i]);
                if (count > 0 && matchType(arena, values[j], this.config.properties[patterns[i]])) {
                    this.propertyNames.set(values[j], patterns[i]);
                    map.set(patterns[i], --count);
                    values.splice(j--, 1);
                }
            }
        }
        if (this.config.set != null) {
            let modified = false;
            for (const [key, val] of Object.entries(this.config.set)) {
                if (map.has(key)) {
                    for (const v of val) {
                        // missing
                        if (map.get(v) === 1) {
                            let i = declarationValues.length;
                            while (i--) {
                                if (this.propertyNames.get(declarationValues[i]) === key) {
                                    const val = arena.clone(declarationValues[i], true);
                                    this.propertyNames.set(val, v);
                                    declarationValues.splice(i, 0, val, arena.createToken(EnumToken.WhitespaceTokenType));
                                    modified = true;
                                }
                            }
                        }
                    }
                }
            }
            if (modified) {
                arena.setTokenList(declaration, declarationValues);
            }
        }
    }
    removeDefaults(map, value) {
        for (const [key, val] of map) {
            const config = this.config.properties[key];
            if (config == null) {
                continue;
            }
            const v = val.value.join(" ");
            if (config.default.includes(v) || (value.length === 1 && this.config.default.includes(v))) {
                for (const token of value) {
                    if (val.t.includes(token)) {
                        let index = value.indexOf(token);
                        value.splice(index, 1);
                        if (config.prefix != null) {
                            while (index-- > 0) {
                                if (this.arena.dataTypes[value[index]] === EnumToken.WhitespaceTokenType) {
                                    continue;
                                }
                                if (matchConfigToken(this.arena, value[index], config.prefix)) {
                                    value.splice(index, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

export { PropertyMap };
