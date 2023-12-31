export declare interface ValidationConstrains {

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

export declare interface ValidationTokenGeneric extends ValidationConstrains {

    type: string;
    name?: string;
    value?: string;
}

export declare interface ValidationTokenGroup extends ValidationConstrains {

    type: 'all' | 'any' | 'children';
    value: ValidationTokenList
}

export declare interface ValidationTokenFunction extends ValidationConstrains {
    type: 'function',
    name: string,
    arguments: ValidationTokenList;
}

export declare type ValidationToken = ValidationTokenFunction | ValidationTokenGeneric | ValidationTokenGroup;
export declare type ValidationTokenList = Array<ValidationToken>;

export declare interface ValidationRuleDescriptor {

    syntax?: ValidationTokenList;
    initial?: string;
}

export declare interface ValidationRule {

    syntax: ValidationTokenList;
    pattern: string;
    descriptors?: {
        [key: string]: ValidationRuleDescriptor
    }
}

export declare interface ValidationRuleSet {

    [key: string]: ValidationRule;
}


export declare interface SyntaxRuleSet {

    syntax: string;
    descriptors?: {
        [key: string]: {

            syntax?: string
        }
    }
}
