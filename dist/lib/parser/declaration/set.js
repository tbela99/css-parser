import { eq } from '../utils/eq.js';
import { isLength } from '../utils/syntax.js';
import { EnumToken } from '../../ast/types.js';
import '../parse.js';
import '../../renderer/utils/color.js';
import '../../renderer/sourcemap/lib/encode.js';

class PropertySet {
    config;
    declarations;
    constructor(config) {
        this.config = config;
        this.declarations = new Map;
    }
    add(declaration) {
        if (declaration.nam == this.config.shorthand) {
            this.declarations = new Map;
        }
        else {
            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {
                let isValid = true;
                let current = -1;
                const tokens = [];
                // @ts-ignore
                for (let token of this.declarations.get(this.config.shorthand).val) {
                    // @ts-ignore
                    if (this.config.types.some(t => token.typ == EnumToken[t]) || (token.typ == EnumToken.NumberTokenType && token.val == '0' &&
                        (this.config.types.includes('Length') ||
                            this.config.types.includes('Angle') ||
                            this.config.types.includes('Dimension')))) {
                        if (tokens.length == 0) {
                            tokens.push([]);
                            current++;
                        }
                        tokens[current].push(token);
                        continue;
                    }
                    if (token.typ != EnumToken.WhitespaceTokenType && token.typ != EnumToken.CommentTokenType) {
                        if (token.typ == EnumToken.IdenTokenType && this.config.keywords.includes(token.val)) {
                            if (tokens.length == 0) {
                                tokens.push([]);
                                current++;
                            }
                            tokens[current].push(token);
                        }
                        if (token.typ == EnumToken.LiteralTokenType && token.val == this.config.separator) {
                            tokens.push([]);
                            current++;
                            continue;
                        }
                        isValid = false;
                        break;
                    }
                }
                if (isValid && tokens.length > 0) {
                    this.declarations.delete(this.config.shorthand);
                    for (const values of tokens) {
                        this.config.properties.forEach((property, index) => {
                            if (!this.declarations.has(property)) {
                                this.declarations.set(property, {
                                    typ: 5 /* NodeType.DeclarationNodeType */,
                                    nam: property,
                                    val: []
                                });
                            }
                            while (index > 0 && index >= values.length) {
                                if (index > 1) {
                                    index %= 2;
                                }
                                else {
                                    index = 0;
                                    break;
                                }
                            }
                            // @ts-ignore
                            const val = this.declarations.get(property).val;
                            if (val.length > 0) {
                                val.push({ typ: EnumToken.WhitespaceTokenType });
                            }
                            val.push({ ...values[index] });
                        });
                    }
                }
                this.declarations.set(declaration.nam, declaration);
                return this;
            }
        }
        this.declarations.set(declaration.nam, declaration);
        return this;
    }
    isShortHand() {
        if (this.declarations.has(this.config.shorthand)) {
            return this.declarations.size == 1;
        }
        return this.config.properties.length == this.declarations.size;
    }
    [Symbol.iterator]() {
        let iterator;
        const declarations = this.declarations;
        if (declarations.size < this.config.properties.length) {
            iterator = declarations.values();
        }
        else {
            const values = [];
            this.config.properties.forEach((property) => {
                let index = 0;
                // @ts-ignore
                for (const token of this.declarations.get(property).val) {
                    if (token.typ == EnumToken.WhitespaceTokenType) {
                        continue;
                    }
                    if (values.length == index) {
                        values.push([]);
                    }
                    values[index].push(token);
                    index++;
                }
            });
            for (const value of values) {
                let i = value.length;
                while (i-- > 1) {
                    const t = value[i];
                    const k = value[i == 1 ? 0 : i % 2];
                    if (t.val == k.val && t.val == '0') {
                        if ((t.typ == EnumToken.NumberTokenType && isLength(k)) ||
                            (k.typ == EnumToken.NumberTokenType && isLength(t)) ||
                            (isLength(k) || isLength(t))) {
                            value.splice(i, 1);
                            continue;
                        }
                    }
                    if (eq(t, k)) {
                        value.splice(i, 1);
                        continue;
                    }
                    break;
                }
            }
            iterator = [{
                    typ: 5 /* NodeType.DeclarationNodeType */,
                    nam: this.config.shorthand,
                    val: values.reduce((acc, curr) => {
                        if (curr.length > 1) {
                            const k = curr.length * 2 - 1;
                            let i = 1;
                            while (i < k) {
                                curr.splice(i, 0, { typ: EnumToken.WhitespaceTokenType });
                                i += 2;
                            }
                        }
                        if (acc.length > 0) {
                            acc.push({ typ: EnumToken.LiteralTokenType, val: this.config.separator });
                        }
                        acc.push(...curr);
                        return acc;
                    }, [])
                }][Symbol.iterator]();
            // return {
            //     next() {
            //
            //         return iterator.next();
            //     }
            // }
        }
        return iterator;
        // return {
        //     next() {
        //
        //         return iterator.next();
        //     }
        // }
    }
}

export { PropertySet };
