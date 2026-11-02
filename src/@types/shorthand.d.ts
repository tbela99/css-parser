import { EnumToken } from "../lib/ast/types.ts";

/**
 * shorthand property type
 */
export interface PropertyType {
    /**
     * shorthand name
     */
    shorthand: string;
}

/**
 * single property
 */
export interface SinglePropertyType {
    /**
     * keyof shorthand property type
     */
    typ: keyof EnumToken;
    /**
     * value
     */
    val: string | number;
}

/**
 * shorthand property map
 */
export interface SinglePropertyTypeMapping {
    /**
     * shorthand pattern
     */
    pattern?: string[][];
    /**
     * shorthand mappings
     */
    mapping: Record<string, SinglePropertyType>;
}
/**
 * shorthand configuration
 */
export interface ShorthandPropertyType {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * mapped shorthand property
     */
    map?: string;
    /**
     * property names
     */
    properties: string[];
    /**
     * property types
     */
    types: string[];
    /**
     * allow multiple values
     */
    multiple: boolean;
    /**
     * values separator
     */
    separator: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val: string;
    };
    /**
     * value separator
     */
    valueSeparator?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val: string;
    };
    /**
     * keywords
     */
    keywords: string[];
}

/**
 * shorthand property set. a set of identical properties such as `margin`
 */
export interface PropertySetType {
    /**
     * shorthand property definition
     */
    [key: string]: PropertyType | ShorthandPropertyType;
}

/**
 * mapped shorthand property. a set of different properties such as `font`
 */
export interface PropertyMapType {
    /**
     * default values
     */
    default: string[];
    /**
     * property types
     */
    types: string[];
    /**
     * keywords
     */
    keywords: string[];
    /**
     * required
     */
    required?: boolean;
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * property has a prefix
     */
    prefix?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val: string;
    };
    /**
     * previous property
     */
    previous?: string;
    /**
     * separator
     */
    separator?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
    };
    /**
     * property constraints
     */
    constraints?: {
        /**
         * property constraints
         */
        [key: string]: {
            /**
             * property constraints
             */
            [key: string]: any;
        };
    };
    /**
     * values mapping
     */
    mapping?: Record<string, string>;
}

/**
 * mapped shorthand definition
 */
export interface ShorthandMapType {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * shorthand pattern
     */
    pattern: string;
    /**
     * shorthand keywords
     */
    keywords: string[];
    /**
     * default values
     */
    default: string[];
    /**
     * values mapping
     */
    mapping?: Record<string, string>;
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * shorthand values separator
     */
    separator?: {
        /**
         * token type
         */
        typ: keyof EnumToken;
        /**
         * token value
         */
        val?: string;
    };
    /**
     * shorthand property sets
     */
    set?: Record<string, string[]>;
    /**
     * shorthand properties
     */
    properties: {
        /**
         * shorthand properties
         */
        [property: string]: PropertyMapType;
    };
}

/**
 * shorthand properties
 */
export interface ShorthandProperties {
    /**
     * property types
     */
    types: EnumToken[];
    /**
     * default values
     */
    default: string[];
    /**
     * keywords
     */
    keywords: string[];
    /**
     * required
     */
    required?: boolean;
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * propery constraints
     */
    constraints?: Array<any>;
    /**
     * values mapping
     */
    mapping?: {
        /**
         * values mapping
         */
        [key: string]: any;
    };
    /**
     * property validation
     */
    validation?: {
        /**
         * property validation
         */
        [key: string]: any;
    };
    /**
     * property has a prefix
     */
    prefix?: string;
}

/**
 * shorthand definition
 */
export interface ShorthandDef {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * shorthand pattern
     */
    pattern: string;
    /**
     * shorthand keywords
     */
    keywords: string;
    /**
     * default values
     */
    defaults: string[];
    /**
     * allow multiple values
     */
    multiple?: boolean;
    /**
     * values separator
     */
    separator?: string;
}

/**
 * shorthand type
 */
export interface ShorthandType {
    /**
     * shorthand name
     */
    shorthand: string;
    /**
     * shorthand properties
     */
    properties: ShorthandProperties;
}
