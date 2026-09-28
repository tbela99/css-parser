---
title: Prefix Removal
group: Documents
category: Guides
---

## Prefix Removal

Vendor prefixes can be removed by enabling the `removePrefix` flag.

```ts   

import {transformSync} from '@tbela99/css-parser';

const css = `
::-webkit-input-placeholder {
    color: gray;
  }
  
  ::-moz-placeholder {
    color: gray;
  }
  
  :-ms-input-placeholder {
    color: gray;
  }
  
  ::-ms-input-placeholder {
    color: gray;
  }
  
  ::placeholder {
    color: gray;
  }
  
  @supports selector(:-ms-input-placeholder) {
  
  
  :-ms-input-placeholder {
    color: gray;
  }
  }

@media (-webkit-min-device-pixel-ratio: 2), (-o-min-device-pixel-ratio: 2/1), (min-resolution: 2dppx) {
    .image {
      background-image: url(image@2x.png);
    }
  
  }
  
  
  @-webkit-keyframes bar {
  
  from, 0% {
  
  height: 10px;
  }
  }
  
  @keyframes bar {
  
  from, 0% {
  
  height: 10px;
  }
  }
  .example {
  
      -moz-animation: bar 1s infinite;
      display: -ms-grid;
      display: grid;
      -webkit-transition: all .5s;
      -o-transition: all .5s;
      transition: all .5s;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none;
      background: -o-linear-gradient(top, white, black);
      background: -webkit-gradient(linear, left top, left bottom, from(white), to(black));
      background: linear-gradient(to bottom, white, black);
  }
  
  .site{
     display:-ms-grid;
     display:grid;   
     -ms-grid-columns:2fr 1fr;
     grid-template-columns:2fr 1fr;
     grid-template-areas:"header header"
                         "title sidebar"
                         "main sidebar"
                         "footer footer";
  }
  .site > *{padding:30px; color:#fff; font-size:20px;}
  .mastheader{
     -ms-grid-row:1;
     -ms-grid-column:1;
     -ms-grid-column-span:2;
  }
  .page-title{
     -ms-grid-row:2;
     -ms-grid-column:1;
  }
  .main-content{
     -ms-grid-row:3;
     -ms-grid-column:1;
  }
  .sidebar{
     -ms-grid-row:2;
     -ms-grid-row-span:2;
     -ms-grid-column:2;
  }
  .footer{
     -ms-grid-row:4;
     -ms-grid-column:1;
     -ms-grid-column-span:2;
  }

`;
const result = await transformSync(css, {

            beautify: true,
            removePrefix: true
        }
);

console.log(result.code);
```

Output:

```css
::placeholder {
 color: grey
}
@supports selector(::placeholder) {
 ::placeholder {
  color: grey
 }
}
@media (resolution>=2x) {
 .image {
  background-image: url(image@2x.png)
 }
}
@keyframes bar {
 0% {
  height: 10px
 }
}
.site,.example {
 display: grid
}
.site {
 grid-template-columns: 2fr 1fr;
 grid-template-areas: "header header""title sidebar""main sidebar""footer footer"
}
.example {
 animation: bar 1s infinite;
 transition: .5s;
 user-select: none;
 background: linear-gradient(#fff,#000)
}
.site>* {
 padding: 30px;
 color: #fff;
 font-size: 20px
}
.mastheader {
 grid-area: 1/1/auto/2
}
.page-title {
 grid-area: 2/1/auto/auto
}
.main-content {
 grid-area: 3/1/auto/auto
}
.sidebar {
 grid-area: 2/2/2/auto
}
.footer {
 grid-area: 4/1/auto/2
}
```

------
[← Syntax Lowering](./syntax-lowering.md) | [Ast Manipulation →](./ast.md) 