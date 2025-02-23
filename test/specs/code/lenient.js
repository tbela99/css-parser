export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('Lenient validation', function () {
        it('lenient at-rules and pseudo classes #1', function () {
            const css = `

@unknown {
    
    height: 100px;
    width: 100px;
}

@unknown :unknown {
    
    height: 100px;
    width: 100px;
}

 :unknown {
    
    height: 100px;
    width: 100px;
}


@media screen {
        
    .foo:-webkit-any-link():not(:hover) {
            height: calc(100px * 2/ 15);
    }
}
`;
            return transform(css, {
                beautify: true
            }).then((result) => expect(result.code).equals(`@unknown {
 height: 100px;
 width: 100px
}
@unknown :unknown {
 height: 100px;
 width: 100px
}
:unknown {
 height: 100px;
 width: 100px
}`));
        });
    });

}