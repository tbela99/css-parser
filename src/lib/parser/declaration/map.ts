import {
    AstDeclaration,
    PropertiesConfig,
    PropertyListOptions,
    PropertyMapType,
    ShorthandMapType,
    ShorthandPropertyType,
    Token,
    WhitespaceToken
} from "../../../@types";
import {eq} from "../utils/eq";
import {compareTokens, copyNodeProperties, getConfig, matchType, unMappedTokensType} from "../utils";
import {renderToken} from "../../renderer";
import {parseString} from "../parse";
import {PropertySet} from "./set";
import {definedPropertySettings, EnumToken} from "../../ast";

const propertiesConfig: PropertiesConfig = getConfig();

function processMapping(values: Token[], props: ShorthandMapType | PropertyMapType) {

    let i: number;

    for (i = 0; i < values.length; i++) {

        const val: Token = values[i];

        if (unMappedTokensType.includes(val.typ)) {

            continue;
        }

        // @ts-ignore
        const config = val.propertyName == props.shorthand ? props : props?.properties?.[val.propertyName] ?? props;

        if (config == null) {

            continue;
        }

        if ('mapping' in config) {

            // @ts-ignore
            if (!('constraints' in props) || !('max' in props.constraints) || values.length <= props.constraints.mapping.max) {

                const v: string = renderToken(val, {minify: true});

                if (v in config.mapping) {

                    values.splice(i, 1, ...copyNodeProperties(parseString(config.mapping[v]), val));
                    // i--;
                }
            }
        }
    }

    if ('mapping' in props) {

        const v: string = values.reduce((acc: string, val: Token) => {

            return acc + renderToken(val, {minify: true});
        }, '');

        // @ts-ignore
        if (v in props.mapping) {

            const val = values[0];
            values.length = 0;
            // @ts-ignore
            values.push(...copyNodeProperties(parseString(<string>props.mapping[v]), val));
        }
    }
}

export class PropertyMap {

    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration | PropertySet>;
    protected requiredCount: any;
    protected pattern: string[];
    protected options: PropertyListOptions;

    constructor(config: ShorthandMapType, options: PropertyListOptions) {

        const values: PropertyMapType[] = Object.values(config.properties);

        this.options = options;
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
                    if (separator != null && separator.typ == curr.typ && eq(separator, curr)) {

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

                                        if (eq(acc[i], {
                                            ...this.config.properties[property].prefix,
                                            // @ts-ignore
                                            typ: EnumToken[props.prefix.typ]
                                        })) {

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

    private getConfig(name: string) {

        // @ts-ignore
        return name == this.config.shorthand ? this.config : this.config.properties[name] ?? propertiesConfig.properties[propertiesConfig.properties[name].shorthand]
    }

    [Symbol.iterator]() {

        let iterable: IterableIterator<AstDeclaration>;
        let requiredCount: number = 0;
        let property: string;
        let isShorthand: boolean = true;

        for (property of Object.keys(this.config.properties)) {

            if (this.config.properties[property].required) {

                if (!this.declarations.has(property) && !this.declarations.has(this.config.shorthand)) {

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

        if (!isShorthand || this.declarations.has(this.config.shorthand) || requiredCount < this.requiredCount) {

            const removeDefaults = (declaration: AstDeclaration): AstDeclaration => {

                let i: number;
                let t: Token;

                let value: Token[] = [];
                let values: Token[][] = [];

                // @ts-ignore
                let separator: Token = this.config.separator ? {
                    ...this.config.separator,
                    // @ts-ignore
                    typ: EnumToken[this.config.separator.typ]
                } : {typ: EnumToken.CommaTokenType};
                let typ: EnumToken = separator.typ;

                // @ts-ignore
                const config: ShorthandMapType | PropertyMapType = this.getConfig(declaration.nam);

                this.matchTypes(declaration);

                values.push(value);

                for (i = 0; i < declaration.val.length; i++) {

                    t = declaration.val[i];
                    //
                    //     // if (!cache.has(t)) {
                    //     //
                    //     //     // @ts-ignore
                    //     //     cache.set(t, renderToken(t, this.options));
                    //     // }
                    //
                    // @ts-ignore
                    if (t.typ == typ && t.val == separator.val) {

                        processMapping(value, config);
                        this.removeDefaults(value, config, declaration.nam == this.config.shorthand);

                        value = [];
                        values.push(value);
                        // map.clear();

                        continue;
                    }

                    value.push(t);
                    //
                    //     // @ts-ignore
                    //     if ('propertyName' in t) {
                    //
                    //         // @ts-ignore
                    //         if (!map.has(t.propertyName)) {
                    //
                    //             // @ts-ignore
                    //             map.set(t.propertyName, {t: [t], value: [<string>cache.get(t)]});
                    //         } else {
                    //
                    //             // @ts-ignore
                    //             const v: TokenMap = <TokenMap>map.get(t.propertyName);
                    //
                    //             v.t.push(t);
                    //             v.value.push(<string>cache.get(t));
                    //         }
                    //     }
                }

                processMapping(value, config);
                this.removeDefaults(value, config, declaration.nam == this.config.shorthand);

                declaration.val = values.reduce((acc: Token[], curr: Token[]) => {

                    if (acc.length > 0) {

                        acc.push({...separator});
                    }

                    acc.push(...curr);
                    return acc;
                });

                return declaration;
            };

            const values: AstDeclaration[] = [...this.declarations.values()].reduce((acc: AstDeclaration[], curr: AstDeclaration | PropertySet) => {

                if (curr instanceof PropertySet) {

                    acc.push(...curr);
                } else {

                    acc.push(curr);
                }

                return acc;

            }, <AstDeclaration[]>[]);

            for (const declaration of values) {

                removeDefaults(declaration);
            }

            if (isShorthand && this.declarations.has(this.config.shorthand)) {

                // const cache: Map<Token, string> = new Map();

                // let isImportant: boolean = false;
                // const filtered: AstDeclaration[] = values.map(removeDefaults).filter((x: AstDeclaration): boolean => x.val.filter((t: Token) => {
                //
                //     if (t.typ == EnumToken.ImportantTokenType) {
                //
                //         isImportant = true;
                //     }
                //
                //     return ![EnumToken.WhitespaceTokenType, EnumToken.ImportantTokenType].includes(t.typ)
                // }).length > 0);

                // if (filtered.length == 0 && this.config.default.length > 0) {
                //     filtered.push(<AstDeclaration>{
                //         typ: EnumToken.DeclarationNodeType,
                //         nam: this.config.shorthand,
                //         val: parseString(this.config.default[0])
                //     });

                // if (isImportant) {
                //
                //     filtered[0].val.push(<Token>{
                //         typ: EnumToken.ImportantTokenType
                //     });
                // }
                // }

                return values[Symbol.iterator]();
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
                        if (props.multiple && props.separator != null && EnumToken[props.separator.typ] == val.typ && eq({
                            ...props.separator,
                            // @ts-ignore
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

                        // @todo remove renderToken call
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

                            processMapping(values, props);

                            if ('prefix' in props) {

                                // @ts-ignore
                                acc[i].push({...props.prefix, typ: EnumToken[props.prefix.typ]});
                            } else if (acc[i].length > 0) {

                                acc[i].push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType});
                            }

                            acc[i].push(...values.reduce((acc, curr) => {

                                if (acc.length > 0) {

                                    // @ts-ignore
                                    acc.push(<Token>{
                                        ...(props.separator ? {
                                            ...props.separator,
                                            // @ts-ignore
                                            typ: EnumToken[props.separator.typ]
                                        } : {typ: EnumToken.WhitespaceTokenType})
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

                if (this.config.separator != null) {

                    const allValues: Token[] = [];
                    const response: Token[] = [];

                    for (const val of values) {

                        // @ts-ignore
                        if (this.config.separator.typ == EnumToken[val.typ] && val.val == this.config.separator.val) {

                            processMapping(allValues, this.config);
                            this.removeDefaults(allValues, this.config, true);

                            if (response.length > 0) {

                                // @ts-ignore
                                response.push(<WhitespaceToken>{
                                    ...this.config.separator,
                                    // @ts-ignore
                                    typ: EnumToken[this.config.separator.typ]
                                });
                            }

                            response.push(...allValues);
                            allValues.length = 0;
                        } else {

                            allValues.push(val);
                        }
                    }

                    if (allValues.length > 0) {

                        processMapping(allValues, this.config);
                        this.removeDefaults(allValues, this.config, true);

                        if (response.length > 0) {

                            // @ts-ignore
                            response.push(<WhitespaceToken>{
                                ...this.config.separator,
                                // @ts-ignore
                                typ: EnumToken[this.config.separator.typ]
                            });
                        }

                        response.push(...allValues);
                    }

                    values = response;
                } else {

                    processMapping(values, this.config);
                    this.removeDefaults(values, this.config, true);
                }

                // if (this.config.mapping != null) {
                //
                //     const val: string = values.reduce((acc: string, curr: Token): string => acc + renderToken(curr, {
                //         removeComments: true,
                //         minify: true
                //     }), '');
                //
                //     if (val in this.config.mapping) {
                //
                //         values.length = 0;
                //         values.push(<StringToken | IdentToken>{
                //             typ: ['"', "'"].includes(val.charAt(0)) ? EnumToken.StringTokenType : EnumToken.IdenTokenType,
                //             // @ts-ignore
                //             val: <string>this.config.mapping[val]
                //         });
                //     }
                // }
                //
                // // @ts-ignore
                // if (values.length == 1 &&
                //     typeof (<IdentToken>values[0]).val == 'string' &&
                //     this.config.default.includes((<IdentToken>values[0]).val.toLowerCase()) &&
                //     this.config.default[0] != (<IdentToken>values[0]).val.toLowerCase()) {
                //
                //     // @ts-ignore/
                //     values = parseString(this.config.default[0]);
                // }

                iterable = [<AstDeclaration>{
                    typ: EnumToken.DeclarationNodeType,
                    nam: this.config.shorthand,
                    val: values
                }][Symbol.iterator]();
            }
        }

        const iterators = <IterableIterator<AstDeclaration>[]>[];

        return {

            // @ts-ignore
            next() {

                let v = iterable.next();

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

                return v;
            }
        };
    }

    private removeDefaults(value: Token[], configuration: ShorthandMapType | PropertyMapType, isShorthand: boolean) {

        let i: number;

        for (i = 0; i < value.length; i++) {

            if (unMappedTokensType.includes(value[i].typ)) {

                continue;
            }

            const val: Token = value[i];

            // @ts-ignore
            const config: PropertyMapType = val.propertyName == this.config.shorthand ? configuration : this.config.properties[val.propertyName];

            if (config == null) {

                continue;
            }

            const tokens: Array<{ t: string, val: Token[] }> = config.default.map(t => {

                return {
                    t,
                    val: copyNodeProperties(parseString(t), val)
                }

            }).sort((a, b) => b.val.length - a.val.length);

            for (const token of tokens) {

                if (compareTokens(token.val[0], val) && token.t == value.slice(i, i + token.val.length).reduce((acc, curr) => acc + renderToken(curr, {minify: true}), '')) {

                    value.splice(i, token.val.length);

                    if (config.prefix != null && i > 0) {

                        let k: number = i;

                        while (k-- && value[k].typ == EnumToken.WhitespaceTokenType) ;

                        // @ts-ignore
                        if (value[k].typ == EnumToken.LiteralTokenType && value[k].val == config.prefix.val) {

                            value.splice(k, i - k);
                            i = k - 1;
                        }
                    }

                    break;
                }
            }
        }
        if (isShorthand && configuration.default.length > 0) {

            let r: string = '';

            for (const vl of value) {

                r += renderToken(vl, {minify: true});
            }

            for (i = 0; i < configuration.default.length; i++) {

                if (r == configuration.default[i]) {

                    value.length = 0;
                    // @ts-ignore
                    value.push(...copyNodeProperties(parseString(configuration.default[0]), Object.defineProperty({}, 'propertyName', {...definedPropertySettings, value: this.config.shorthand})));
                    break;
                }
            }
        }

        if (value.at(-1)?.typ == EnumToken.ImportantTokenType && value.at(-2)?.typ == EnumToken.WhitespaceTokenType) {

            value.splice(-2, 1);
        }

        for (i = 0; i < value.length; i++) {

            if (i == 0 && value[i].typ == EnumToken.WhitespaceTokenType) {

                value.splice(i--, 1);
                continue
            }

            if (value[i].typ == EnumToken.WhitespaceTokenType && value?.[i + 1]?.typ == EnumToken.WhitespaceTokenType) {

                value.splice(i--, 1);
                continue;
            }
        }

        // while (value[0]?.typ == EnumToken.WhitespaceTokenType) {
        //
        // }


        // if (this.config.default.length == 0) {
        //
        //     return;
        // }

        if (value.length == 0 || (value.length == 1 && value[0].typ == EnumToken.ImportantTokenType)) {

            value.unshift(...parseString(isShorthand ? this.config.default[0] : configuration.default[0]));
        }
    }
}