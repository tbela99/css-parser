import {NodeType, Token} from "./index";

export interface PropertyType {

    shorthand: string;
}

export interface ShorthandPropertyType {

    shorthand: string;
    properties: string[];
    types: string[];
    multiple: boolean;
    separator: string;
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
    multiple?: boolean;
    separator?: Token;
    properties: {
        [property: string]: PropertyMapType;
    }
}

export interface ShorthandProperties {
    types: NodeType[];
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