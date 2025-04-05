
export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('malformed tokens', function () {

        it('unclosed string #1', async function () {
            const css = `
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css`;

            return readFile(dirname(new URL(import.meta.url).pathname) + '/../../files/result/font-awesome-all.css', {encoding: 'utf-8'}).
            then(content => transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(content)));
        });

        it('bad string #2', async function () {
            const css = `
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css
;`;

            return transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(''));
        });

        it('bad string #3', async function () {
            const css = `
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css
`;

            return transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(''));
        });

        it('bad string #4', async function () {
            const css = `
        @charset "utf-8";
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css
`;

            return transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(''));
        });

        it('bad comment #5', async function () {
            const css = `
        
.search-and-account a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
/* secret
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`.search-and-account a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
}`));
        });

        it('bad comment #6', async function () {
            const css = `
        
#div a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
<!-- secret
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`#div a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
}`));
        });

        it('bad url() #7', async function () {
            const css = `
       
.search-and-account a svg {
 filter: url( 
 "230,241,245 '
 ;);
 
 a {color: pink;}
/* secret
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`.search-and-account a svg {
 filter: url();
 a {
  color: pink
 }
}`));
        });

        it('bad url() #8', async function () {
            const css = `
       
.search-and-account a svg {
 filter: url( 
 "230,241,245 '
 );
 
 a {color: pink;}
/* secret
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`.search-and-account a svg {
 filter: url()
}`));
        });

        it('bad comment #9', async function () {
            const css = `
       
<!-- secret -->
.search-and-account a svg {
<!-- secret -->
 filter: url( 
 "230,241,245 '
 ;);
 
 a {color: pink;}
/* secret
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: false,
                preserveLicense: true
            }).code).equals(`<!-- secret -->
.search-and-account a svg {
 filter: url();
 a {
  color: pink
 }
}`));
        });

        it('bad declaration #10', async function () {
            const css = `
       
a {
color: 
;
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: false,
                preserveLicense: true
            }).code).equals(``));
        });

        it('bad declaration #11', async function () {
            const css = `
      
a {
color: hwb(3.1416rad 0% 0% / 100%);
transform: rotate(3.1416rad);
color: 
;
`;

            return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: false,
                preserveLicense: true
            }).code).equals(`a {
 color: cyan;
 transform: rotate(180deg)
}`));
        });
    });

}