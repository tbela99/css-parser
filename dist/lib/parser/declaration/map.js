import { eq } from '../utils/eq.js';
import { renderToken } from '../../renderer/render.js';
import '../../renderer/color/color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { parseString } from '../parse.js';
import { getConfig } from '../utils/config.js';
import { matchType } from '../utils/type.js';
import { PropertySet } from './set.js';

const propertiesConfig = getConfig();
class PropertyMap {
    config;
    declarations;
    requiredCount;
    pattern;
    constructor(config) {
        const values = Object.values(config.properties);
        this.requiredCount = values.reduce((acc, curr) => curr.required ? ++acc : acc, 0) || values.length;
        this.config = config;
        this.declarations = new Map;
        this.pattern = config.pattern.split(/\s/);
    }
    add(declaration) {
        if (declaration.nam == this.config.shorthand) {
            this.declarations = new Map;
            this.declarations.set(declaration.nam, declaration);
            this.matchTypes(declaration);
        }
        else {
            const separator = this.config.separator != null ? {
                ...this.config.separator,
                typ: EnumToken[this.config.separator.typ]
            } : null;
            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                const tokens = {};
                const values = [];
                // @ts-ignore
                this.declarations.get(this.config.shorthand).val.slice().reduce((acc, curr) => {
                    // @ts-ignore
                    if (separator != null && separator.typ == curr.typ && eq(separator, curr)) {
                        acc.push([]);
                        return acc;
                    }
                    // @ts-ignore
                    acc.at(-1).push(curr);
                    return acc;
                }, [[]]).
                    // @ts-ignore
                    reduce((acc, list, current) => {
                    values.push(...this.pattern.reduce((acc, property) => {
                        // let current: number = 0;
                        const props = this.config.properties[property];
                        for (let i = 0; i < acc.length; i++) {
                            if (acc[i].typ == EnumToken.CommentTokenType || acc[i].typ == EnumToken.WhitespaceTokenType) {
                                acc.splice(i, 1);
                                i--;
                                continue;
                            }
                            // @ts-ignore
                            if (('propertyName' in acc[i] && acc[i].propertyName == property) || matchType(acc[i], props)) {
                                if ('prefix' in props && props.previous != null && !(props.previous in tokens)) {
                                    return acc;
                                }
                                if (!(property in tokens)) {
                                    tokens[property] = [[acc[i]]];
                                }
                                else {
                                    if (current == tokens[property].length) {
                                        tokens[property].push([acc[i]]);
                                    }
                                    else {
                                        tokens[property][current].push({ typ: EnumToken.WhitespaceTokenType }, acc[i]);
                                    }
                                }
                                acc.splice(i, 1);
                                i--;
                                // @ts-ignore
                                if ('prefix' in props && acc[i]?.typ == EnumToken[props.prefix.typ]) {
                                    if (eq(acc[i], {
                                        ...this.config.properties[property].prefix,
                                        // @ts-ignore
                                        typ: EnumToken[props.prefix.typ]
                                    })) {
                                        acc.splice(i, 1);
                                        i--;
                                    }
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
                            const defaults = parseString(props.default[0]);
                            if (!(property in tokens)) {
                                tokens[property] = [
                                    [...defaults]
                                ];
                            }
                            else {
                                if (current == tokens[property].length) {
                                    tokens[property].push([]);
                                    tokens[property][current].push(...defaults);
                                }
                                else {
                                    tokens[property][current].push({ typ: EnumToken.WhitespaceTokenType }, ...defaults);
                                }
                            }
                        }
                        return acc;
                    }, list));
                    return values;
                }, []);
                if (values.length == 0) {
                    this.declarations = Object.entries(tokens).reduce((acc, curr) => {
                        acc.set(curr[0], {
                            typ: EnumToken.DeclarationNodeType,
                            nam: curr[0],
                            val: curr[1].reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push({ ...separator });
                                }
                                acc.push(...curr);
                                return acc;
                            }, [])
                        });
                        return acc;
                    }, new Map);
                }
            }
            // @ts-ignore
            const config = propertiesConfig.properties[declaration.nam];
            let property = declaration.nam;
            if (config != null) {
                property = config.shorthand;
                let value = this.declarations.get(property);
                if (!(value instanceof PropertySet)) {
                    // @ts-ignore
                    this.declarations.set(property, new PropertySet(propertiesConfig.properties[config.shorthand]));
                    // Token[]
                    if (value != null) {
                        // @ts-ignore
                        this.declarations.get(property).add(value);
                    }
                }
                this.declarations.get(property).add(declaration);
            }
            else {
                this.declarations.set(declaration.nam, declaration);
            }
        }
        return this;
    }
    matchTypes(declaration) {
        const patterns = this.pattern.slice();
        const values = [...declaration.val];
        let i;
        let j;
        const map = new Map;
        for (i = 0; i < patterns.length; i++) {
            for (j = 0; j < values.length; j++) {
                if (!map.has(patterns[i])) {
                    // @ts-ignore
                    map.set(patterns[i], this.config.properties?.[patterns[i]]?.constraints?.mapping?.max ?? 1);
                }
                let count = map.get(patterns[i]);
                if (count > 0 && matchType(values[j], this.config.properties[patterns[i]])) {
                    Object.defineProperty(values[j], 'propertyName', {
                        enumerable: false,
                        writable: true,
                        value: patterns[i]
                    });
                    map.set(patterns[i], --count);
                    values.splice(j--, 1);
                }
            }
        }
        if (this.config.set != null) {
            for (const [key, val] of Object.entries(this.config.set)) {
                if (map.has(key)) {
                    for (const v of val) {
                        // missing
                        if (map.get(v) == 1) {
                            let i = declaration.val.length;
                            while (i--) {
                                // @ts-ignore
                                if (declaration.val[i].propertyName == key) {
                                    const val = { ...declaration.val[i] };
                                    Object.defineProperty(val, 'propertyName', {
                                        enumerable: false,
                                        writable: true,
                                        value: v
                                    });
                                    declaration.val.splice(i, 0, val, { typ: EnumToken.WhitespaceTokenType });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    [Symbol.iterator]() {
        let iterable;
        let requiredCount = 0;
        let property;
        let isShorthand = true;
        for (property of Object.keys(this.config.properties)) {
            if (this.config.properties[property].required) {
                if (!this.declarations.has(property)) {
                    isShorthand = false;
                    break;
                }
                else {
                    const val = this.declarations.get(property);
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
        if (requiredCount == 0) {
            requiredCount = this.declarations.size;
        }
        if (!isShorthand || requiredCount < this.requiredCount) {
            if (isShorthand && this.declarations.has(this.config.shorthand)) {
                const cache = new Map();
                const removeDefaults = (declaration) => {
                    let i;
                    let t;
                    let map = new Map();
                    let value = [];
                    let values = [];
                    // @ts-ignore
                    let typ = (EnumToken[this.config.separator?.typ] ?? EnumToken.CommaTokenType);
                    let separator = this.config.separator ? renderToken(this.config.separator) : ',';
                    this.matchTypes(declaration);
                    values.push(value);
                    for (i = 0; i < declaration.val.length; i++) {
                        t = declaration.val[i];
                        if (!cache.has(t)) {
                            cache.set(t, renderToken(t, { minify: true }));
                        }
                        if (t.typ == typ && separator == cache.get(t)) {
                            this.removeDefaults(map, value);
                            value = [];
                            values.push(value);
                            map.clear();
                            continue;
                        }
                        value.push(t);
                        // @ts-ignore
                        if ('propertyName' in t) {
                            // @ts-ignore
                            if (!map.has(t.propertyName)) {
                                // @ts-ignore
                                map.set(t.propertyName, { t: [t], value: [cache.get(t)] });
                            }
                            else {
                                // @ts-ignore
                                const v = map.get(t.propertyName);
                                v.t.push(t);
                                v.value.push(cache.get(t));
                            }
                        }
                    }
                    this.removeDefaults(map, value);
                    declaration.val = values.reduce((acc, curr) => {
                        for (const cr of curr) {
                            if (cr.typ == EnumToken.WhitespaceTokenType && acc.at(-1)?.typ == cr.typ) {
                                continue;
                            }
                            acc.push(cr);
                        }
                        return acc;
                    }, []);
                    while (declaration.val.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                        declaration.val.pop();
                    }
                    while (declaration.val.at(0)?.typ == EnumToken.WhitespaceTokenType) {
                        declaration.val.shift();
                    }
                    return declaration;
                };
                const values = [...this.declarations.values()].reduce((acc, curr) => {
                    if (curr instanceof PropertySet) {
                        acc.push(...curr);
                    }
                    else {
                        acc.push(curr);
                    }
                    return acc;
                }, []);
                let isImportant = false;
                const filtered = values.map(removeDefaults).filter((x) => x.val.filter((t) => {
                    if (t.typ == EnumToken.ImportantTokenType) {
                        isImportant = true;
                    }
                    return ![EnumToken.WhitespaceTokenType, EnumToken.ImportantTokenType].includes(t.typ);
                }).length > 0);
                if (filtered.length == 0 && this.config.default.length > 0) {
                    filtered.push({
                        typ: EnumToken.DeclarationNodeType,
                        nam: this.config.shorthand,
                        val: parseString(this.config.default[0])
                    });
                    if (isImportant) {
                        filtered[0].val.push({
                            typ: EnumToken.ImportantTokenType
                        });
                    }
                }
                return (filtered.length > 0 ? filtered : values)[Symbol.iterator]();
            }
            // @ts-ignore
            iterable = this.declarations.values();
        }
        else {
            let count = 0;
            let match;
            const separator = this.config.separator != null ? {
                ...this.config.separator,
                typ: EnumToken[this.config.separator.typ]
            } : null;
            const tokens = {};
            // @ts-ignore
            Object.entries(this.config.properties).reduce((acc, curr) => {
                if (!this.declarations.has(curr[0])) {
                    if (curr[1].required) {
                        acc.push(curr[0]);
                    }
                    return acc;
                }
                let current = 0;
                const props = this.config.properties[curr[0]];
                const properties = this.declarations.get(curr[0]);
                for (const declaration of [(properties instanceof PropertySet ? [...properties][0] : properties)]) {
                    // @ts-ignore
                    for (const val of declaration.val) {
                        if (separator != null && separator.typ == val.typ && eq(separator, val)) {
                            current++;
                            if (tokens[curr[0]].length == current) {
                                tokens[curr[0]].push([]);
                            }
                            continue;
                        }
                        if (val.typ == EnumToken.WhitespaceTokenType || val.typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        // @ts-ignore
                        if (props.multiple && props.separator != null && EnumToken[props.separator.typ] == val.typ && eq({
                            ...props.separator,
                            typ: EnumToken[props.separator.typ]
                        }, val)) {
                            continue;
                        }
                        // @ts-ignore
                        match = val.typ == EnumToken.CommentTokenType || matchType(val, curr[1]);
                        if (isShorthand) {
                            isShorthand = match;
                        }
                        // @ts-ignore
                        if (('propertyName' in val && val.propertyName == property) || match) {
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
                if (count == 0) {
                    count = current;
                }
                return acc;
            }, []);
            count++;
            if (!isShorthand || Object.entries(this.config.properties).some((entry) => {
                // missing required property
                return entry[1].required && !(entry[0] in tokens);
            }) ||
                // @ts-ignore
                !Object.values(tokens).every((v) => v.filter((t) => t.typ != EnumToken.CommentTokenType).length == count)) {
                // @ts-ignore
                iterable = this.declarations.values();
            }
            else {
                let values = Object.entries(tokens).reduce((acc, curr) => {
                    const props = this.config.properties[curr[0]];
                    for (let i = 0; i < curr[1].length; i++) {
                        if (acc.length == i) {
                            acc.push([]);
                        }
                        let values = curr[1][i].reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            acc.push(curr);
                            return acc;
                        }, []);
                        // @todo remove renderToken call
                        if (props.default.includes(curr[1][i].reduce((acc, curr) => acc + renderToken(curr) + ' ', '').trimEnd())) {
                            if (!this.config.properties[curr[0]].required) {
                                continue;
                            }
                        }
                        // remove default values
                        let doFilterDefault = true;
                        if (curr[0] in propertiesConfig.properties) {
                            for (let v of values) {
                                if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.IdenTokenType].includes(v.typ)
                                    || (v.typ == EnumToken.IdenTokenType && !this.config.properties[curr[0]].default.includes(v.val))) {
                                    doFilterDefault = false;
                                    break;
                                }
                            }
                        }
                        // remove default values
                        const filtered = values.filter((val) => {
                            if (val.typ == EnumToken.WhitespaceTokenType || val.typ == EnumToken.CommentTokenType) {
                                return false;
                            }
                            return !doFilterDefault || !(val.typ == EnumToken.IdenTokenType && props.default.includes(val.val));
                        });
                        if (filtered.length > 0 || !(this.requiredCount == requiredCount && this.config.properties[curr[0]].required)) {
                            values = filtered;
                        }
                        if (values.length > 0) {
                            if ('mapping' in props) {
                                // @ts-ignore
                                if (!('constraints' in props) || !('max' in props.constraints) || values.length <= props.constraints.mapping.max) {
                                    let i = values.length;
                                    while (i--) {
                                        // @ts-ignore
                                        if (values[i].typ == EnumToken.IdenTokenType && values[i].val in props.mapping) {
                                            // @ts-ignore
                                            values.splice(i, 1, ...parseString(props.mapping[values[i].val]));
                                        }
                                    }
                                }
                            }
                            if ('prefix' in props) {
                                // @ts-ignore
                                acc[i].push({ ...props.prefix, typ: EnumToken[props.prefix.typ] });
                            }
                            else if (acc[i].length > 0) {
                                acc[i].push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            acc[i].push(...values.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    // @ts-ignore
                                    acc.push({
                                        ...((props.separator && {
                                            ...props.separator,
                                            typ: EnumToken[props.separator.typ]
                                        }) ?? { typ: EnumToken.WhitespaceTokenType })
                                    });
                                }
                                // @ts-ignore
                                acc.push(curr);
                                return acc;
                            }, []));
                        }
                    }
                    return acc;
                }, []).reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push({ ...separator });
                    }
                    if (curr.length == 0 && this.config.default.length > 0) {
                        curr.push(...parseString(this.config.default[0]).reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            acc.push(curr);
                            return acc;
                        }, []));
                    }
                    acc.push(...curr);
                    return acc;
                }, []);
                if (this.config.mapping != null) {
                    const val = values.reduce((acc, curr) => acc + renderToken(curr, {
                        removeComments: true,
                        minify: true
                    }), '');
                    if (val in this.config.mapping) {
                        values.length = 0;
                        values.push({
                            typ: ['"', "'"].includes(val.charAt(0)) ? EnumToken.StringTokenType : EnumToken.IdenTokenType,
                            // @ts-ignore
                            val: this.config.mapping[val]
                        });
                    }
                }
                // @ts-ignore
                if (values.length == 1 &&
                    typeof values[0].val == 'string' &&
                    this.config.default.includes(values[0].val.toLowerCase()) &&
                    this.config.default[0] != values[0].val.toLowerCase()) {
                    // @ts-ignore/
                    values = parseString(this.config.default[0]);
                }
                iterable = [{
                        typ: EnumToken.DeclarationNodeType,
                        nam: this.config.shorthand,
                        val: values
                    }][Symbol.iterator]();
            }
        }
        const iterators = [];
        return {
            // @ts-ignore
            next() {
                let v = iterable.next();
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
                        if (v.done && iterators.length == 0) {
                            break;
                        }
                    }
                }
                return v;
            }
        };
    }
    removeDefaults(map, value) {
        for (const [key, val] of map) {
            const config = this.config.properties[key];
            if (config == null) {
                continue;
            }
            const v = val.value.join(' ');
            if (config.default.includes(v) || (value.length == 1 && this.config.default.includes(v))) {
                for (const token of value) {
                    if (val.t.includes(token)) {
                        let index = value.indexOf(token);
                        value.splice(index, 1);
                        if (config.prefix != null) {
                            while (index-- > 0) {
                                if (value[index].typ == EnumToken.WhitespaceTokenType) {
                                    continue;
                                }
                                if (value[index].typ == EnumToken[config.prefix.typ] &&
                                    // @ts-ignore
                                    value[index].val == config.prefix.val) {
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
