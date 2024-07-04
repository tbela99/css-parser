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
//     JSON.stringify(parseSyntax('<display-outside>? && [ flow | flow-root ]? && list-item'), null, 1)
// );

