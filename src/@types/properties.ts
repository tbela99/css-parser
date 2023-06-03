export interface PropertyType {

    shorthand: string;
}

export interface ShorthandPropertyType {

    shorthand: string;
    properties: string[];
    types: string[];
    separator: string;
    keywords: string[];
}

export interface PropertySetType {

    [key: string]: PropertyType | ShorthandPropertyType
}