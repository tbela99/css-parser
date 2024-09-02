
export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('selector validation', function () {

        it('selector validation #1', function () {
            return transform(`
#404 {
    --animate-duration: 1s;
}

.s, #404 {
    --animate-duration: 1s;
}

.s [type="text" {
    --animate-duration: 1s;
}

.s [type="text"]] {
    --animate-duration: 1s;
}

.s [type="text"] {
    --animate-duration: 1s;
}

.s [type="text" i] {
    --animate-duration: 1s;
}

.s [type="text" s] {
    --animate-duration: 1s;
}

.s [type="text" b] {
    --animate-duration: 1s;
}

.s [type="text" b], {
    --animate-duration: 1s;
}

.s [type="text" b]+ {
    --animate-duration: 1s;
}

.s [type="text" b]+ b {
    --animate-duration: 1s;
}

.s [type="text" i]+ b {
    --animate-duration: 1s;
}


.s [type="text"())] {
    --animate-duration: 1s;
}
.s() {
    --animate-duration: 1s;
}
.s:focus {
    --animate-duration: 1s;
}

`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.s:is([type=text],[type=text i],[type=text s],[type=text i]+b,:focus) {
 --animate-duration: 1s
}`));
        });

        it('keyframe selector validation #2', function () {
            return transform(`

    @-webkit-keyframes flash {
            from,
            50%,
                to {
                opacity: 1;
            }

            25%,
            75% {
                opacity: 0;
            }
        }

`).then(result => expect(render(result.ast, {minify: false}).code).equals(`@-webkit-keyframes flash {
 from,50%,to {
  opacity: 1
 }
 25%,75% {
  opacity: 0
 }
}`));
        });

        it('selector validation #3', function () {
            return transform(`
html, body, div, span, applet, object, iframe,
            h1, h2, h3, h4, h5, h6, p, blockquote, pre,
            a, abbr, acronym, address, big, cite, code,
            del, dfn, em, img, ins, kbd, q, s, samp,
            small, strike, strong, sub, sup, tt, var,
        b, u, i, center,
            dl, dt, dd, ol, ul, li,
            fieldset, form, label, legend,
            table, caption, tbody, tfoot, thead, tr, th, td,
            article, aside, canvas, details, embed,
            figure, figcaption, footer, header, hgroup,
            menu, nav, output, ruby, section, summary,
            time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
        }
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video {
 margin: 0;
 padding: 0;
 border: 0;
 font: inherit;
 vertical-align: baseline
}`));
        });



    });
}