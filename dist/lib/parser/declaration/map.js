import { eq } from '../utils/eq.js';
import { getConfig } from '../utils/config.js';
import { matchType } from '../utils/type.js';
import { renderToken } from '../../renderer/render.js';
import { parseString } from '../parse.js';
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
        }
        else {
            const separator = this.config.separator;
            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                const tokens = {};
                const values = [];
                // @ts-ignore
                this.declarations.get(this.config.shorthand).val.slice().reduce((acc, curr) => {
                    if (separator != null && separator.typ == curr.typ && eq(separator, curr)) {
                        acc.push([]);
                        return acc;
                    }
                    // else {
                    // @ts-ignore
                    acc.at(-1).push(curr);
                    // }
                    return acc;
                }, [[]]).
                    // @ts-ignore
                    reduce((acc, list, current) => {
                    values.push(...this.pattern.reduce((acc, property) => {
                        // let current: number = 0;
                        const props = this.config.properties[property];
                        for (let i = 0; i < acc.length; i++) {
                            if (acc[i].typ == 'Comment' || acc[i].typ == 'Whitespace') {
                                acc.splice(i, 1);
                                i--;
                                continue;
                            }
                            if (matchType(acc[i], props)) {
                                if ('prefix' in props && props.previous != null && !(props.previous in tokens)) {
                                    return acc;
                                }
                                if (!(property in tokens)) {
                                    tokens[property] = [[acc[i]]];
                                }
                                else {
                                    if (current == tokens[property].length) {
                                        tokens[property].push([acc[i]]);
                                        // tokens[property][current].push();
                                    }
                                    else {
                                        tokens[property][current].push({ typ: 'Whitespace' }, acc[i]);
                                    }
                                }
                                acc.splice(i, 1);
                                i--;
                                // @ts-ignore
                                if ('prefix' in props && acc[i]?.typ == props.prefix.typ) {
                                    // @ts-ignore
                                    if (eq(acc[i], this.config.properties[property].prefix)) {
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
                                    tokens[property][current].push({ typ: 'Whitespace' }, ...defaults);
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
                            typ: 'Declaration',
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
            // @ts-ignore
            iterable = this.declarations.values();
        }
        else {
            let count = 0;
            const separator = this.config.separator;
            const tokens = {};
            // @ts-ignore
            /* const valid: string[] =*/ Object.entries(this.config.properties).reduce((acc, curr) => {
                if (!this.declarations.has(curr[0])) {
                    if (curr[1].required) {
                        acc.push(curr[0]);
                    }
                    return acc;
                }
                let current = 0;
                const props = this.config.properties[curr[0]];
                const declaration = this.declarations.get(curr[0]);
                // @ts-ignore
                for (const val of (declaration instanceof PropertySet ? [...declaration][0] : declaration).val) {
                    if (separator != null && separator.typ == val.typ && eq(separator, val)) {
                        current++;
                        if (tokens[curr[0]].length == current) {
                            tokens[curr[0]].push([]);
                        }
                        continue;
                    }
                    if (val.typ == 'Whitespace' || val.typ == 'Comment') {
                        continue;
                    }
                    if (props.multiple && props.separator != null && props.separator.typ == val.typ && eq(props.separator, val)) {
                        continue;
                    }
                    if (matchType(val, curr[1])) {
                        if (!(curr[0] in tokens)) {
                            tokens[curr[0]] = [[]];
                        }
                        // is default value
                        tokens[curr[0]][current].push(val);
                        // continue;
                    }
                    else {
                        acc.push(curr[0]);
                        break;
                    }
                }
                if (count == 0) {
                    count = current;
                }
                return acc;
            }, []);
            count++;
            if (Object.entries(this.config.properties).some(entry => {
                // missing required property
                return entry[1].required && !(entry[0] in tokens);
            }) || !Object.values(tokens).every(v => v.length == count)) {
                // @ts-ignore
                iterable = this.declarations.values();
            }
            else {
                const values = Object.entries(tokens).reduce((acc, curr) => {
                    const props = this.config.properties[curr[0]];
                    for (let i = 0; i < curr[1].length; i++) {
                        if (acc.length == i) {
                            acc.push([]);
                        }
                        let values = curr[1][i].reduce((acc, curr) => {
                            if (acc.length > 0) {
                                acc.push({ typ: 'Whitespace' });
                            }
                            acc.push(curr);
                            return acc;
                        }, []);
                        // @todo remove renderToken call
                        if (props.default.includes(curr[1][i].reduce((acc, curr) => acc + renderToken(curr) + ' ', '').trimEnd())) {
                            continue;
                        }
                        let doFilterDefault = true;
                        if (curr[0] in propertiesConfig.properties) {
                            for (let v of values) {
                                if (!['Whitespace', 'Comment', 'Iden'].includes(v.typ)
                                    || (v.typ == 'Iden' && !this.config.properties[curr[0]].default.includes(v.val))) {
                                    doFilterDefault = false;
                                    break;
                                }
                            }
                        }
                        // remove default values
                        values = values.filter((val) => {
                            if (val.typ == 'Whitespace' || val.typ == 'Comment') {
                                return false;
                            }
                            return !doFilterDefault || !(val.typ == 'Iden' && props.default.includes(val.val));
                        });
                        if (values.length > 0) {
                            if ('mapping' in props) {
                                // @ts-ignore
                                if (!('constraints' in props) || !('max' in props.constraints) || values.length <= props.constraints.mapping.max) {
                                    let i = values.length;
                                    while (i--) {
                                        // @ts-ignore
                                        if (values[i].typ == 'Iden' && values[i].val in props.mapping) {
                                            // @ts-ignore
                                            values.splice(i, 1, ...parseString(props.mapping[values[i].val]));
                                        }
                                    }
                                }
                            }
                            if ('prefix' in props) {
                                // @ts-ignore
                                acc[i].push({ ...props.prefix });
                            }
                            else if (acc[i].length > 0) {
                                acc[i].push({ typ: 'Whitespace' });
                            }
                            acc[i].push(...values.reduce((acc, curr) => {
                                if (acc.length > 0) {
                                    // @ts-ignore
                                    acc.push({ ...(props.separator ?? { typ: 'Whitespace' }) });
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
                                acc.push({ typ: 'Whitespace' });
                            }
                            acc.push(curr);
                            return acc;
                        }, []));
                    }
                    acc.push(...curr);
                    return acc;
                }, []);
                iterable = [{
                        typ: 'Declaration',
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
}

export { PropertyMap };
