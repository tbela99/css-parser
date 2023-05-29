export interface PropertyType {

    shorthand: string;
}

export class ShorthandPropertyType {

    shorthand: string;
    properties: string[];
    types: string[];
}

export interface PropertySetType {

    [key: string]: PropertyType | ShorthandPropertyType
}