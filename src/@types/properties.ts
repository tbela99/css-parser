export interface PropertyType {

    shorthand: string;
}

export interface ShorthandPropertyType {

    shorthand: string;
    properties: string[];
    types: string[];
}

export interface PropertySetType {

    [key: string]: PropertyType | ShorthandPropertyType
}