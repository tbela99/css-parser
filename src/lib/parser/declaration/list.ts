import type {
    AstDeclaration,
    AstNode,
    IdentToken,
    NumberToken,
    PropertiesConfig,
    PropertyListOptions,
    ShorthandMapType,
    ShorthandPropertyType,
    SinglePropertyTypeMapping,
    Token,
} from "../../../@types/index.d.ts";
import { PropertySet } from "./set.ts";
import { getConfig } from "../utils/config.ts";
import { PropertyMap } from "./map.ts";
import { parseString } from "../parse.ts";
import { EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import { getParsedSyntax } from "../../validation/config.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import { ValidationMatch } from "../../validation/types.js";
import { createValidationContext, matchAllSyntax } from "../../validation/match.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { definedPropertySettings } from "../../syntax/constants.ts";

const config: PropertiesConfig = getConfig();

export class PropertyList {
    protected options: PropertyListOptions = { removeDuplicateDeclarations: true, computeShorthand: true };
    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;

    constructor(options: PropertyListOptions = {}) {
        this.options = options;
        this.declarations = new Map<string, AstNode | PropertySet | PropertyMap>();
    }

    set(nam: string, value: string | Token[]) {
        return this.add({
            typ: EnumToken.DeclarationNodeType,
            nam,
            val: Array.isArray(value) ? value : parseString(String(value)),
        });
    }

    add(...declarations: AstNode[]) {
        let name: string | null;
        let syntaxRules: ValidationToken[] | null = null;
        let result: ValidationMatch;

        for (const declaration of declarations) {
            name =
                declaration.typ != EnumToken.DeclarationNodeType
                    ? null
                    : (declaration as AstDeclaration).nam.toLowerCase();

            if (declaration.state == EnumAstNodeStatus.Unvalidated) {
                // validate declaration
            }

            if (
                (declaration as AstDeclaration).state == EnumAstNodeStatus.Invalid ||
                (declaration as AstDeclaration).state == EnumAstNodeStatus.Unknown ||
                (declaration as AstDeclaration).state == EnumAstNodeStatus.ValidationFailed ||
                declaration.typ != EnumToken.DeclarationNodeType ||
                "composes" === name ||
                (typeof this.options.removeDuplicateDeclarations === "string" &&
                    this.options.removeDuplicateDeclarations === name) ||
                (Array.isArray(this.options.removeDuplicateDeclarations)
                    ? this.options.removeDuplicateDeclarations.includes((<AstDeclaration>declaration).nam)
                    : !this.options.removeDuplicateDeclarations)
            ) {
                this.declarations.set(Number(Math.random().toString().slice(2)).toString(36), declaration);
                continue;
            }

            if (!this.options.computeShorthand) {
                this.declarations.set((<AstDeclaration>declaration).nam, declaration);
                continue;
            }

            if (declaration.state == EnumAstNodeStatus.Unvalidated) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, declaration.nam.toLowerCase());

                if (syntaxRules != null) {
                    result = matchAllSyntax(syntaxRules, createValidationContext(declaration.val), this.options);

                    Object.defineProperty(declaration, "state", {
                        ...definedPropertySettings,
                        value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.ValidationFailed,
                    });
                }
            }

            // do not compute shorthand for invalid declarations
            if (declaration.state !== EnumAstNodeStatus.Validated) {
                this.declarations.set(declaration.nam, declaration);
                return this;
            }

            let propertyName: string = <string>(<AstDeclaration>declaration).nam;
            let shortHandType: "map" | "set" | "single";
            let shorthand: any = null;

            if (propertyName in config.properties) {
                // @ts-ignore
                if ("map" in <ShorthandPropertyType>config.properties[propertyName]) {
                    shortHandType = "map";
                    // @ts-ignore
                    shorthand = <string>config.properties[propertyName].map;
                } else {
                    shortHandType = "set";
                    // @ts-ignore
                    shorthand = <string>config.properties[propertyName].shorthand;
                }
            } else if (propertyName in config.map) {
                shortHandType = "map";
                // @ts-ignore
                shorthand = <string>config.map[propertyName].shorthand;
            } else if (propertyName in config.property) {
                shortHandType = "single";
                // @ts-ignore
                shorthand = <string>config.property[propertyName];
            }

            // @ts-ignore
            if (shortHandType == "map") {
                // @ts-ignore
                if (!this.declarations.has(shorthand)) {
                    // @ts-ignore
                    this.declarations.set(shorthand, new PropertyMap(<ShorthandMapType>config.map[shorthand]));
                }

                // @ts-ignore
                (<PropertyMap>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            }

            // @ts-ignore
            else if (shortHandType == "set") {
                // @ts-ignore

                if (!this.declarations.has(shorthand)) {
                    // @ts-ignore
                    this.declarations.set(
                        // @ts-ignore
                        shorthand,
                        // @ts-ignore
                        new PropertySet(<ShorthandPropertyType>config.properties[shorthand]),
                    );
                }

                // @ts-ignore
                (<PropertySet>this.declarations.get(shorthand)).add(<AstDeclaration>declaration);
            } else {
                if (shorthand != null) {
                    this.mapValues(declaration as AstDeclaration, shorthand as SinglePropertyTypeMapping);
                }

                this.declarations.set(propertyName, declaration);
            }
        }

        return this;
    }

    mapValues(declaration: AstDeclaration, mapping: SinglePropertyTypeMapping) {
        let name: string | null;

        let values = declaration.val;

        if (mapping.pattern != null) {
            // match pattern
            for (const patterns of mapping.pattern) {
                const set: Set<Token> = new Set(
                    values.filter(
                        (v) => v.typ !== EnumToken.CommentTokenType && v.typ !== EnumToken.WhitespaceTokenType,
                    ),
                );
                const val: Token[] = [];

                for (const pattern of patterns) {
                    switch (pattern) {
                        case "<length>":
                            for (const v of set) {
                                if (
                                    v.typ === EnumToken.LengthTokenType ||
                                    (v.typ === EnumToken.NumberTokenType && (v as NumberToken).val === 0)
                                ) {
                                    val.push(v);
                                    set.delete(v);
                                }
                            }

                        default: {
                            for (const v of set) {
                                if (v.typ === EnumToken.IdenTokenType) {
                                    const value: string = (v as IdentToken).val.toLowerCase();

                                    if (value === pattern || new RegExp(`(^|\|)${pattern}(\||$)`).test(value)) {
                                        val.push(v);
                                        set.delete(v);
                                    }
                                }
                            }
                        }
                    }
                }

                if (set.size === 0) {
                    values = val.reduce((acc: Token[], curr: Token): Token[] => {
                        if (acc.length > 0) {
                            acc.push({ typ: EnumToken.WhitespaceTokenType });
                        }

                        acc.push(curr);

                        return acc;
                    }, [] as Token[]);

                    break;
                }
            }
        }

        for (const val of declaration.val) {
            if (val.typ === EnumToken.IdenTokenType) {
                name = (val as IdentToken).val.toLowerCase();

                if (mapping.mapping[name] != null) {
                    // @ts-expect-error
                    Object.assign(val, mapping.mapping[name], { typ: EnumToken[mapping.mapping[name].typ] });
                }
            }
        }

        if (values != declaration.val) {
            declaration.val.length = 0;
            declaration.val.push(...values);
        }
    }

    [Symbol.iterator]() {
        let iterator: IterableIterator<AstNode | PropertySet | PropertyMap> = this.declarations.values();
        const iterators: Array<IterableIterator<AstNode | PropertySet | PropertyMap>> = [];

        return {
            next() {
                let value: IteratorResult<AstNode | PropertySet | PropertyMap> = iterator.next();

                while (
                    (value.done && iterators.length > 0) ||
                    value.value instanceof PropertySet ||
                    value.value instanceof PropertyMap
                ) {
                    if (value.value instanceof PropertySet || value.value instanceof PropertyMap) {
                        iterators.unshift(iterator);

                        // @ts-ignore
                        iterator = value.value[Symbol.iterator]();
                        value = iterator.next();
                    }

                    if (value.done && iterators.length > 0) {
                        iterator = <IterableIterator<AstNode | PropertySet | PropertyMap>>iterators.shift();
                        value = iterator.next();
                    }
                }

                return <{ value: AstNode; done: boolean }>value;
            },
        };
    }
}
