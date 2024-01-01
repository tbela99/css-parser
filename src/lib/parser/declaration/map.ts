import {
    AstDeclaration,
    IdentToken,

    PropertyMapType,
    ShorthandMapType,
    ShorthandPropertyType, StringToken,
    Token,
    WhitespaceToken
} from "../../../@types";
import {eq} from "../utils/eq";
import {getConfig, matchType} from "../utils";
import {renderToken} from "../../renderer";
import {parseString} from "../parse";
import {PropertySet} from "./set";
import {EnumToken} from "../../ast";

const propertiesConfig = getConfig();

export class PropertyMap {

    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration | PropertySet>;
    protected requiredCount: any;
    protected pattern: string[];

    constructor(config: ShorthandMapType) {

        const values: PropertyMapType[] = Object.values(config.properties);
        this.requiredCount = values.reduce((acc: number, curr: PropertyMapType) => curr.required ? ++acc : acc, 0) || values.length;
        this.config = config;
        this.declarations = new Map<string, AstDeclaration>;
        this.pattern = config.pattern.split(/\s/);
    }

    add(declaration: AstDeclaration) {

        for (const val of declaration.val) {

            Object.defineProperty(val, 'propertyName', {enumerable: false, writable: true, value: declaration.nam});
        }

        if (declaration.nam == this.config.shorthand) {

            this.declarations = new Map<string, AstDeclaration>;
            this.declarations.set(<string>declaration.nam, declaration);
        } else {

            const separator = this.config.separator != null ? <Token>{
                ...this.config.separator,
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

                        values.push(...this.pattern.reduce((acc: Token[], property: string) => {

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

                                const defaults = parseString(props.default[0]);

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

                    this.declarations = Object.entries(tokens).reduce((acc, curr) => {

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

        let iterable: IterableIterator<AstDeclaration>;
        let requiredCount: number = 0;
        let property: string;
        let isShorthand: boolean = true;

        for (property of Object.keys(this.config.properties)) {

            if (this.config.properties[property].required) {

                if (!this.declarations.has(property)) {

                    isShorthand = false;
                    break;
                } else {

                    const val = this.declarations.get(property);

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

                const removeDefaults = (declaration: AstDeclaration): AstDeclaration => {

                    const dec: AstDeclaration = {...declaration};

                   dec.val  = declaration.val.filter((val: Token): boolean => {

                       if (val.typ != EnumToken.Iden) {

                           return true;
                       }

                        return !this.pattern.some((property: string): boolean => {

                            if (matchType(val, this.config.properties[property]) && this.config.properties[property].keywords.includes(val.val)) {

                                return this.config.properties[property].default.includes(val.val);
                            }

                            return false;
                        });
                    });

                    if (dec.val.at(-1)?.typ == EnumToken.WhitespaceTokenType) {

                        dec.val.pop();
                    }

                    return dec;
                }

                const values: AstDeclaration[] = [...this.declarations.values()].reduce((acc: AstDeclaration[], curr: AstDeclaration | PropertySet) => {

                    if (curr instanceof PropertySet) {

                        acc.push(...curr);
                    }

                    else {

                        acc.push(curr);
                    }

                    return acc;

                }, <AstDeclaration[]>[]);

                const filtered: AstDeclaration[] = values.map(removeDefaults).filter(x => x.val.length > 0);

                return (filtered.length > 0 ? filtered : values)[Symbol.iterator]();
            }

            // @ts-ignore
            iterable = this.declarations.values();

        }
        else {

            let count = 0;
            let match: boolean;
            const separator = this.config.separator != null ? {
                ...this.config.separator,
                typ: EnumToken[this.config.separator.typ]
            } : null;
            const tokens = <{ [key: string]: Token[][] }>{};

            // @ts-ignore
            /* const valid: string[] =*/
            Object.entries(this.config.properties).reduce((acc, curr) => {

                if (!this.declarations.has(curr[0])) {

                    if (curr[1].required) {

                        acc.push(<string>curr[0]);
                    }

                    return acc;
                }

                let current = 0;

                const props: PropertyMapType = this.config.properties[curr[0]];
                const properties = this.declarations.get(curr[0]);

                for (const declaration of <AstDeclaration[]>[(properties instanceof PropertySet ? [...properties][0] : properties)]) {

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

            if (!isShorthand || Object.entries(this.config.properties).some(entry => {

                    // missing required property
                    return entry[1].required && !(entry[0] in tokens);
                }) ||

                // @ts-ignore
                !Object.values(tokens).every(v => v.filter(t => t.typ != EnumToken.CommentTokenType).length == count)) {

                // @ts-ignore
                iterable = this.declarations.values();
            } else {

                const values: Token[] = Object.entries(tokens).reduce((acc, curr) => {

                    const props = this.config.properties[curr[0]];

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
                        if (props.default.includes(curr[1][i].reduce((acc, curr) => acc + renderToken(curr) + ' ', '').trimEnd())) {

                            continue;
                        }

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
                        values = values.filter((val: Token) => {

                            if (val.typ == EnumToken.WhitespaceTokenType || val.typ == EnumToken.CommentTokenType) {

                                return false;
                            }

                            return !doFilterDefault || !(val.typ == EnumToken.IdenTokenType && props.default.includes(val.val));
                        });

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
                                acc[i].push({...props.prefix, typ: EnumToken[props.prefix.typ]});
                            } else if (acc[i].length > 0) {

                                acc[i].push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType});
                            }

                            acc[i].push(...values.reduce((acc, curr) => {

                                if (acc.length > 0) {

                                    // @ts-ignore
                                    acc.push(<Token>{
                                        ...((props.separator && {
                                            ...props.separator,
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
                }, <Token[][]>[]).reduce((acc, curr) => {

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

                    const val = values.reduce((acc, curr) => acc + renderToken(curr, {removeComments: true}), '');

                    if (val in this.config.mapping) {

                        values.length = 0;
                        values.push(<StringToken | IdentToken>{
                            typ: ['"', "'"].includes(val.charAt(0)) ? EnumToken.StringTokenType : EnumToken.IdenTokenType,
                            // @ts-ignore
                            val: <string>this.config.mapping[val]
                        });
                    }
                }

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
}