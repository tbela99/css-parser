import {
    AstDeclaration,
    ColorToken,
    IdentToken,
    NumberToken,
    PercentageToken,
    PropertyMapType,
    Token
} from "../../@types";
import {ShorthandMapType} from "../../@types";
import {eq} from "../utils/eq";
import {isNumber} from "../utils";
import {renderToken} from "../../renderer";
import {matchType} from "../utils/type";

function getTokenType(val: string): Token {

    if (val == 'transparent' || val == 'currentcolor') {

        return <ColorToken>{

            typ: 'Color',
            val,
            kin: 'lit'
        }
    }

    if (val.endsWith('%')) {
        return <PercentageToken>{
            typ: 'Perc',
            val: val.slice(0, -1)
        }
    }

    return <NumberToken | IdentToken>{
        typ: isNumber(val) ? 'Number' : 'Iden',
        val
    };
}

function parseString(val: string) {
    return val.split(/\s/).map(getTokenType).reduce((acc: Token[], curr: Token) => {

        if (acc.length > 0) {

            acc.push({typ: 'Whitespace'});
        }

        acc.push(curr);
        return acc;

    }, <Token[]>[]);
}

export class PropertyMap {

    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration>;
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

        if (declaration.nam == this.config.shorthand) {

            this.declarations.clear();
            this.declarations.set(<string>declaration.nam, declaration);
        } else {

            const separator = <Token>this.config.separator;

            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {

                const tokens: { [key: string]: Token[][] } = {};
                const values: Token[] = [];

                this.declarations.get(this.config.shorthand).val.slice().reduce((acc, curr) => {

                    if (separator != null && separator.typ == curr.typ && eq(separator, curr)) {

                        acc.push([]);
                        return acc;
                    }
                    // else {

                    acc.at(-1).push(curr);
                    // }

                    return acc;
                }, [[]]).reduce((acc, list, current) => {

                    values.push(...this.pattern.reduce((acc: Token[], property: string) => {

                        // let current: number = 0;
                        const props: PropertyMapType = this.config.properties[property];

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

                                } else {

                                    if (current == tokens[property].length) {

                                        tokens[property].push([acc[i]]);
                                        // tokens[property][current].push();
                                    } else {

                                        tokens[property][current].push({typ: 'Whitespace'}, acc[i]);
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
                                    [...defaults
                                    ]
                                ];

                            } else {

                                if (current == tokens[property].length) {

                                    tokens[property].push([]);
                                    tokens[property][current].push(...defaults);
                                } else {

                                    tokens[property][current].push({typ: 'Whitespace'}, ...defaults);
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

                            typ: 'Declaration',
                            nam: curr[0],
                            val: curr[1].reduce((acc, curr) => {

                                if (acc.length > 0) {

                                    acc.push(<Token>{...separator});
                                }

                                acc.push(...curr);
                                return acc;
                            }, [])
                        })

                        return acc;
                    }, new Map<string, AstDeclaration>);
                }
            }

            this.declarations.set(<string>declaration.nam, declaration);
        }

        return this;
    }

    [Symbol.iterator](): IterableIterator<AstDeclaration> {

        let requiredCount = Object.keys(this.config.properties).reduce((acc: number, curr: string) => this.declarations.has(curr) && this.config.properties[curr].required ? ++acc : acc, 0);

        if (requiredCount == 0) {

            requiredCount = this.declarations.size;
        }

        if (requiredCount < this.requiredCount) {

            return this.declarations.values();
        }

        let count = 0;
        const separator = this.config.separator;
        const tokens = <{ [key: string]: Token[][] }>{};

        // @ts-ignore
        const valid: string[] = Object.entries(this.config.properties).reduce((acc, curr) => {

            if (!this.declarations.has(curr[0])) {

                if (curr[1].required) {

                    acc.push(<string>curr[0]);
                }

                return acc;
            }

            let current = 0;

            const props = this.config.properties[curr[0]];

            // @ts-ignore
            for (const val of this.declarations.get(curr[0]).val) {

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

                if (props.multiple && props.separator != null && props.separator.typ == val.typ && eq(val, props.separator)) {

                    continue;
                }

                if (matchType(val, curr[1])) {

                    if (!(curr[0] in tokens)) {

                        tokens[curr[0]] = [[]];
                    }

                    // is default value

                    tokens[curr[0]][current].push(val);
                    continue;
                }

                acc.push(<string>curr[0]);
                break;
            }

            if (count == 0) {

                count = current;
            }

            return acc;
        }, <string[]>[]);

        if (valid.length > 0 || Object.values(tokens).every(v => v.every(v => v.length == count))) {

            return this.declarations.values();
        }

        const values: Token[] = Object.entries(tokens).reduce((acc, curr) => {

            const props = this.config.properties[curr[0]];

            for (let i = 0; i < curr[1].length; i++) {

                if (acc.length == i) {

                    acc.push([]);
                }

                let values: Token[] = curr[1][i].reduce((acc, curr) => {

                    if (acc.length > 0) {

                        acc.push(<Token>{typ: 'Whitespace'})
                    }

                    acc.push(curr);

                    return acc;

                }, <Token[]>[]);

                if (props.default.includes(curr[1][i].reduce((acc, curr) => acc + renderToken(curr) + ' ', '').trimEnd())) {

                    continue;
                }

                values = values.filter((val: Token) => {

                    if (val.typ == 'Whitespace' || val.typ == 'Comment') {

                        return false;
                    }

                    return !(val.typ == 'Iden' && props.default.includes(val.val));
                });

                if (values.length > 0) {

                    if ('mapping' in props) {

                        if (!('constraints' in props) || !('max' in props.constraints) || values.length <= props.constraints.mapping.max) {

                            let i = values.length;
                            while (i--) {

                                if (values[i].typ == 'Iden' && values[i].val in props.mapping) {

                                    values.splice(i, 1, ...parseString(props.mapping[values[i].val]));
                                }
                            }
                        }

                    }

                    if ('prefix' in props) {

                        acc[i].push({...props.prefix});
                    }

                    else if (acc[i].length > 0) {

                        acc[i].push({typ: 'Whitespace'});
                    }

                    acc[i].push(...values.reduce((acc, curr) => {

                        if (acc.length > 0) {

                            acc.push(<Token>{...(props.separator ?? {typ: 'Whitespace'})});
                        }

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

            if (curr.length == 0) {

                curr.push(...<Token[]>this.config.default[0].split(/\s/).map(getTokenType).reduce((acc: Token[], curr: Token) => {

                    if (acc.length > 0) {

                        acc.push({typ: 'Whitespace'});
                    }

                    acc.push(curr);
                    return acc;

                }, <Token[]>[]))
            }

            acc.push(...curr);
            return acc;

        }, []);

        return [<AstDeclaration>{
            typ: 'Declaration',
            nam: this.config.shorthand,
            val: values
        }][Symbol.iterator]();
    }
}