import {ValidationAction} from "../lib";

export declare interface ErrorDescription {

    // drop rule or declaration | fix rule or declaration
    action: ValidationAction;
    message: string;
    location?: {
        src: string,
        lin: number,
        col: number;
    } | null;
    error?: Error;
}

export declare interface ValidationSyntaxNode {
    syntax: string;
    ast: ValidationToken[];

}

export declare interface ValidationConfiguration {

    declarations: Record<string, ValidationSyntaxNode>;
    functions: Record<string, ValidationSyntaxNode>;
    syntaxes: Record<string, ValidationSyntaxNode>;
}