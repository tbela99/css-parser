import {Position, Token} from "../../@types";

export function matchComponents(iterator: Generator<Token>, position: Position, src: string, endBlock: string[], states: Token[]): {tokens: Token[], errors: Error[]} {

    // const states: string[] = [];
    const errors: SyntaxError[] = [];
    const tokens: Token[] = [];

    const pairs = {'end-parens':'start-parens', 'block-end': 'block-start',  'attr-end': 'attr-start'};

    let result: IteratorResult<Token> = iterator.next();

    while (!result.done) {

        if (endBlock.includes(result.value.type)) {

            // console.debug({endBlock: result.value});

            tokens.push(result.value);
            break;
        }

        switch (result.value.type) {

            case 'start-parens':
            case 'block-start':
            case 'attr-start':

                states.push(result.value);
                break;

            case 'attr-end':
            case 'end-parens':
            case 'block-end':

                if (states.length == 0) {

                    errors.push(SyntaxError(`Unexpected token found: {${result.value.type}} at ${src}:${position.line}:${position.column}`));
                }

                else if (states[states.length - 1]?.type != pairs[result.value.type]) {

                    errors.push(SyntaxError(`Unexpected token: expecting {${states[states.length - 1].type.replace('start', 'end')}} found {${result.value.type}} at ${src}:${position.line}:${position.column}`));
                }

                else {

                    states.pop();
                }

                break;
        }

        tokens.push(result.value);
        result = iterator.next();
    }

    return {tokens, errors};
}