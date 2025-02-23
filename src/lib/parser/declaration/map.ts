import type {
    AstDeclaration,
    IdentToken,
    PropertiesConfig,
    PropertyMapType,
    ShorthandMapType,
    ShorthandPropertyType,
    StringToken,
    Token,
    WhitespaceToken
} from "../../../@types";
import {eq} from "../utils/eq";
import {getConfig, matchType} from "../utils";
import {renderToken} from "../../renderer";
import {parseString} from "../parse";
import {PropertySet} from "./set";
import {EnumToken} from "../../ast";

const propertiesConfig: PropertiesConfig = getConfig();

interface TokenMap {
    t: Token[];
    value: string[]
}

export class PropertyMap {

    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration | PropertySet>;
    protected requiredCount: any;
    protected pattern: string[];

    constructor(config: ShorthandMapType) {

        const values: PropertyMapType[] = Object.values(config.properties);
        this.requiredCount = values.reduce((acc: number, curr: PropertyMapType): number => curr.required ? ++acc : acc, 0) || values.length;
        this.config = config;
        this.declarations = new Map<string, AstDeclaration>;
        this.pattern = config.pattern.split(/\s/);
    }

    add(declaration: AstDeclaration) {

        if (declaration.nam == this.config.shorthand) {

            this.declarations = new Map<string, AstDeclaration>;
            this.declarations.set(<string>declaration.nam, declaration);

            this.matchTypes(declaration);

        } else {

            const separator: Token | null = this.config.separator != null ? <Token>{
                ...this.config.separator,
                // @ts-ignore
                typ: EnumToken[this.config.separator.typ]
            } : null;

            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {

                const tokens: { [key: string]: Token[][] } = {};
                const values: Token[] = [];

                // @ts-ignore
                this.declarations.get(this.config.shorthand).val.slice().reduce((acc: Token[][], curr: Token) => {

                    // @ts-ignore
                    if (separator != null && separator.typ == curr.typ && separator.val == curr.val) {

                        acc.push([]);
                        return acc;
                    }

                    // @ts-ignore
                    acc.at(-1).push(curr);
                    return acc;
                }, [[]]).
                    // @ts-ignore
                    reduce((acc: Token[][], list: Token[], current: number) => {

                        values.push(...this.pattern.reduce((acc: Token[], property: string): Token[] => {

                            // let current: number = 0;
                            const props: PropertyMapType = this.config.properties[property];

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

                                    } else {

                                        if (current == tokens[property].length) {

                                            tokens[property].push([acc[i]]);
                                        } else {

                                            tokens[property][current].push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType}, acc[i]);
                                        }
                                    }

                                    acc.splice(i, 1);
                                    i--;

                                    // @ts-ignore
                                    if ('prefix' in props && acc[i]?.typ == EnumToken[props.prefix.typ]) {

                                        // @ts-ignore
                                        if (acc[i].typ == EnumToken[props.prefix.typ] && acc[i].val == this.config.properties[property].prefix.val) {

                                            acc.splice(i, 1);
                                            i--;
                                        }
                                    }

                                    if ((<PropertyMapType>props).multiple) {

                                        continue;
                                    }

                                    return acc;
                                } else {

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

                                const defaults: Token[] = parseString(props.default[0]);

                                if (!(property in tokens)) {

                                    tokens[property] = [
                                        [...defaults]
                                    ];

                                } else {

                                    if (current == tokens[property].length) {

                                        tokens[property].push([]);
                                        tokens[property][current].push(...defaults);
                                    } else {

                                        tokens[property][current].push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType}, ...defaults);
                                    }
                                }
                            }

                            return acc;

                        }, list));

                        return values;
                    }, []);

                if (values.length == 0) {

                    this.declarations = Object.entries(tokens).reduce((acc: Map<string, AstDeclaration>, curr: [string, Token[][]]) => {

                        acc.set(curr[0], <AstDeclaration>{

                            typ: EnumToken.DeclarationNodeType,
                            nam: curr[0],
                            val: curr[1].reduce((acc, curr) => {

                                if (acc.length > 0) {

                                    acc.push(<Token>{...separator});
                                }

                                acc.push(...curr);
                                return acc;
                            }, [])
                        });

                        return acc;
                    }, new Map<string, AstDeclaration>);
                }
            }

            // @ts-ignore
            const config: ShorthandPropertyType = <ShorthandPropertyType>propertiesConfig.properties[declaration.nam];

            let property: string = declaration.nam;

            if (config != null) {

                property = config.shorthand;

                let value: AstDeclaration | PropertySet = <AstDeclaration | PropertySet>this.declarations.get(property);

                if (!(value instanceof PropertySet)) {

                    // @ts-ignore
                    this.declarations.set(property, new PropertySet(propertiesConfig.properties[config.shorthand]));

                    // Token[]
                    if (value != null) {

                        // @ts-ignore
                        (<PropertySet>this.declarations.get(property)).add(value);
                    }
                }

                (<PropertySet>this.declarations.get(property)).add(declaration);
            } else {

                this.declarations.set(<string>declaration.nam, declaration);
            }
        }

        return this;
    }

    [Symbol.iterator]() {

        let iterable: IterableIterator<AstDeclaration | PropertySet>;
        let requiredCount: number = 0;
        let property: string;
        let isShorthand: boolean = true;

        for (property of Object.keys(this.config.properties)) {

            if (this.config.properties[property].required) {

                if (!this.declarations.has(property)) {

                    isShorthand = false;
                    break;
                } else {

                    const val: AstDeclaration | PropertySet = <AstDeclaration | PropertySet>this.declarations.get(property);

                    if (val instanceof PropertySet && !val.isShortHand()) {

                        isShorthand = false;
                        break;
                    } else {

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

                const cache: Map<Token, string> = new Map();

                const removeDefaults = (declaration: AstDeclaration): AstDeclaration => {

                    let i: number;
                    let t: Token;
                    let map: Map<string, TokenMap> = new Map();

                    let value: Token[] = [];
                    let values: Token[][] = [];

                    // @ts-ignore
                    let typ: EnumToken = <EnumToken>(EnumToken[this.config.separator?.typ] ?? EnumToken.CommaTokenType);

                    // @ts-ignore
                    const sep: Token | null = this.config.separator == null ? null : {
                        ...this.config.separator,
                        typ: EnumToken[this.config.separator.typ as keyof typeof EnumToken]
                    } as Token;
                    // @ts-ignore
                    const separator: string = this.config.separator ? renderToken({
                        ...this.config.separator,
                        typ: EnumToken[this.config.separator.typ as keyof typeof EnumToken] as EnumToken
                    } as Token) : ',';

                    this.matchTypes(declaration);

                    values.push(value);

                    for (i = 0; i < declaration.val.length; i++) {

                        t = declaration.val[i];

                        if (!cache.has(t)) {

                            cache.set(t, renderToken(t, {minify: true}));
                        }

                        if (t.typ == typ && separator == <string>cache.get(t)) {

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
                                map.set(t.propertyName, {t: [t], value: [<string>cache.get(t)]});
                            } else {

                                // @ts-ignore
                                const v: TokenMap = <TokenMap>map.get(t.propertyName);

                                v.t.push(t);
                                v.value.push(<string>cache.get(t));
                            }
                        }
                    }

                    this.removeDefaults(map, value);

                    declaration.val = values.reduce((acc: Token[], curr: Token[]) => {

                        if (sep != null && acc.length > 0) {

                            acc.push({...sep});
                        }

                        for (const cr of curr) {

                            if (cr.typ == EnumToken.WhitespaceTokenType && acc.at(-1)?.typ == cr.typ) {

                                continue;
                            }

                            acc.push(cr);
                        }

                        return acc;

                    }, <Token[]>[]);

                    while (declaration.val.at(-1)?.typ == EnumToken.WhitespaceTokenType) {

                        declaration.val.pop();
                    }

                    while (declaration.val.at(0)?.typ == EnumToken.WhitespaceTokenType) {

                        declaration.val.shift();
                    }

                    return declaration;
                }

                const values: AstDeclaration[] = [...this.declarations.values()].reduce((acc: AstDeclaration[], curr: AstDeclaration | PropertySet) => {

                    if (curr instanceof PropertySet) {

                        acc.push(...curr);
                    } else {

                        acc.push(curr);
                    }

                    return acc;

                }, <AstDeclaration[]>[]);

                let isImportant: boolean = false;
                const filtered: AstDeclaration[] = values.map(removeDefaults).filter((x: AstDeclaration): boolean => x.val.filter((t: Token) => {

                    if (t.typ == EnumToken.ImportantTokenType) {

                        isImportant = true;
                    }

                    return ![EnumToken.WhitespaceTokenType, EnumToken.ImportantTokenType].includes(t.typ)
                }).length > 0);

                if (filtered.length == 0 && this.config.default.length > 0) {
                    filtered.push(<AstDeclaration>{
                        typ: EnumToken.DeclarationNodeType,
                        nam: this.config.shorthand,
                        val: parseString(this.config.default[0])
                    });

                    if (isImportant) {

                        filtered[0].val.push(<Token>{
                            typ: EnumToken.ImportantTokenType
                        });
                    }
                }

                return (filtered.length > 0 ? filtered : values)[Symbol.iterator]();
            }

            for (const declaration of this.declarations.values()) {

                if (declaration instanceof PropertySet) {

                    continue;
                }

                const config = declaration.nam == this.config.shorthand ? this.config : this.config.properties[declaration.nam] ?? this.config;

                if (!('mapping' in config)) {

                    continue;
                }

                // @ts-ignore
                for (const [key, val] of Object.entries(config.mapping)) {

                    const keys: Token[] = parseString(key);

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
            iterable = this.declarations.values();

        } else {

            let count: number = 0;
            let match: boolean;
            const separator = this.config.separator != null ? {
                ...this.config.separator,
                // @ts-ignore
                typ: EnumToken[this.config.separator.typ]
            } : null;
            const tokens: { [key: string]: Token[][] } = <{ [key: string]: Token[][] }>{};

            // @ts-ignore
            Object.entries(this.config.properties).reduce((acc: string[], curr: [string, PropertyMapType]): string[] => {

                if (!this.declarations.has(curr[0])) {

                    if (curr[1].required) {

                        acc.push(<string>curr[0]);
                    }

                    return acc;
                }

                let current: number = 0;

                const props: PropertyMapType = this.config.properties[curr[0]];
                const properties: AstDeclaration | PropertySet = <AstDeclaration | PropertySet>this.declarations.get(curr[0]);

                for (const declaration of <AstDeclaration[]>[(properties instanceof PropertySet ? [...properties][0] : properties)]) {

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
                        if (props.multiple && props.separator != null &&
                            // @ts-ignore
                            EnumToken[props.separator.typ] == val.typ &&
                            // @ts-ignore
                            props.separator.val == val.val) {

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
                        } else {

                            acc.push(<string>curr[0]);
                            break;
                        }
                    }
                }

                if (count == 0) {

                    count = current;
                }

                return acc;
            }, <string[]>[]);

            count++;

            if (!isShorthand || Object.entries(this.config.properties).some((entry: [string, PropertyMapType]) => {

                    // missing required property
                    return entry[1].required && !(entry[0] in tokens);
                }) ||

                // @ts-ignore
                !Object.values(tokens).every((v: Token[][]): boolean => v.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType).length == count)) {

                // @ts-ignore
                iterable = this.declarations.values();
            } else {

                let values: Token[] = Object.entries(tokens).reduce((acc: Token[][], curr: [string, Token[][]]) => {

                    const props: PropertyMapType = this.config.properties[curr[0]];

                    for (let i = 0; i < curr[1].length; i++) {

                        if (acc.length == i) {

                            acc.push([]);
                        }

                        let values: Token[] = curr[1][i].reduce((acc, curr) => {

                            if (acc.length > 0) {

                                acc.push(<Token>{typ: EnumToken.WhitespaceTokenType})
                            }

                            acc.push(curr);

                            return acc;

                        }, <Token[]>[]);

                        if (props.default.includes(curr[1][i].reduce((acc: string, curr: Token): string => acc + renderToken(curr) + ' ', '').trimEnd())) {

                            if (!this.config.properties[curr[0]].required) {

                                continue;
                            }
                        }

                        // remove default values
                        let doFilterDefault: boolean = true;

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
                        const filtered: Token[] = values.filter((val: Token): boolean => {

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

                                    let i: number = values.length;
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
                                acc[i].push({...props.prefix, typ: EnumToken[props.prefix.typ]});
                            } else if (acc[i].length > 0) {

                                acc[i].push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType});
                            }

                            acc[i].push(...values.reduce((acc, curr: Token) => {

                                if (acc.length > 0) {

                                    // @ts-ignore
                                    acc.push(<Token>{
                                        ...((props.separator && {
                                            ...props.separator,
                                            // @ts-ignore
                                            typ: EnumToken[props.separator.typ]
                                        }) ?? {typ: EnumToken.WhitespaceTokenType})
                                    });
                                }

                                // @ts-ignore
                                acc.push(curr);
                                return acc;
                            }, []))
                        }
                    }

                    return acc;
                }, <Token[][]>[]).reduce((acc: Token[], curr: Token[]) => {

                    if (acc.length > 0) {

                        acc.push(<Token>{...separator});
                    }

                    if (curr.length == 0 && this.config.default.length > 0) {

                        curr.push(...parseString(this.config.default[0]).reduce((acc: Token[], curr: Token) => {

                            if (acc.length > 0) {

                                acc.push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType});
                            }

                            acc.push(curr);
                            return acc;

                        }, <Token[]>[]))
                    }

                    acc.push(...curr);
                    return acc;

                }, []);

                if (this.config.mapping != null) {

                    const val: string = values.reduce((acc: string, curr: Token): string => acc + renderToken(curr, {
                        removeComments: true,
                        minify: true
                    }), '');

                    if (val in this.config.mapping) {

                        values.length = 0;
                        values.push(<StringToken | IdentToken>{
                            typ: ['"', "'"].includes(val.charAt(0)) ? EnumToken.StringTokenType : EnumToken.IdenTokenType,
                            // @ts-ignore
                            val: <string>this.config.mapping[val]
                        });
                    }
                }

                // @ts-ignore
                if (values.length == 1 &&
                    // @ts-ignore
                    typeof (<IdentToken>values[0]).val == 'string' &&
                    this.config.default.includes((<IdentToken>values[0]).val.toLowerCase()) &&
                    this.config.default[0] != (<IdentToken>values[0]).val.toLowerCase()) {

                    // @ts-ignore/
                    values = parseString(this.config.default[0]);
                }

                iterable = [<AstDeclaration>{
                    typ: EnumToken.DeclarationNodeType,
                    nam: this.config.shorthand,
                    val: values
                }][Symbol.iterator]();
            }
        }

        const iterators = <IterableIterator<AstDeclaration | PropertySet>[]>[];

        return {

            // @ts-ignore
            next(): IteratorResult<AstDeclaration> {

                let v: IteratorResult<AstDeclaration | PropertySet> = iterable.next();

                // @ts-ignore
                while (v.done || v.value instanceof PropertySet) {

                    if (v.value instanceof PropertySet) {

                        // @ts-ignore
                        iterators.push(iterable);

                        iterable = (<PropertySet>v.value)[Symbol.iterator]();

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

                return v as IteratorResult<AstDeclaration>;
            }
        };
    }

    private matchTypes(declaration: AstDeclaration) {

        const patterns: string[] = this.pattern.slice();
        const values: Token[] = [...declaration.val];

        let i: number;
        let j: number;

        const map: Map<string, number> = new Map;

        for (i = 0; i < patterns.length; i++) {

            for (j = 0; j < values.length; j++) {

                if (!map.has(patterns[i])) {

                    // @ts-ignore
                    map.set(patterns[i], <number>this.config.properties?.[patterns[i]]?.constraints?.mapping?.max ?? 1);
                }

                let count: number = <number>map.get(patterns[i]);

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

                            let i: number = declaration.val.length;

                            while (i--) {

                                // @ts-ignore
                                if (declaration.val[i].propertyName == key) {

                                    const val: Token = {...declaration.val[i]};

                                    Object.defineProperty(val, 'propertyName', {
                                        enumerable: false,
                                        writable: true,
                                        value: v
                                    });

                                    declaration.val.splice(i, 0, val, {typ: EnumToken.WhitespaceTokenType});
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private removeDefaults(map: Map<string, TokenMap>, value: Token[]) {

        for (const [key, val] of map) {

            const config: PropertyMapType = this.config.properties[key];

            if (config == null) {

                continue;
            }

            const v: string = val.value.join(' ');

            if (config.default.includes(v) || (value.length == 1 && this.config.default.includes(v))) {

                for (const token of value) {

                    if (val.t.includes(token)) {

                        let index: number = value.indexOf(token);

                        value.splice(index, 1);

                        if (config.prefix != null) {

                            while (index-- > 0) {

                                if (value[index].typ == EnumToken.WhitespaceTokenType) {

                                    continue;
                                }

                                // @ts-ignore@
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