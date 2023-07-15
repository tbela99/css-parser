import {expect} from "@esm-bundle/chai";
import {TransformResult} from "../../src/@types";
import {transform} from "../../src";
import {dirname} from "path";
import {readFile} from "fs/promises";

const import1 = `@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css';
`;

describe('process import', function () {

    it('process import #2', async function () {

        return readFile(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-all.css', {encoding: 'utf-8'}).
        then(file => transform(import1, {
            compress: false,
            resolveImport: true
        }).then((result: TransformResult) => expect(result.code).equals(file.trimEnd())))

    });
});

