import {expect} from "@esm-bundle/chai";
import {TransformResult} from "../../src/@types";
import {transform} from "../../src";
import {dirname} from "path";
import {readFile} from "fs/promises";

const import2 = `@import 'https://maxst.icons8.com/vue-static/landings/line-awesome/font-awesome-line-awesome/css/all.min.css'`;

describe('process import', function () {

    it('process import #3',  function () {

        return readFile(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-line-awesome.css', {encoding: 'utf-8'}).
        then(file => transform(import2, {
            compress: true,
            resolveImport: true
        }).then((result: TransformResult) => expect(result.code).equals(file.trimEnd())))

    });
});