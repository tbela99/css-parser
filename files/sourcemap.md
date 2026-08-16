---
title: Sourcemap
group: Documents
category: Guides
---


# Sourcemaps

**CSS-Parser** supports generating sourcemaps. To enable it, you must pass `sourcemap: true` or `sourcemap: 'inline`.
When the `output` parameter is provided, sourcemap file paths are resolved relative to the specified output file.

```ts

import {transform} from '@tbela99/css-parser';

const css = `
@import 'styles.css';
button {
	background: linear-gradient(
		if(media(min-width: 768px): to right; else: to bottom),
		if(style(--dark-mode): #333; else: #fff),
		if(style(--dark-mode): #000; else: #ccc)
	);
}`;

result = await transform(css, {

    beautify: true,
    sourcemap: true,
    resolveImport: true,
    output: 'dist/doc.html'
});

console.log(result.map.toJSON());
```

### Input sourcemap

If the input CSS comes from another tool, you can pass the sourcemap content to link the generated CSS positions to the original files. Additionally, if an inline sourcemap is provided with the CSS input, it will be automatically used as the input sourcemap.


```ts

import {transform} from '@tbela99/css-parser';

const css = `
table.colortable {
 width: 100%;
 text-shadow: none;
 border-collapse: collapse;
 & td {
  text-align: center;
  &.c {
   text-transform: uppercase;
   background: color(display-p3-linear 1 1 .08948)
  }
 }
 & th {
  text-align: center;
  color: color(display-p3-linear .038323 .208695 .015628);
  font-weight: 400;
  padding: 2px 3px
 }
 & td,& th {
  border: 1px solid color(display-p3-linear .695155 .700862 .720967);
  padding: 5px
 }
}
.foo {
 color: color(display-p3-linear 0 0 .91052);
 & {
  padding: 2ch;
  color: color(display-p3-linear 0 0 .91052);
  && {
   padding: 2ch
  }
 }
}
h1 {
 text-transform: uppercase
}
button {
 background: linear-gradient(color(display-p3-linear 1 1 1),color(display-p3-linear .603827 .603827 .603827));
 @media (min-width:768px) {
  background: linear-gradient(90deg,color(display-p3-linear 1 1 1),color(display-p3-linear .603827 .603827 .603827));
  @container style(--dark-mode) {
   background: linear-gradient(90deg,color(display-p3-linear .033105 .033105 .033105),color(display-p3-linear .603827 .603827 .603827));
   background: linear-gradient(90deg,color(display-p3-linear .033105 .033105 .033105),color(display-p3-linear 0 0 0))
  }
 }
 @container style(--dark-mode) {
  background: linear-gradient(color(display-p3-linear .033105 .033105 .033105),color(display-p3-linear .603827 .603827 .603827));
  background: linear-gradient(color(display-p3-linear .033105 .033105 .033105),color(display-p3-linear 0 0 0))
 }
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5lc3RlZC5jc3MiLG51bGxdLCJzb3VyY2VzQ29udGVudCI6W251bGwsIlxuQGltcG9ydCAnLi90ZXN0L25lc3RlZC5jc3MnO1xuaDEge1xuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xufVxuYnV0dG9uIHtcblx0YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KFxuXHRcdGlmKG1lZGlhKG1pbi13aWR0aDogNzY4cHgpOiB0byByaWdodDsgZWxzZTogdG8gYm90dG9tKSxcblx0XHRpZihzdHlsZSgtLWRhcmstbW9kZSk6ICMzMzM7IGVsc2U6ICNmZmYpLFxuXHRcdGlmKHN0eWxlKC0tZGFyay1tb2RlKTogIzAwMDsgZWxzZTogI2NjYylcblx0KTtcbn1cbiAgICAiXSwibWFwcGluZ3MiOiJBQUFBOzs7MEJBSUk7b0JBRUk7Ozs7Ozs7O0NBS0o7Ozs7O0NBTUE7Ozs7Ozs7O0FBTUo7MkNBRUk7OzRDQUdJOzs7Ozs7Ozs7Ozs7OztBQzFCUjs7QUNHQTs2R0NDQztvSENBQTs7Ozs7Ozs7Q0NBQSJ9 */
`;

result = await transform(css, {

    beautify: true,
    sourcemap: true,
    output: 'dist/doc.html'
});

console.log(result.map.toJSON());
```

------
[← Custom Transform](./transform.md) | [Syntax Lowering →](./syntax-lowering.md) 