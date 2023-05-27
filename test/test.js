
const cssparser = require(__dirname + '/../dist/index.js');
const {readFileSync} = require("fs");

const {ast} = cssparser.parse(readFileSync(__dirname + '/files/css/tailwind.css').toString());
console.debug(cssparser.render(ast, {compress: true}))