import {EnumToken} from "../lib";

export interface PropertyType {

    shorthand: string;
}

export interface ShorthandPropertyType {

    shorthand: string;
    map?: string;
    properties: string[];
    types: string[];
    multiple: boolean;
    separator: {
        typ:'string',
        val: string
    };
    keywords: string[];
}

export interface PropertySetType {

    [key: string]: PropertyType | ShorthandPropertyType;
}

export interface PropertyMapType {

    default: string[];
    types: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    prefix?: {
        typ: 'Literal',
        val: string
    };
    previous?: string;
    separator?: {

        typ: 'Comma'
    };
    constraints?: {
        [key: string]: {
            [key: string]: any;
        }
    };
    mapping?: {
        [key: string]: any
    }
}

export interface ShorthandMapType {

    shorthand: string;
    pattern: string;
    keywords: string[];
    default: string[];
    mapping?: string[];
    multiple?: boolean;
    separator?: Token;
    set?: Record<string, string[]>
    properties: {
        [property: string]: PropertyMapType;
    }
}

export interface ShorthandProperties {
    types: EnumToken[];
    default: string[];
    keywords: string[];
    required?: boolean;
    multiple?: boolean;
    constraints?: Array<any>;
    mapping?: {
        [key: string]: any;
    };
    validation?: {
        [key: string]: any;
    };
    prefix?: string;
}

export interface ShorthandDef {
    shorthand: string;
    pattern: string;
    keywords: string;
    defaults: string[];
    multiple?: boolean;
    separator?: string;
}

export interface ShorthandType {
    shorthand: string;
    properties: ShorthandProperties;
}