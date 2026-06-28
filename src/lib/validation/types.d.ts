import type {ErrorDescription, Token} from "../../@types/index.d.ts";
import type {ValidationToken} from "./parser/types.d.ts";

/**
 * validation context
 */
export interface ValidationContext {
    /**
     * the tokens
     */
    tokens: Token[];
    /**
     * current index
     */
    index: number;

    /**
     * return the next token without consuming the current one
     * @param offset
     * @param skipWhitespace
     */
    peek(offset?: number, skipWhitespace?: boolean): Token | null;

    /**
     * return a range of tokens.
     * @param open
     * @param close 
     * @param counter
     */
    peekRange(open?: EnumToken, close?: EnumToken, counter?: number): Token[];

    /**
     * 
     * @param split 
     */
    split(split?: EnumToken): Token[][];

    /**
     * return the current token that is not consumed yet
     */
    current(): Token | null;

    /**
     * consume the current token and move to the next
     */
    next(): Token | null;

    /**
     * return tokens that are not consumed
     */
    getRemainingTokens(): Token[];
    /**
     *
     */
    last(): Token | null;

    /**
     * clone the validation context
     */
    slice(): ValidationContext;

    /**
     * consume all tokens up to the specified token
     * @param token
     */
    update(token: Token): ValidationContext;

    /**
     * returns true if all tokens are consumed. returns false otherwise
     */
    done(): boolean;

    /**
     * consume all remaining tokens
     */
    end(): ValidationContext;
}

/**
 * validation result
 */
export interface ValidationMatch {
    /**
     * validation result
     */
    success: boolean;
    /**
     * true when there is a valid syntax used for the validation.
     * if the syntax does not exist, valid is set to false
     */
    valid: boolean;
    /**
     * the validation context
     */
    context: ValidationContext;
    /**
     * the error token or false
     */
    token: Token | null;
    /**
     * the synatx that failed the validation or null
     */
    syntaxToken: ValidationToken | null;
    /**
     * validation errors
     */
    errors: ErrorDescription[];
}