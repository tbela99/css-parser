import { eq } from '../utils/eq.js';
import { getConfig } from '../utils/config.js';
import { matchType } from '../utils/type.js';
import { EnumToken } from '../../ast/types.js';
import { renderValue } from '../../printer/render.js';
import { parseString } from '../parse.js';
import { PropertySet } from './set.js';
import { PROPERTYNAME } from '../../syntax/constants.js';
import { cloneNode } from '../../ast/clone.js';

const propertiesConfig = getConfig();
class PropertyMap {
    declarations;
    config;
    requiredCount;
    pattern;
    constructor(config) {
        const values = Object.values(config.properties);
        this.requiredCount =
            values.reduce((acc, curr) => (curr.required ? ++acc : acc), 0) ||
                values.length;
        this.config = config;
        this.declarations = new Map();
        this.pattern = config.pattern.split(/\s/);
    }
    add(declaration) {
        if (declaration.nam == this.config.shorthand) {
            this.declarations.clear();
            this.declarations.set(declaration.nam, declaration);
            this.matchTypes(declaration);
        }
        else {
            const separator = this.config.separator != null
                ? {
                    ...this.config.separator,
                    // @ts-ignore
                    typ: EnumToken[this.config.separator.typ],
                }
                : null;
            // expand shorthand
            if (this.declarations.has(this.config.shorthand)) {
                const tokens = {};
                const values = [];
                const val = [[]];
                for (const curr of // @ts-ignore
                 this.declarations.get(this.config.shorthand).val) {
                    // @ts-ignore
                    if (separator != null && separator.typ == curr.typ && separator.val == curr.val) {
                        val.push([]);
                        continue;
                    }
                    // @ts-ignore
                    val.at(-1).push(curr);
                }
                for (let current = 0; current < val.length; current++) {
                    values.push(...this.pattern.reduce((acc, property) => {
                        // let current: number = 0;
                        const props = this.config.properties[property];
                        for (let i = 0; i < acc.length; i++) {
                            if (acc[i].typ == EnumToken.CommentTokenType ||
                                acc[i].typ == EnumToken.WhitespaceTokenType) {
                                acc.splice(i, 1);
                                i--;
                                continue;
                            }
                            if (
                            // @ts-ignore
                            acc[i][PROPERTYNAME] == property ||
                                matchType(acc[i], props)) {
                                if ("prefix" in props && props.previous != null && !(props.previous in tokens)) {
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
                                if ("prefix" in props && acc[i]?.typ == EnumToken[props.prefix.typ]) {
                                    if (
                                    // @ts-ignore
                                    acc[i].typ == EnumToken[props.prefix.typ] &&
                                        // @ts-ignore
                                        acc[i].val == this.config.properties[property].prefix.val) {
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
                                tokens[property] = [[...defaults]];
                            }
                            else {
                                if (current == tokens[property].length) {
                                    tokens[property].push([]);
                                    for (let i = 0; i < defaults.length; i++) {
                                        tokens[property][current].push(defaults[i]);
                                    }
                                }
                                else {
                                    tokens[property][current].push({
                                        typ: EnumToken.WhitespaceTokenType,
                                    });
                                    for (let i = 0; i < defaults.length; i++) {
                                        tokens[property][current].push(defaults[i]);
                                    }
                                }
                            }
                        }
                        return acc;
                    }, val[current]));
                }
                if (values.length == 0) {
                    this.declarations = Object.entries(tokens).reduce((acc, curr) => {
                        acc.set(curr[0], {
                            typ: EnumToken.DeclarationNodeType,
                            nam: curr[0],
                            val: curr[1].reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push({ ...separator });
                                }
                                for (let i = 0; i < curr.length; i++) {
                                    acc.push(curr[i]);
                                }
                                return acc;
                            }, []),
                        });
                        return acc;
                    }, new Map());
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
    [Symbol.iterator]() {
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
                key = value.nam;
                if (value instanceof PropertyMap) {
                    for (const [k, v] of value.declarations) {
                        mapped[k] = v;
                    }
                }
                else {
                    mapped[key] = value;
                }
            }
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
                    // @ts-ignore
                    let typ = (EnumToken[this.config.separator?.typ] ?? EnumToken.CommaTokenType);
                    // @ts-ignore
                    const sep = this.config.separator == null
                        ? null
                        : {
                            ...this.config.separator,
                            typ: EnumToken[this.config.separator.typ],
                        };
                    // @ts-ignore
                    const separator = this.config.separator
                        ? renderValue({
                            ...this.config.separator,
                            typ: EnumToken[this.config.separator.typ],
                        })
                        : ",";
                    this.matchTypes(declaration);
                    values.push(value);
                    for (i = 0; i < declaration.val.length; i++) {
                        t = declaration.val[i];
                        if (!cache.has(t)) {
                            cache.set(t, renderValue(t, { minify: true }));
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
                        if (t[PROPERTYNAME] != null) {
                            // @ts-ignore
                            if (!map.has(t[PROPERTYNAME])) {
                                // @ts-ignore
                                map.set(t[PROPERTYNAME], { t: [t], value: [cache.get(t)] });
                            }
                            else {
                                // @ts-ignore
                                const v = map.get(t[PROPERTYNAME]);
                                v.t.push(t);
                                v.value.push(cache.get(t));
                            }
                        }
                    }
                    this.removeDefaults(map, value);
                    declaration.val = values.reduce((acc, curr) => {
                        if (sep != null && acc.length > 0) {
                            acc.push({ ...sep });
                        }
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
                    for (const t of dec.val) {
                        if (t.typ == EnumToken.ImportantTokenType) {
                            isImportant = true;
                        }
                        if (filtered.length == 0 &&
                            t.typ != EnumToken.WhitespaceTokenType &&
                            t.typ != EnumToken.ImportantTokenType) {
                            filtered.push(dec);
                        }
                    }
                }
                if (filtered.length == 0 && this.config.default.length > 0) {
                    filtered.push({
                        typ: EnumToken.DeclarationNodeType,
                        nam: this.config.shorthand,
                        val: parseString(this.config.default[0]),
                    });
                    if (isImportant) {
                        filtered[0].val.push({
                            typ: EnumToken.ImportantTokenType,
                        });
                    }
                }
                return (filtered.length > 0 ? filtered : values)[Symbol.iterator]();
            }
            for (const declaration of declarations.values()) {
                if (declaration instanceof PropertySet || declaration instanceof PropertyMap) {
                    continue;
                }
                const config = declaration.nam == this.config.shorthand
                    ? this.config
                    : (propertiesMapping[declaration.nam] ?? this.config);
                if (!("mapping" in config)) {
                    continue;
                }
                // @ts-ignore
                for (const [key, val] of Object.entries(config.mapping)) {
                    const keys = parseString(key);
                    if (keys.length != declaration.val.length) {
                        continue;
                    }
                    if (eq(declaration.val, keys)) {
                        declaration.val = parseString(val);
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
            const separator = this.config.separator != null
                ? {
                    ...this.config.separator,
                    // @ts-ignore
                    typ: EnumToken[this.config.separator.typ],
                }
                : null;
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
                for (const declaration of properties instanceof PropertySet || properties instanceof PropertyMap
                    ? [...properties].flat()
                    : [properties]) {
                    // @ts-ignore
                    for (const val of declaration.val) {
                        // @ts-ignore
                        if (separator != null && separator.typ == val.typ && separator.val == val.val) {
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
                        if (props.multiple &&
                            props.separator != null &&
                            // @ts-ignore
                            EnumToken[props.separator.typ] === val.typ &&
                            // @ts-ignore
                            (val.typ === EnumToken.CommaTokenType || props.separator.val == val.val)) {
                            continue;
                        }
                        // @ts-ignore
                        match = val.typ == EnumToken.CommentTokenType || matchType(val, curr[1]);
                        if (isShorthand) {
                            isShorthand = match;
                        }
                        // @ts-ignore
                        if (val[PROPERTYNAME] == property || match) {
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
            if (this.config.shorthand == "grid-template" && patterns.length == Object.keys(tokens).length) {
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
                result.push(
                // @ts-ignore
                { ...separator, typ: EnumToken[separator.typ] }, ...tokens[patterns[2]][0].reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push({ typ: EnumToken.WhitespaceTokenType });
                    }
                    acc.push(curr);
                    return acc;
                }, []));
                const declaration = cloneNode(declarations.get(patterns[0]));
                declaration.nam = this.config.shorthand;
                declaration.val = result;
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
                // @ts-expect-error
                v.filter((t) => t.typ != EnumToken.CommentTokenType).length === count)) {
                // @ts-ignore
                iterable = declarations.values();
            }
            else if (hasMapping) {
                if (patterns.length == Object.keys(tokens).length) {
                    const declaration = cloneNode(declarations.get(patterns[0]));
                    declaration.nam = this.config.shorthand;
                    for (let i = 0; i < patterns.length; i++) {
                        if (declaration.val.length > 0) {
                            declaration.val.push(
                            // @ts-ignore
                            this.config.separator != null
                                ? {
                                    ...this.config.separator,
                                    typ: EnumToken[this.config.separator.typ],
                                }
                                : { typ: EnumToken.WhitespaceTokenType });
                        }
                        declaration.val.push(...tokens[patterns[i]].reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            acc.push(...curr.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    acc.push({ typ: EnumToken.WhitespaceTokenType });
                                }
                                acc.push(curr);
                                return acc;
                            }, []));
                            return acc;
                        }, []));
                    }
                    return [declaration][Symbol.iterator]();
                }
                iterable = declarations.values();
            }
            else {
                let values = Object.entries(tokens)
                    .reduce((acc, curr) => {
                    const props = propertiesMapping[curr[0]];
                    for (let i = 0; i < curr[1].length; i++) {
                        if (acc.length == i) {
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
                        // );
                        if (props.default.includes(curr[1][i]
                            .reduce((acc, curr) => acc + renderValue(curr) + " ", "")
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
                                ].includes(v.typ) ||
                                    (v.typ == EnumToken.IdenTokenType &&
                                        !propertiesMapping[curr[0]].default.includes(v.val))) {
                                    doFilterDefault = false;
                                    break;
                                }
                            }
                        }
                        // remove default values
                        const filtered = values.filter((val) => {
                            if (val.typ == EnumToken.WhitespaceTokenType ||
                                val.typ == EnumToken.CommentTokenType) {
                                return false;
                            }
                            return (!doFilterDefault ||
                                !(val.typ == EnumToken.IdenTokenType &&
                                    props.default.includes(val.val)));
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
                                        if (values[i].typ == EnumToken.IdenTokenType &&
                                            // @ts-expect-error
                                            values[i].val in props.mapping) {
                                            // @ts-ignore
                                            values.splice(i, 1, ...parseString(props.mapping[values[i].val]));
                                        }
                                    }
                                }
                            }
                            if ("prefix" in props) {
                                // @ts-ignore
                                acc[i].push({ ...props.prefix, typ: EnumToken[props.prefix.typ] });
                            }
                            else if (acc[i].length > 0) {
                                // @ts-ignore
                                acc[i].push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            for (const v of values.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    // @ts-ignore
                                    acc.push({
                                        ...((props.separator && {
                                            ...props.separator,
                                            // @ts-ignore
                                            typ: EnumToken[props.separator.typ],
                                        }) ?? { typ: EnumToken.WhitespaceTokenType }),
                                    });
                                }
                                // @ts-ignore
                                acc.push(curr);
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
                    for (const c of curr) {
                        acc.push(c);
                    }
                    return acc;
                }, []);
                if (this.config.mapping != null) {
                    const val = values.reduce((acc, curr) => acc +
                        renderValue(curr, {
                            removeComments: true,
                            minify: true,
                        }), "");
                    if (val in this.config.mapping) {
                        values.length = 0;
                        values.push({
                            typ: ['"', "'"].includes(val.charAt(0))
                                ? EnumToken.StringTokenType
                                : EnumToken.IdenTokenType,
                            // @ts-ignore
                            val: this.config.mapping[val],
                        });
                    }
                }
                // @ts-ignore
                if (values.length == 1 &&
                    // @ts-ignore
                    typeof values[0].val == "string" &&
                    this.config.default.includes(values[0].val.toLowerCase()) &&
                    this.config.default[0] != values[0].val.toLowerCase()) {
                    // @ts-ignore/
                    values = parseString(this.config.default[0]);
                }
                iterable = [
                    {
                        typ: EnumToken.DeclarationNodeType,
                        nam: this.config.shorthand,
                        val: values,
                    },
                ][Symbol.iterator]();
            }
        }
        const iterators = [];
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
                        if (v.done && iterators.length == 0) {
                            break;
                        }
                    }
                }
                return v;
            },
        };
    }
    matchTypes(declaration) {
        const patterns = this.pattern.slice();
        const values = [];
        let i;
        let j;
        const map = new Map();
        for (i = 0; i < declaration.val.length; i++) {
            values.push(declaration.val[i]);
        }
        for (i = 0; i < patterns.length; i++) {
            for (j = 0; j < values.length; j++) {
                if (!map.has(patterns[i])) {
                    // @ts-ignore
                    map.set(patterns[i], this.config.properties?.[patterns[i]]?.constraints?.mapping?.max ?? 1);
                }
                let count = map.get(patterns[i]);
                if (count > 0 && matchType(values[j], this.config.properties[patterns[i]])) {
                    // @ts-expect-error
                    values[j][PROPERTYNAME] = patterns[i];
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
                                // @ts-expect-error
                                if (declaration.val[i][PROPERTYNAME] == key) {
                                    const val = { ...declaration.val[i] };
                                    // @ts-expect-error
                                    val[PROPERTYNAME] = v;
                                    declaration.val.splice(i, 0, val, { typ: EnumToken.WhitespaceTokenType });
                                }
                            }
                        }
                    }
                }
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
                                if (
                                // @ts-expect-error
                                value[index].typ == EnumToken[config.prefix.typ] &&
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
