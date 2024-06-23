import {
    cleanup,
    parseAllSyntaxes,
    parseDeclarationsSyntax,
    parseFunctionsSyntax,
    parseSyntax
} from "../src/lib/validation/parser";


console.debug(JSON.stringify({

        declarations: await parseDeclarationsSyntax(),
        functions: await parseFunctionsSyntax(),
        syntaxes: await parseAllSyntaxes()
    }, null, 1)
);

// console.debug(
//     JSON.stringify(parseSyntax('normal | bold | <number [1,1000]>'), null, 1)
// );

