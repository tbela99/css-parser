import { ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../../../dist/lib/ast/types.js";

export function run(
    describe,
    expect,
    it,
    transform,
    parse,
    render,
    dirname,
    readFile,
    resolve,
    ColorType,
    EnumToken,
    ModuleCaseTransformEnum,
    ModuleScopeEnumOptions,
    transformSync,
    parseSync,
) {
    const root = new URL(dirname(import.meta.url) + "/../../../");

    describe("css modules", function () {
        it("module #1", function () {
            return transform(
                `
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo title;
  color: white;
}
`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    goal: "goal_r6ajz",
                    "bg-indigo": "bg-indigo_gx1aq",
                    "indigo-white": "indigo-white_whlua bg-indigo_gx1aq title_qvz8o",
                    title: "title_qvz8o",
                });
                expect(result.code).equals(`.goal_r6ajz .bg-indigo_gx1aq {
 background: indigo
}
.indigo-white_whlua {
 color: #fff
}`);
            });
        });

        it("module #2", function () {
            return transform(
                `
:root {
  --accent-color: hotpink;
}

.button {
  background: var(--accent-color);
}

`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    "--accent-color": "--accent-color_ynr0g",
                    button: "button_ohlua",
                });

                expect(result.code).equals(`:root {
 --accent-color_ynr0g: hotpink
}
.button_ohlua {
 background: var(--accent-color_ynr0g)
}`);
            });
        });

        it("module #3", function () {
            return transform(
                `
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo;
  composes: title block ruler from global;
  color: white;
}
`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    goal: "goal_r6ajz",
                    "bg-indigo": "bg-indigo_gx1aq",
                    "indigo-white": "indigo-white_whlua bg-indigo_gx1aq title block ruler",
                });

                expect(result.code).equals(`.goal_r6ajz .bg-indigo_gx1aq {
 background: indigo
}
.indigo-white_whlua {
 color: #fff
}`);
            });
        });

        it("module #4", function () {
            const url = new URL(dirname(import.meta.url) + "/../../css-modules/mixins.css");

            return transform(
                `
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo;
composes: button cell title from "${url.pathname.replace(root.pathname, "")}";  color: white;
}
`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    goal: "goal_r6ajz",
                    "bg-indigo": "bg-indigo_gx1aq",
                    "indigo-white":
                        "indigo-white_whlua bg-indigo_gx1aq button_efjs8_mixins cell_sz3cs_mixins title_sdhq6_mixins",
                });

                expect(result.code).equals(`.goal_r6ajz .bg-indigo_gx1aq {
 background: indigo
}
.indigo-white_whlua {
 color: #fff
}`);
            });
        });

        it("module @keyframes and @property #5", function () {
            return transform(
                `

@property --progress {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 25%;
}

.bar {
    display: inline-block;
    --progress: 25%;
    width: 100%;
    height: 5px;
    background: linear-gradient(
            to right,
            #00d230 var(--progress),
            black var(--progress)
    );
    animation: progressAnimation 2.5s ease infinite;
}

@keyframes progressAnimation {
    to {
        --progress: 100%;
    }
}

`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    "--progress": "--progress_rkoxd",
                    bar: "bar_dmqzf",
                    progressAnimation: "progressAnimation_nqu3j",
                });

                expect(result.code).equals(`@property --progress_rkoxd {
 syntax: "<percentage>";
 inherits: false;
 initial-value: 25%
}
.bar_dmqzf {
 display: inline-block;
 --progress_rkoxd: 25%;
 width: 100%;
 height: 5px;
 background: linear-gradient(90deg,#00d230 var(--progress_rkoxd),#000 var(--progress_rkoxd));
 animation: progressAnimation_nqu3j 2.5s infinite
}
@keyframes progressAnimation_nqu3j {
 to {
  --progress_rkoxd: 100%
 }
}`);
            });
        });

        it("module @keyframes and @property #6", function () {
            return transform(
                `
:root {
  overflow: hidden;
  background-color: lightblue;
  display: flex;
  justify-content: center;
}

.sun {
  background-color: yellow;
  border-radius: 50%;
  height: 100vh;
  aspect-ratio: 1 / 1;
  /*
    animations declared later in the cascade will override the
    properties of previously declared animations
  */
  /* bounce 'overwrites' the transform set by rise, hence the sun only moves horizontally */
  animation:
    4s linear 0s infinite alternate rise,
    4s linear 0s infinite alternate bounce;
}

@keyframes rise {
  from {
    transform: translateY(110vh);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes bounce {
  from {
    transform: translateX(-50vw);
  }
  to {
    transform: translateX(50vw);
  }
}

`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    sun: "sun_cjnwc",
                    rise: "rise_jsw5l",
                    bounce: "bounce_gvz8o",
                });

                expect(result.code).equals(`:root {
 overflow: hidden;
 background-color: #add8e6;
 display: flex;
 justify-content: center
}
.sun_cjnwc {
 background-color: #ff0;
 border-radius: 50%;
 height: 100vh;
 aspect-ratio: 1 / 1;
 animation: 4s linear infinite alternate rise_jsw5l,4s linear 0s infinite alternate bounce_gvz8o
}
@keyframes rise_jsw5l {
 0% {
  transform: translateY(110vh)
 }
 to {
  transform: none
 }
}
@keyframes bounce_gvz8o {
 0% {
  transform: translateX(-50vw)
 }
 to {
  transform: translateX(50vw)
 }
}`);
            });
        });

        it("module :local :global #7", function () {
            return transform(
                `
:local(.className) {
  background: red;
}
:local .className {
  color: green;
}
:local(.className .subClass) {
  color: green;
}
:local .className .subClass :global(.global-class-name) {
  color: blue;
}

`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    className: "className_vimvb",
                    subClass: "subClass_sfjs8",
                });

                expect(result.code).equals(`.className_vimvb {
 background: red
}
.className_vimvb,.className_vimvb .subClass_sfjs8 {
 color: green
}
.className_vimvb .subClass_sfjs8 .global-class-name {
 color: blue
}`);
            });
        });

        it("module composes #8", function () {
            return transform(
                `
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`,
                {
                    module: true,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    className: "className_vimvb",
                    subClass: "subClass_sfjs8 className_vimvb",
                });

                expect(result.code).equals(`.className_vimvb {
 background: red;
 color: #ff0
}
.subClass_sfjs8 {
 background: blue
}`);
            });
        });

        it("module dash case only #9", function () {
            return transform(
                `
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`,
                {
                    module: ModuleCaseTransformEnum.DashCaseOnly,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    "class-name": "class-name_vimvb",
                    "sub-class": "sub-class_sfjs8 class-name_vimvb",
                });

                expect(result.code).equals(`.class-name_vimvb {
 background: red;
 color: #ff0
}
.sub-class_sfjs8 {
 background: blue
}`);
            });
        });

        it("module dash case #10", function () {
            return transform(
                `
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`,
                {
                    module: ModuleCaseTransformEnum.DashCase,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    "class-name": "className_vimvb",
                    "sub-class": "subClass_sfjs8 className_vimvb",
                });

                expect(result.code).equals(`.className_vimvb {
 background: red;
 color: #ff0
}
.subClass_sfjs8 {
 background: blue
}`);
            });
        });

        it("module camel case only #11", function () {
            return transform(
                `
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`,
                {
                    module: ModuleCaseTransformEnum.CamelCaseOnly,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    className: "className_afjs8",
                    subClass: "subClass_neir7 className_afjs8",
                });

                expect(result.code).equals(`.className_afjs8 {
 background: red;
 color: #ff0
}
.subClass_neir7 {
 background: blue
}`);
            });
        });

        it("module camel case #12", function () {
            return transform(
                `
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`,
                {
                    module: ModuleCaseTransformEnum.CamelCase,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    className: "class-name_afjs8",
                    subClass: "sub-class_neir7 class-name_afjs8",
                });

                expect(result.code).equals(`.class-name_afjs8 {
 background: red;
 color: #ff0
}
.sub-class_neir7 {
 background: blue
}`);
            });
        });

        it("module case ignore #13", function () {
            return transform(
                `
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`,
                {
                    module: ModuleCaseTransformEnum.IgnoreCase,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    className: "className_vimvb",
                    subClass: "subClass_sfjs8 className_vimvb",
                });

                expect(result.code).equals(`.className_vimvb {
 background: red;
 color: #ff0
}
.subClass_sfjs8 {
 background: blue
}`);
            });
        });

        it("module case ignore #14", function () {
            return transform(
                `
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`,
                {
                    module: ModuleCaseTransformEnum.IgnoreCase,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    "class-name": "class-name_afjs8",
                    "sub-class": "sub-class_neir7 class-name_afjs8",
                });

                expect(result.code).equals(`.class-name_afjs8 {
 background: red;
 color: #ff0
}
.sub-class_neir7 {
 background: blue
}`);
            });
        });

        it("module mode global #15", function () {
            return transform(
                `
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`,
                {
                    module: ModuleScopeEnumOptions.Global,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.mapping).deep.equals({
                    "class-name": "class-name",
                    "sub-class": "sub-class class-name",
                });

                expect(result.code).equals(`.class-name {
 background: red;
 color: #ff0
}
.sub-class {
 background: blue
}`);
            });
        });

        it("module mode global #16", function () {
            return transform(
                `
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
a span {

    text-transform: uppercase;
}
`,
                {
                    module: ModuleScopeEnumOptions.Pure | ModuleScopeEnumOptions.Global,
                    beautify: true,
                },
            )
                .catch((error) => error)
                .then((error) => expect(error).to.be.an("error"));
        });

        it("module mode ICSS #17", function () {
            const url = new URL(dirname(import.meta.url) + "/../../css-modules/mixins.css");
            return transform(
                `

              .goal .bg-indigo {
                background: indigo;
              }
              
            
            .indigo-white {
              composes: bg-indigo;
              composes: title block ruler from global;
              color: white;
            }
              
              .indigo-white {
                composes: bg-indigo;
              composes: button cell title from "${url.pathname.replace(root.pathname, "")}";  color: white;
              }
`,
                {
                    module: ModuleScopeEnumOptions.ICSS,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.importMapping).deep.equals({
                    "./test/css-modules/mixins.css": {
                        title: "title_sdhq6_mixins",
                        cell: "cell_sz3cs_mixins",
                        button: "button_efjs8_mixins",
                    },
                });

                expect(result.mapping).deep.equals({
                    goal: "goal_r6ajz",
                    "bg-indigo": "bg-indigo_gx1aq",
                    "indigo-white":
                        "indigo-white_whlua title block ruler bg-indigo_gx1aq button_efjs8_mixins cell_sz3cs_mixins title_sdhq6_mixins",
                });
                expect(result.code).equals(`:import("./test/css-modules/mixins.css") {
 button_efjs8_mixins: button;
 cell_sz3cs_mixins: cell;
 title_sdhq6_mixins: title;
}
:export {
 goal: goal_r6ajz;
 bg-indigo: bg-indigo_gx1aq;
 indigo-white: indigo-white_whlua title block ruler bg-indigo_gx1aq button_efjs8_mixins cell_sz3cs_mixins title_sdhq6_mixins;
}
.goal_r6ajz .bg-indigo_gx1aq {
 background: indigo
}
.indigo-white_whlua {
 color: #fff
}`);
            });
        });

        //         it("module export variables #18", function () {
        //             return transform(
        //                 `

        //               @value blue: #0c77f8;
        //               @value red: #ff0000;
        //               @value green: #aaf200;
        // `,
        //                 {
        //                     module: ModuleScopeEnumOptions.ICSS,
        //                     beautify: true,
        //                 },
        //             ).then((result) =>
        //                 expect(result.cssModuleVariables).deep.equals({
        //                     blue: {
        //                         typ: EnumToken.CssVariableTokenType,
        //                         nam: "blue",
        //                         val: [
        //                             {
        //                                 typ: EnumToken.ColorTokenType,
        //                                 val: "#0c77f8",
        //                                 kin: ColorType.HEX,
        //                             },
        //                         ],
        //                     },
        //                     red: {
        //                         typ: EnumToken.CssVariableTokenType,
        //                         nam: "red",
        //                         val: [
        //                             {
        //                                 typ: EnumToken.ColorTokenType,
        //                                 val: "#ff0000",
        //                                 kin: ColorType.HEX,
        //                             },
        //                         ],
        //                     },
        //                     green: {
        //                         typ: EnumToken.CssVariableTokenType,
        //                         nam: "green",
        //                         val: [
        //                             {
        //                                 typ: EnumToken.ColorTokenType,
        //                                 val: "#aaf200",
        //                                 kin: ColorType.HEX,
        //                             },
        //                         ],
        //                     },
        //                 }),
        //             );
        //         });

        it("module import variables #19", function () {
            const url = new URL(dirname(import.meta.url) + "/../../css-modules/color.css");
            return transform(
                `

  /* import your colors... */
  @value colors: "${url.pathname.replace(root.pathname, "")}";
  @value blue, red, green from colors;
  
  .button {
    color: light-dark(blue , red);
    display: inline-block;
  }
  
  @supports (border-color: green) and (color:color(from green  srgb r g b / 0.5)) {
  
  .green {
  
  .button {
    color: green;
  }
  
  }
`,
                {
                    module: ModuleScopeEnumOptions.ICSS,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.code).equals(`:export {
 button: button_ohlua;
 green: green_zmqzf;
}
.button_ohlua {
 color: light-dark(#0c77f8,#ff0020);
 display: inline-block
}
@supports (border-color:green) and (color:color(from green srgb r g b/.5)) {
 .green_zmqzf .button_ohlua {
  color: #aaf201
 }
}`);
            });
        });

        it("module grid #19", function () {
            return transform(
                `
.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}
`,
                {
                    module: {
                        pattern: "[local]-[hash:sha256]",
                    },
                    beautify: true,
                },
            ).then((result) => {
                expect(result.code).equals(`.grid-8aab4 {
 grid-template-areas: 'nav-7fb75 main-2d42c';
 grid-template-columns: [line-name1-bd45b] 100px [line-name2-d3d89 line-name3-3258b]
}
.nav-7fb75 {
 grid-column-start: nav-7fb75;
 grid-column-end: nav-7fb75
}`);
            });
        });

        it("module grid #20", function () {
            return transform(
                `
.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}
`,
                {
                    module: {
                        pattern: "[local]-[hash:base64url]",
                    },
                    beautify: true,
                },
            ).then((result) => {
                expect(result.code).equals(`.grid-Z3JpZ {
 grid-template-areas: 'nav-bmF2O main-bWFpb';
 grid-template-columns: [line-name1-bGluZ] 100px [line-name2-bGluZ line-name3-bGluZ]
}
.nav-bmF2O {
 grid-column-start: nav-bmF2O;
 grid-column-end: nav-bmF2O
}`);
            });
        });

        it("module grid #21", function () {
            return transform(
                `

.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}

`,
                {
                    module: {
                        pattern: "[local]-[hash:hex]",
                    },
                    beautify: true,
                },
            ).then((result) => {
                expect(result.code).equals(`.grid-67726 {
 grid-template-areas: 'nav-6e617 main-6d616';
 grid-template-columns: [line-name1-6c696] 100px [line-name2-6c696 line-name3-6c696]
}
.nav-6e617 {
 grid-column-start: nav-6e617;
 grid-column-end: nav-6e617
}`);
            });
        });

        it("module grid #22", function () {
            return expect(
                transform(
                    `

.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}

`,
                    {
                        module: {
                            pattern: "[local]-[hash:bogus]",
                        },
                        beautify: true,
                    },
                ),
            ).to.be.rejectedWith(
                `Unsupported hash length: 'bogus'. expecting format [hash:length] or [hash:hash-algo:length]`,
            );
        });

        it("module grid #23", function () {
            return transform(
                `

.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}

`,
                {
                    module: ModuleScopeEnumOptions.ICSS | ModuleScopeEnumOptions.Shortest,
                    beautify: true,
                },
            ).then((result) => {
                expect(result.code).equals(`:export {
 grid: a;
 nav: b;
 main: c;
 line-name1: d;
 line-name2: e;
 line-name3: f;
}
.a {
 grid-template-areas: 'b c';
 grid-template-columns: [d] 100px [e f]
}
.b {
 grid-column-start: b;
 grid-column-end: b
}`);
            });
        });

        it("module #24", function () {
            const result = transformSync(
                `
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo title;
  color: white;
}
`,
                {
                    module: true,
                    beautify: true,
                },
            );

            expect(result.mapping).deep.equals({
                goal: "goal_r6ajz",
                "bg-indigo": "bg-indigo_gx1aq",
                "indigo-white": "indigo-white_whlua bg-indigo_gx1aq title_qvz8o",
                title: "title_qvz8o",
            });
            expect(result.code).equals(`.goal_r6ajz .bg-indigo_gx1aq {
 background: indigo
}
.indigo-white_whlua {
 color: #fff
}`);
        });

        it("module grid #25", function () {
            return expect(
                Promise.resolve(
                    (async () =>
                        transformSync(
                            `

.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}

`,
                            {
                                module: {
                                    pattern: "[local]-[hash:sha1]",
                                },
                                beautify: true,
                            },
                        ))(),
                ),
            ).to.be.rejectedWith(
                `Unsupported hash algorithm: 'sha1'. Not supported by parseSync() or transformSync(). Use parse() or transform().`,
            );
        });

        it("module pattern #26", function () {
            const file = new URL(dirname(import.meta.url) + "/../../css-modules/button.css");

            return transform({
                file: file.pathname,
                beautify: true,
                module: {
                    pattern: "[local]-name-[name]-folder-[folder]-ext-[ext]-path-[path]-hash-[hash:base64:5]",
                },
            }).then((result) => {
                expect(result.code)
                    .equals(`.button-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YnV0d {
 background-color: #007bff;
 color: #fff;
 padding: 10px 20px;
 border: 0;
 cursor: pointer;
 border-radius: 4px
}
.button-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YnV0d:hover {
 background-color: #0056b3
}
@property --progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ {
 syntax: "<percentage>";
 inherits: false;
 initial-value: 25%
}
.bar-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YmFyO {
 display: inline-block;
 --progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ: 25%;
 width: 100%;
 height: 5px;
 background: linear-gradient(90deg,#00d230 var(--progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ),#000 var(--progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ));
 animation: progressAnimation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ 2.5s infinite
}
@keyframes progressAnimation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ {
 to {
  --progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ: 100%
 }
}
.body-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-Ym9ke {
 background: #6e28d9;
 padding: 0 24px;
 color: #fff;
 margin: 0;
 height: 100vh;
 justify-content: center;
 align-items: center
}
.animation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YW5pb {
 display: block;
 width: var(--progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ);
 animation: progressAnimation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ infinite alternate 3s;
 background: red
}`);
            });
        });

        it("module pattern #27", function () {
            const file = new URL(dirname(import.meta.url) + "/../../css-modules/button.css");

            const result = transformSync({
                src: file.pathname,
                input: `/* Button.module.css file */

.button {
    background-color: #007bff;
    color: #ffffff;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    border-radius: 4px;
}

.button:hover {
    background-color: #0056b3;
}

@property --progress {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 25%;
}

.bar {
    display: inline-block;
    --progress: 25%;
    width: 100%;
    height: 5px;
    background: linear-gradient(
            to right,
            #00d230 var(--progress),
            black var(--progress)
    );
    animation: progressAnimation 2.5s ease infinite;
}

@keyframes progressAnimation {
    to {
        --progress: 100%;
    }
}

.body {
    background: #6e28d9;
    padding: 0 24px;
    color: white; /* Change my color to yellow */
    margin: 0;
    height: 100vh;
    justify-content: center;
    align-items: center;

}

.animation {
    display: block;
    width: var(--progress);
    animation: progressAnimation infinite alternate 3s;
    background: red;
}
`,
                beautify: true,
                module: {
                    pattern: "[local]-name-[name]-folder-[folder]-ext-[ext]-path-[path]-hash-[hash:base64:5]",
                },
            });

            expect(result.code)
                .equals(`.button-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YnV0d {
 background-color: #007bff;
 color: #fff;
 padding: 10px 20px;
 border: 0;
 cursor: pointer;
 border-radius: 4px
}
.button-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YnV0d:hover {
 background-color: #0056b3
}
@property --progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ {
 syntax: "<percentage>";
 inherits: false;
 initial-value: 25%
}
.bar-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YmFyO {
 display: inline-block;
 --progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ: 25%;
 width: 100%;
 height: 5px;
 background: linear-gradient(90deg,#00d230 var(--progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ),#000 var(--progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ));
 animation: progressAnimation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ 2.5s infinite
}
@keyframes progressAnimation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ {
 to {
  --progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ: 100%
 }
}
.body-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-Ym9ke {
 background: #6e28d9;
 padding: 0 24px;
 color: #fff;
 margin: 0;
 height: 100vh;
 justify-content: center;
 align-items: center
}
.animation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-YW5pb {
 display: block;
 width: var(--progress-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ);
 animation: progressAnimation-name-button-folder-css-modules-ext-css-path-test_css-modules_button_css-hash-cHJvZ infinite alternate 3s;
 background: red
}`);
        });
    });
}
