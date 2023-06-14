import {AstDeclaration, IdentToken, NumberToken, PercentageToken, PropertyMapType, Token} from "../../@types";
import {ShorthandMapType} from "../../@types";
import {eq} from "../utils/eq";
import {properties} from "../../../tools/shorthand";
import {isNumber} from "../utils";

export class PropertyMap {

    protected config: ShorthandMapType;
    protected declarations: Map<string, AstDeclaration>;
    protected requiredCount: any;
    protected pattern: string[];

    constructor(config: ShorthandMapType) {

        const values: PropertyMapType[] = Object.values(config.properties);
        this.requiredCount = values.reduce((acc: number, curr: PropertyMapType) => curr.required ? ++acc : acc, 0)
        this.config = config;
        this.declarations = new Map<string, AstDeclaration>;
        this.pattern = config.pattern.split(/\s/);

        this.requiredCount = values.length;
    }

    add(declaration: AstDeclaration) {

        if (declaration.nam == this.config.shorthand) {

            this.declarations.clear();
            this.declarations.set(<string>declaration.nam, declaration);
        } else {

            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {

                const properties: Map<string, AstDeclaration> = new Map;
                const values: Token[] = this.pattern.reduce((acc: Token[], property: string) => {

                    for (let i = 0; i < acc.length; i++) {

                        if (acc[i].typ == 'Comment' || acc[i].typ == 'Whitespace') {

                            acc.splice(i, 1);
                            i--;

                            continue;
                        }

                        const props: PropertyMapType = this.config.properties[property];

                        if ((acc[i].typ == 'Iden' && props.keywords.includes((<IdentToken>acc[i]).val)) ||
                            props.types.includes(acc[i].typ)) {

                            if (!properties.has(property)) {

                                properties.set(property, <AstDeclaration>{
                                    typ: 'Declaration',
                                    nam: property,
                                    val: [acc[i]]
                                });

                            } else {

                                // @ts-ignore
                                properties.get(property).val.push(acc[i]);
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

                            if (!(<PropertyMapType>props).multiple) {

                                break;
                            }
                        }
                    }

                    return acc;

                    // @ts-ignore
                }, this.declarations.get(this.config.shorthand).val.slice());

                if (values.length == 0) {

                    this.declarations = properties;
                }
            }

            this.declarations.set(<string>declaration.nam, declaration);
        }

        return this;
    }

    [Symbol.iterator](): IterableIterator<AstDeclaration> {

        if (this.declarations.has(this.config.shorthand) ||
            (this.declarations.size > 0 && this.requiredCount <= Object.keys(this.config.properties).reduce((acc: number, curr: string) => this.declarations.has(curr) && this.config.properties[curr].required ? ++acc : acc, 0))) {

            return this.declarations.values();
        }

        // @ts-ignore
        const valid: string[] = Object.entries(this.config.properties).reduce((acc, curr) => {

            if (!this.declarations.has(curr[0])) {

                if (curr[1].required) {

                    acc.push(<string>curr[0]);
                }

                return acc;
            }

            // @ts-ignore
            for (const val of this.declarations.get(curr[0]).val) {

                if (val.typ == 'Whitespace' || val.typ == 'Comment') {

                    continue;
                }

                if (val.typ == 'Iden' && curr[1].keywords.includes((<IdentToken>val).val) ||
                    curr[1].types.includes(val.typ)) {

                    continue;
                }

                if (curr[1].required && val.typ == 'Comma') {

                    continue;
                }

                acc.push(<string>curr[0]);
                break;
            }

            return acc;
        }, <string[]>[]);

        if (valid.length > 0) {

            return this.declarations.values();
        }

        const pattern: string[] = this.config.pattern.split(/\s+/);
        const values: { [key: string]: Token[] } = pattern.reduce((acc, curr) => {

            if (this.declarations.has(curr)) {

                // let current: number = 0;

                // remove default values
                // @ts-ignore
                const values: Token[] = this.declarations.get(curr).val.filter(val => !('val' in val) || !this.config.properties[curr].default.includes((<IdentToken>val).val));

                if (values.length == 0) {

                    return acc;
                }

                for (const val of values) {

                    if (val.typ == 'Whitespace' || val.typ == 'Comment') {

                        continue;
                    }

                    if (curr in this.config.properties) {

                        if (this.config.properties[curr].types.includes(val.typ) || (val.typ == 'Iden' && this.config.properties[curr].keywords.includes(val.val))) {

                            if (!(curr in acc)) {

                                acc[curr] = [];
                            }

                            acc[curr].push(val);
                        }
                    }
                }
            }

            return acc
        }, <{ [key: string]: Token[] }>{});

        const separator = this.config.separator;

        if (Object.keys(values).length == 0) {

            const val = this.config.default[0];

            if (val == null) {

                return this.declarations.values();
            }

            return [<AstDeclaration>{

                typ: 'Declaration',
                nam: this.config.shorthand,
                val: [{typ: isNumber(val) ? 'Number' : 'Iden', val}]
            }][Symbol.iterator]()
        }

        return [<AstDeclaration>{

            typ: 'Declaration',
            nam: this.config.shorthand,
            val: pattern.reduce((acc: Token[][], property: string) => {

                let current: number = 0;

                if (property in values) {

                    if (acc.length == 0) {

                        acc.push([]);
                    }

                    for (let i = 0; i < values[property].length; i++) {

                        if (separator != null && separator.typ == values[property][i].typ && eq(separator, values[property][i])) {

                            if (acc.length < ++current) {

                                acc.push([]);
                            }

                            continue;
                        }

                        if (i == 0 && acc.length == 0) {

                            acc[current].push(values[property][i]);
                        } else if ('prefix' in this.config.properties[property]) {

                            acc[current].push(Object.assign({}, this.config.properties[property].prefix));
                            acc[current].push(values[property][i]);
                        } else if (this.config.properties[property].multiple) {

                            if (i > 0 && 'separator' in this.config.properties[property]) {

                                acc[current].push(Object.assign({}, this.config.properties[property].separator));
                            } else {

                                acc[current].push({typ: 'Whitespace'});
                            }

                            acc[current].push(values[property][i]);
                        } else {

                            acc[current].push({typ: 'Whitespace'});
                            acc[current].push(values[property][i]);
                        }

                        if (values[property][i].typ == 'Iden' &&
                            'mapping' in this.config.properties[property]) {

                            // @ts-ignore
                            const val = this.config.properties[property].mapping[(<IdentToken>values[property][i]).val.toLowerCase()];

                            if (val != null && val.length < (<IdentToken>values[property][i]).val.length) {

                                if (val.endsWith('%')) {
                                    acc[current][acc[current].length - 1] = <PercentageToken>{
                                        typ: 'Perc',
                                        val: val.slice(0, -1)
                                    }
                                }

                                else {

                                    acc[current][acc[current].length - 1] = <NumberToken | IdentToken>{
                                        typ: isNumber(val) ? 'Number' : 'Iden',
                                        val
                                    }
                                }
                            }
                        }
                    }
                }

                return acc;
            }, <Token[][]>[]).reduce((acc, curr) => {

                if (acc.length > 0) {

                    acc.push(<Token>(separator ? {...separator} : {typ: 'Whitespace'}))
                }

                acc.push(...(curr[0].typ == 'Whitespace' ? curr.slice(1) : curr));

                return acc;
            }, [])
        }][Symbol.iterator]();

        // return this.declarations.values();
        // .reduce((acc, curr) => {
        //
        //     const k: number = curr.length * 2 - 1;
        //
        //     for (let i = 1; i < k; i += 2) {
        //
        //         curr.splice(i, 0, {typ: 'Whitespace'});
        //     }
        //
        //     acc.push(...curr);
        //
        //     return acc;
        // }, []);


        // if (values.length == 0 && this.config.default.length > 0) {
        //
        //     const val = this.config.default.reduce((acc, curr) => {
        //
        //         return acc.length == 0 || acc.length > curr.length ? curr : acc;
        //
        //     }, '');
        //
        //     values.push(<Token>{
        //         typ: Number.isInteger(val) ? 'Number' : 'Iden',
        //         val
        //     });
        // }
        //
        // if (values.length == 0) {
        //
        //     return this.declarations.values();
        // }
        //
        // return [<AstDeclaration>{
        //     typ: 'Declaration',
        //     nam: this.config.shorthand,
        //     val: values
        //
        //
        // }][Symbol.iterator]()
    }
}