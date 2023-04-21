import atRules from "./data/at-rules.json" assert {type: "json"};
import functions from "./data/functions.json" assert {type: "json"};
import properties from "./data/properties.json" assert {type: "json"};
import syntaxes from "./data/syntaxes.json" assert {type: "json"};
import {writeFile} from "fs/promises";
import {dirname} from "path";
import {parse} from "./parse";
import {SyntaxRuleSet, ValidationRule, ValidationRuleDescriptor, ValidationRuleSet} from "../../src/@types";

function stripComments(syntax: string): string {

    const parts: string[] = syntax.split(/\/\*[\s\S]+?\*\//gs);

    if (parts.length == 1) {

        return syntax;
    }

    return parts.filter(e => e !== '').join(' | ');
}
function generate(ruleset:SyntaxRuleSet): ValidationRuleSet {

    return Object.entries(ruleset).reduce((acc, entry) => {

        if (entry[0].includes(' ')) {

            return acc;
        }

        const record: ValidationRule = <ValidationRule>{};

        record['syntax'] = parse(stripComments(entry[1].syntax));
        record['pattern'] = entry[1].syntax;

        if ('descriptors' in entry[1]) {

            record['descriptors'] = Object.entries(<{[key: string]: {syntax: string, initial?: string}}>entry[1].descriptors).reduce((acc, curr) => {

                acc[curr[0]] = {
                    syntax: parse(curr[1].syntax)
                };

                if ('initial' in curr[1] && curr[1].initial != 'n/a (required)') {

                    acc[curr[0]].initial = curr[1].initial;
                }

                return acc;
            }, <{[key: string]: ValidationRuleDescriptor}>{});
        }

        acc[entry[0]] = record;

        return acc;
    }, <ValidationRuleSet>{});
}

// @ts-ignore
const rules: {[key: string]: ValidationRuleSet} = <{[key: string]: ValidationRuleSet}>Object.entries({
    atRules,
    functions,
    properties,
    syntaxes
}).reduce((acc, curr) => {

    // @ts-ignore
    acc[<string>curr[0]] = generate(curr[1]);

     return acc;
}, <{[key: string]: ValidationRuleSet}>{});

//
await writeFile(`${dirname(new URL(import.meta.url).pathname)}/../../src/validator/rules.json`, JSON.stringify(rules, null, 1));
