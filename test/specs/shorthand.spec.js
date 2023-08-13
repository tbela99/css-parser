/* generate from test/specs/shorthand.spec.ts */
import { expect as f } from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import { transform } from '../../dist/node/index.js';
import {render} from "../../dist/index.js";

const options = {
    minify: true,
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
    it('margin padding', function () {
        return transform(marginPadding, options).then(result => f(result.code).equals('.test{margin:0 0 0 5px;top:4px;padding:0;text-align:justify}'));
    });
    it('border-radius #1', function () {
        return transform(borderRadius1, options).then(result => f(result.code).equals('.test{border-radius:4px 3px 6px/5px 4px 2px}'));
    });
    it('border-radius #2', function () {
        return transform(borderRadius2, options).then(result => f(result.code).equals('.test{border-radius:4px 3px 6px/2px 4px}'));
    });
    it('border-width #3', function () {
        return transform(borderRadius3, options).then(result => f(result.code).equals('.test input[type=text]{border-width:2px thin}'));
    });
    it('border-color #4', function () {
        return transform(borderColor, options).then(result => f(result.code).equals('.test input[type=text]{border-color:gold red}'));
    });
    it('outline #5', function () {
        return transform(outline1, options).then(result => f(result.code).equals('a:focus{outline:0}'));
    });
    it('outline #6', function () {
        return transform(outline2, options).then(result => f(result.code).equals('a:focus{outline:#dedede dotted thin}'));
    });
    it('inset #6', function () {
        return transform(inset1, options).then(result => f(result.code).equals('a:focus{inset:auto}'));
    });
    it('font #7', function () {
        return transform(font1, options).then(result => f(result.code).equals('html,body{font:700 15px/1.5 Verdana,sans-serif}'));
    });
    it('font #8', function () {
        return transform(font2, options).then(result => f(result.code).equals('samp{font:700 1em/1.19em small-caps monospace,serif}'));
    });
    it('background #9', function () {
        return transform(background1, options).then(result => f(result.code).equals('p{background:no-repeat red url(images/bg.gif)}'));
    });
    it('background #10', function () {
        return transform(background2, options).then(result => f(result.code).equals('a:focus{background:repeat-x url(../../media/examples/star.png) 0 5%/cover}'));
    });
    it('background #11', function () {
        return transform(background3, options).then(result => f(result.code).equals('a{background:no-repeat url(../../media/examples/firefox-logo.svg) 50%/cover,#eee url(../../media/examples/lizard.png) 35%/contain}'));
    });

    it('border #12', function () {
        return transform(`a{
        border: #333 solid;
        border-width: 2px;
        }`, options).then(result => f(result.code).equals('a{border:#333 solid 2px}'));
    });

    it('border #13', function () {
        return transform(`
.test input[type="text"] {

border: #333 solid 1px;
    border-bottom-width: 2px;
    border-left-width: thin;;
    border-right-width: thin;
    border-top-width:2px;;;

        }`, options).then(result => f(result.code).equals('.test input[type=text]{border:#333 solid 2px thin}'));
    });

    it('border #13', function () {
        return transform(`
.test input[type="text"] {

border: #333 solid 1px;
    border-bottom-width: 2px;
    border-left-width: medium;;
    border-right-width: medium;
    border-top-width:2px;;;

        }`, options).then(result => f(result.code).equals('.test input[type=text]{border:#333 solid 2px medium}'));
    });

    it('border #14', function () {
        return transform(`
.test input[type="text"] {

border: #333 solid 1px;
    border-bottom-width: 2px;
    border-left-width: medium;;
    border-right-width: medium;
    border-top-width:2px;;;
    border-bottom-width: medium;
    border-top-width:medium;;;

        }`, options).then(result => f(result.code).equals('.test input[type=text]{border:#333 solid}'));
    });

    it('clamp & calc #15', function () {
        return transform(`
@media all {
    html {
        font-family: Blanco, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: clamp(12px, 0.8rem + 0.25vw, 20px);
        font-weight: 400;
        line-height: 1.7;
    }
}
`, options).then(result => f(result.code).equals('html{font:clamp(12px,.8rem + .25vw,20px)/1.7 Blanco,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"}'));
    });

    it('shorthand parsing #16', function () {
        return transform(`
@media all {
    html {
        font-family: Blanco, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: clamp(12px, 0.8rem + 0.25vw, 20px);
        font-weight: 400;
        line-height: 1.7;
    }
}

button.jetpack-instant-search__overlay-close {
    align-items: center;
    appearance: none;
    background-image: none;
    background-position: initial;
    background-size: initial;
    background-repeat: initial;
    background-attachment: initial;
    background-origin: initial;
    background-clip: initial;
    border-top: none;
    border-right: none;
    border-left: none;
    border-image: initial;
    border-bottom: 1px solid rgb(230, 241, 245);
    border-radius: 0px;
    box-shadow: none;
    cursor: pointer;
    display: flex;
    height: 61px;
    justify-content: center;
    line-height: 1;
    margin: 0px;
    outline: none;
    padding: 0px;
    text-decoration: none;
    text-shadow: none;
    text-transform: none;
    width: 60px;
    background-color: transparent !important;
}

`, options).then(result => f(render(result.ast, {minify: false}).code).equals(`html {
 font: clamp(12px,.8rem + .25vw,20px)/1.7 Blanco,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"
}
button.jetpack-instant-search__overlay-close {
 align-items: center;
 appearance: none;
 background-image: none;
 background-position: initial;
 background-size: initial;
 background-repeat: initial;
 background-attachment: initial;
 background-origin: initial;
 background-clip: initial;
 background-color: #0000 !important;
 border-top: none;
 border-right: none;
 border-left: none;
 border-image: initial;
 border-bottom: 1px solid #e6f1f5;
 border-radius: 0;
 box-shadow: none;
 cursor: pointer;
 display: flex;
 height: 61px;
 justify-content: center;
 line-height: 1;
 margin: 0;
 outline: none;
 padding: 0;
 text-decoration: none;
 text-shadow: none;
 text-transform: none;
 width: 60px
}`));
    });
});
