import {expect} from "@esm-bundle/chai";
import {parse, render, transform} from "../../src";
import {dirname} from "path";

const dir = dirname(new URL(import.meta.url).pathname) + '/../files';

const options = {
    compress: true,
    removeEmpty: true
};

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

const background2 = `
a:focus {

background: left 5% / 15% 60% repeat-x url("../../media/examples/star.png"); 
background-size: cover auto;
}

`;

const background3 = `

a{
background: center / contain no-repeat url("../../media/examples/firefox-logo.svg"),            
#eee 35% url("../../media/examples/lizard.png");
background-size: cover auto, contain;

}
`;
describe('shorthand', function () {

    it('margin padding', async function () {

        expect(transform(marginPadding, options).code).equals('.test{margin:0 0 0 5px;top:4px;padding:0;text-align:justify}')
    });

    it('border-radius #1', async function () {

        expect(transform(borderRadius1, options).code).equals('.test{border-radius:4px 3px 6px/5px 4px 2px}')
    });

    it('border-radius #2', async function () {

        expect(transform(borderRadius2, options).code).equals('.test{border-radius:4px 3px 6px/2px 4px}')
    });

    it('border-width #3', async function () {

        expect(transform(borderRadius3, options).code).equals('.test input[type=text]{border-width:2px thin}')
    });

    it('border-color #4', async function () {

        expect(transform(borderColor, options).code).equals('.test input[type=text]{border-color:gold red}')
    });

    it('outline #5', async function () {

        expect(transform(outline1, options).code).equals('a:focus{outline:0}')
    });

    it('outline #6', async function () {

        expect(transform(outline2, options).code).equals('a:focus{outline:#dedede dotted thin}')
    });

    it('inset #6', async function () {

        expect(transform(inset1, options).code).equals('a:focus{inset:auto}')
    });

    it('font #7', async function () {

        expect(transform(font1, options).code).equals('html,body{font:700 15px/1.5 Verdana,sans-serif}')
    });

    it('font #8', async function () {

        expect(transform(font2, options).code).equals('samp{font:700 1em/1.19em small-caps monospace,serif}')
    });

    it('background #9', async function () {

        expect(transform(background1, options).code).equals('p{background:no-repeat red url(images/bg.gif)}')
    });

    it('background #10', async function () {

        expect(transform(background2, options).code).equals('a:focus{background:repeat-x url(../../media/examples/star.png)0 5%/cover}')
    });

    it('background #11', async function () {

        expect(transform(background3, options).code).equals('a{background:no-repeat url(../../media/examples/firefox-logo.svg)50%/cover,#eee url(../../media/examples/lizard.png)35%/contain}')
    });
});