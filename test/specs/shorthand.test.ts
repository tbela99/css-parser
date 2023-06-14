import {expect} from "@esm-bundle/chai";
import {parse, render} from "../../src";
import {dirname} from "path";

const dir = dirname(new URL(import.meta.url).pathname) + '/../files';

const marginPadding = `

.test {
margin: 10px 0 10px 5px;
top: 4px;
padding: 2px 0 0 0;
padding-left: 25px;
padding-right: 25px;
padding-top: 25px;
}

.test {
margin-right: 0px;
padding-right: 0;
padding-top: 0
}

.test {

margin-bottom: 0px;
text-align: justify;
}

.test {

padding-left: 0px;
margin-top: 0px;
`;

const borderRadius1 = `

.test {
border-radius: 4px 3px 6px / 2px 4px;
border-top-left-radius: 4px 5px;
`;

const borderRadius2 = `

.test {border-top-left-radius: 4px 2px;
border-top-right-radius: 3px 4px;
border-bottom-right-radius: 6px 2px;
border-bottom-left-radius: 3px 4px;
`;

const borderRadius3 = `

.test input[type="text"] {

    border-bottom-width: 2px;
    border-left-width: thin;;
    border-right-width: thin;
    border-top-width:2px;;;

`;

const borderColor = `

.test input[type="text"] {
border-top-color: gold;
border-right-color: red;
border-bottom-color: gold;
border-left-color: red;
`;

const outline1 = `

a:focus {
  outline: medium none; }

a:focus {
  outline-color: currentColor; }

`;

const outline2 = `

a:focus {
  outline: thin #dedede; }

a:focus {
  outline-style: dotted; }

`;

const inset1 = `

a:focus {    
top: auto;
    bottom: auto;
    left: auto;
    right: auto; }

`;

const font1 = `
html, body {
    font-family: Verdana, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    font-weight: bold;
}
`;

const font2 = `
samp {
font: small-caps bold 24px/1 sans-serif;
  font-family: monospace, serif;
  font-size: 1em; 
  line-height: 1.19em;
  }
`;

const background1 = `
p {

  background: url(images/bg.gif) no-repeat left top;
  background-color: red;
}

`;

describe('shorthand', function () {

    it('margin padding', async function () {

        expect(render(parse(marginPadding, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('.test{margin:0 0 0 5px;top:4px;padding:0;text-align:justify}')
    });

    it('border-radius #1', async function () {

        expect(render(parse(borderRadius1, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('.test{border-radius:4px 3px 6px/5px 4px 2px}')
    });

    it('border-radius #2', async function () {

        expect(render(parse(borderRadius2, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('.test{border-radius:4px 3px 6px/2px 4px}')
    });

    it('border-width #3', async function () {

        expect(render(parse(borderRadius3, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('.test input[type=text]{border-width:2px thin}')
    });

    it('border-color #4', async function () {

        expect(render(parse(borderColor, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('.test input[type=text]{border-color:gold red}')
    });

    it('outline #5', async function () {

        expect(render(parse(outline1, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('a:focus{outline:0}')
    });

    it('outline #6', async function () {

        expect(render(parse(outline2, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('a:focus{outline:#dedede dotted thin}')
    });

    it('inset #6', async function () {

        expect(render(parse(inset1, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('a:focus{inset:auto}')
    });

    it('font #7', async function () {

        expect(render(parse(font1, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('html,body{font:700 15px/1.5 Verdana,sans-serif}')
    });

    it('font #8', async function () {

        expect(render(parse(font2, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('samp{font:700 1em/1.19em small-caps monospace,serif}')
    });

    it('background #9', async function () {

        expect(render(parse(background1, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true}).code).equals('p{background:no-repeat red url(images/bg.gif)}')
    });
});