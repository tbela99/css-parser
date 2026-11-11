import type {
    AstDeclaration,
    AstNode,
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
import { EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import { getParsedSyntax } from "../../validation/config.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import { isValidDeclarationValue } from "../../validation/match.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { equalsIgnoreCase, lowercase } from "../utils/text.ts";
import type { AstArena } from "../../ast/arena.ts";
import { StructuralMemo } from "../../ast/cache.ts";
import { parseString } from "../parse.ts";

const config: PropertiesConfig = getConfig();

/**
 * Results shared by the property lists of a minification, valid for the arena they were computed for:
 * - the keys of the declarations that are not merged by name (invalid declarations, custom properties, comments, ...):
 *   identical declarations have the same key
 * - the tokens of the default values of the shorthand properties: each value is parsed once, the tokens are cloned
 *
 * @internal
 */
export class DeclarationMemo {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: DeclarationMemo = new DeclarationMemo();

    /**
     * key by structure. same equality as the structural signature: 0 and -0 are equal
     */
    private readonly keys: StructuralMemo<string> = new StructuralMemo(true);

    /**
     * parsed values: detached tokens that are cloned, never attached to the tree
     */
    private readonly parsed: Map<string, Token[]> = new Map();

    /**
     * tokens of a value, see {@link parseString}. the value is parsed once, the tokens are cloned
     * @param arena
     * @param value
     */
    parse(arena: AstArena, value: string): Token[] {
        let template: Token[] | undefined = this.parsed.get(value);

        if (template === undefined) {
            template = parseString(arena, value);
            this.parsed.set(value, template);
        }

        const tokens: Token[] = new Array(template.length);

        for (let i = 0; i < template.length; i++) {
            tokens[i] = arena.clone(template[i], true);
        }

        return tokens;
    }

    /**
     * unique key of the structure of a node (type, name, values, tokens and children). identical nodes have the same key
     * @param arena
     * @param node
     */
    key(arena: AstArena, node: AstNode): string {
        const slot: number = this.keys.token(arena, node);
        // inlined: this.keys.get(slot)
        let key: string | undefined = this.keys.values[slot];

        if (key === undefined) {
            // not a property name
            key = "\0" + slot;
            // inlined: this.keys.set(slot, key)
            this.keys.values[slot] = key;
        }

        return key;
    }
}

/**
 * true if the value of a declaration contains var(), env() or if()
 * @param arena
 * @param declaration
 */
function hasWildCardFunction(arena: AstArena, declaration: AstNode): boolean {
    for (const token of arena.tokens(declaration)) {
        if (
            arena.dataTypes[token] === EnumToken.WildCardFunctionTokenType ||
            arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Represents a list of property declarations, compute shorthand and remove duplicate declarations.
 */
export class PropertyList {
    /**
     * options
     */
    protected options: PropertyListOptions = { removeDuplicateDeclarations: true, computeShorthand: true };

    /**
     * declarations
     */
    protected declarations: Map<string, AstNode | PropertySet | PropertyMap>;

    /**
     * arena the declarations are stored in
     */
    protected arena: AstArena;

    /**
     * keys shared by the lists that use the same arena
     */
    protected memo: DeclarationMemo;

    /**
     *
     * @param arena
     * @param options
     * @param memo keys shared by the lists that use the same arena
     */
    constructor(arena: AstArena, options: PropertyListOptions = {}, memo: DeclarationMemo | null = null) {
        this.arena = arena;
        this.options = options;
        this.declarations = new Map<string, AstNode | PropertySet | PropertyMap>();
        this.memo = memo ?? new DeclarationMemo();
    }

    /**
     * add declarations
     * @param declarations node ids
     * @returns
     */
    add(declarations: Iterable<AstNode>): this {
        for (const declaration of declarations) {
            this.addDeclaration(declaration);
        }

        return this;
    }

    /**
     * add a declaration
     * @param declaration node id
     */
    addDeclaration(declaration: AstNode): this {
        let name: string | null;
        let syntaxRules: ValidationToken[] | null = null;
        const arena: AstArena = this.arena;

        name =
            arena.dataTypes[declaration] != EnumToken.DeclarationNodeType
                ? null
                : arena.strings[arena.name[declaration]];

        // do not compute shorthand for invalid declarations
        if (name == null) {
            this.declarations.set(this.memo.key(arena, declaration), declaration);
            return this;
        }
        // @functiom / result
        if (arena.flags[declaration] & EnumAstNodeStatus.Unknown && equalsIgnoreCase("result", name as string)) {
            this.declarations.set(name, declaration);
            return this;
        }

        if (
            arena.flags[declaration] &
                (EnumAstNodeStatus.Invalid | EnumAstNodeStatus.Unknown | EnumAstNodeStatus.ValidationFailed) ||
            equalsIgnoreCase("composes", name as string) ||
            (typeof this.options.removeDuplicateDeclarations === "string" &&
                this.options.removeDuplicateDeclarations === name) ||
            (Array.isArray(this.options.removeDuplicateDeclarations)
                ? this.options.removeDuplicateDeclarations.includes(name)
                : !this.options.removeDuplicateDeclarations)
        ) {
            const key: string = this.memo.key(arena, declaration);

            if (this.declarations.has(key)) {
                this.declarations.delete(key);
            }

            this.declarations.set(key, declaration);
            return this;
        }

        if (!this.options.computeShorthand) {
            this.declarations.set(name, declaration);
            return this;
        }

        if (arena.flags[declaration] & EnumAstNodeStatus.Unvalidated) {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(name));

            if (syntaxRules != null) {
                arena.flags[declaration] |=
                    (isValidDeclarationValue(arena, syntaxRules, declaration, this.options)
                        ? EnumAstNodeStatus.Validated
                        : EnumAstNodeStatus.ValidationFailed) & ~EnumAstNodeStatus.Unvalidated;
            }
        }

        // do not compute shorthand for invalid declarations
        if (!(arena.flags[declaration] & EnumAstNodeStatus.Validated)) {
            this.declarations.set(this.memo.key(arena, declaration), declaration);
            return this;
        }

        let propertyName: string = name;
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

        // the value of a shorthand that contains var(), env() or if() cannot be expanded: the longhands that follow
        // it are not merged into it. `background: var(--bg); background-clip: text`
        if (
            shorthand === name &&
            (shortHandType! == "map" || shortHandType! == "set") &&
            hasWildCardFunction(arena, declaration)
        ) {
            this.declarations.set(this.memo.key(arena, declaration), declaration);
            return this;
        }

        if (this.declarations.has(shorthand)) {
            let existing = this.declarations.get(shorthand);

            if (existing instanceof PropertySet || existing instanceof PropertyMap) {
                existing = (existing as PropertySet | PropertyMap).declarations.get(name) as AstDeclaration;
            }

            if (
                existing != null &&
                typeof existing == "number" &&
                arena.flags[existing] & EnumAstNodeStatus.ImportantDeclaration &&
                arena.flags[declaration] & ~EnumAstNodeStatus.ImportantDeclaration
            ) {
                return this;
            }
        }
        // @ts-ignore
        if (shortHandType == "map") {
            let owner: PropertyMap | PropertyList = this;

            const mapName: string =
                // @ts-ignore
                config.map[propertyName]?.map ?? config.map[shorthand]?.properties?.[propertyName]?.map;

            if (typeof mapName === "string") {
                if (!this.declarations.has(mapName)) {
                    this.declarations.set(
                        mapName,
                        // @ts-ignore
                        new PropertyMap(arena, <ShorthandMapType>config.map[mapName], this.memo),
                    );
                }

                owner = this.declarations.get(mapName) as PropertyMap;
            } else if (!this.declarations.has(shorthand)) {
                // @ts-ignore
                this.declarations.set(shorthand, new PropertyMap(arena, <ShorthandMapType>config.map[shorthand], this.memo));
            }

            if (owner == this) {
                // @ts-ignore
                owner.declarations.get(shorthand).add(declaration);
            } else {
                if (!(owner as PropertyMap).declarations.has(shorthand)) {
                    (owner as PropertyMap).declarations.set(
                        shorthand,
                        // @ts-ignore
                        new PropertyMap(arena, <ShorthandMapType>config.map[shorthand], this.memo),
                    );
                }

                // @ts-ignore
                (<PropertyMap>owner).declarations.get(shorthand).add(<AstDeclaration>declaration);
            }
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
                    new PropertySet(arena, <ShorthandPropertyType>config.properties[shorthand]),
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

        return this;
    }

    /**
     *
     * @param declaration
     * @param mapping
     */
    mapValues(declaration: AstDeclaration, mapping: SinglePropertyTypeMapping): void {
        let name: string | null;
        const arena: AstArena = this.arena;
        const declarationValues: Token[] = arena.tokens(declaration);
        let values: Token[] = declarationValues;

        if (mapping.pattern != null) {
            // match pattern
            for (const patterns of mapping.pattern) {
                const set: Set<Token> = new Set(
                    values.filter(
                        (v: Token) =>
                            arena.dataTypes[v] !== EnumToken.CommentTokenType &&
                            arena.dataTypes[v] !== EnumToken.WhitespaceTokenType,
                    ),
                );
                const val: Token[] = [];

                for (const pattern of patterns) {
                    switch (pattern) {
                        case "<length>":
                            for (const v of set) {
                                if (
                                    arena.dataTypes[v] === EnumToken.LengthTokenType ||
                                    (arena.dataTypes[v] === EnumToken.NumberTokenType && arena.numericValue[v] === 0)
                                ) {
                                    val.push(v);
                                    set.delete(v);
                                }
                            }

                        default: {
                            for (const v of set) {
                                if (arena.dataTypes[v] === EnumToken.IdenTokenType) {
                                    const value: string = arena.strings[arena.stringValue[v]].toLowerCase();

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
                            acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                        }

                        acc.push(curr);

                        return acc;
                    }, [] as Token[]);

                    break;
                }
            }
        }

        for (const val of declarationValues) {
            if (arena.dataTypes[val] === EnumToken.IdenTokenType) {
                name = arena.strings[arena.stringValue[val]].toLowerCase();

                if (mapping.mapping[name] != null) {
                    const typ: EnumToken = EnumToken[mapping.mapping[name].typ as keyof typeof EnumToken] as EnumToken;

                    arena.resetToken(val, typ, mapping.mapping[name].val);
                }
            }
        }

        if (values != declarationValues) {
            arena.setTokenList(declaration, values);
        }
    }

    /**
     *
     * @returns
     */
    [Symbol.iterator](): IterableIterator<AstNode> {
        let iterator: IterableIterator<AstNode | PropertySet | PropertyMap> = this.declarations.values();
        const iterators: Array<IterableIterator<AstNode | PropertySet | PropertyMap>> = [];

        // @ts-ignore
        return {
            next() {
                let value: IteratorResult<AstNode | PropertySet | PropertyMap> = iterator.next();

                while (
                    (value.done && iterators.length > 0) ||
                    value.value instanceof PropertySet ||
                    value.value instanceof PropertyMap
                ) {
                    if (value.value instanceof PropertySet || value.value instanceof PropertyMap) {
                        // stack of the parent iterators
                        iterators.push(iterator);

                        // @ts-ignore
                        iterator = value.value[Symbol.iterator]();
                        value = iterator.next();
                    }

                    if (value.done && iterators.length > 0) {
                        iterator = <IterableIterator<AstNode | PropertySet | PropertyMap>>iterators.pop();
                        value = iterator.next();
                    }
                }

                return <{ value: AstNode; done: boolean }>value;
            },
        };
    }
}
