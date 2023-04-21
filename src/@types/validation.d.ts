export interface ValidationConstrains {

    optional?: boolean;
    multiple?: boolean;
    occurrence?: number | {

        min?: number;
        max?: number;
    }
    range?: {
        min?: number,
        max?: number;
    }
}

export interface ValidationTokenGeneric extends ValidationConstrains {

    type: string;
    name?: string;
    value?: string;
}

export interface ValidationTokenGroup extends ValidationConstrains {

    type: 'all' | 'any' | 'children';
    value: ValidationTokenList
}

export interface ValidationTokenFunction extends ValidationConstrains {
    type: 'function',
    name: string,
    arguments: ValidationTokenList;
}

export declare type ValidationToken = ValidationTokenFunction | ValidationTokenGeneric | ValidationTokenGroup;
export declare type ValidationTokenList = Array<ValidationToken>;

export interface ValidationRuleDescriptor {

    syntax?: ValidationTokenList;
    initial?: string;
}

export interface ValidationRule {

    syntax: ValidationTokenList;
    pattern: string;
    descriptors?: {
        [key: string]: ValidationRuleDescriptor
    }
}

export interface ValidationRuleSet {

    [key: string]: ValidationRule;
}


interface SyntaxRuleSet {

    syntax: string;
    descriptors?: {
        [key: string]: {

            syntax?: string
        }
    }
}
