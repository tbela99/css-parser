import {ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions} from "../../../dist/lib/ast/types.js";

export function run(describe, expect, it, transform, parse, render, dirname, readFile) {

    describe('css modules', function () {

        it('module #1', function () {
            return transform(`
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo title;
  color: white;
}
`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    goal: "goal_r7bhp",
                    "bg-indigo": "bg-indigo_gy28g",
                    "indigo-white": "indigo-white_wims0 bg-indigo_gy28g title_qw06e",
                    title: "title_qw06e",
                });
                expect(result.code).equals(`.goal_r7bhp .bg-indigo_gy28g {
 background: indigo
}
.indigo-white_wims0 {
 color: #fff
}`)
            })
        });

        it('module #2', function () {
            return transform(`
:root {
  --accent-color: hotpink;
}

.button {
  background: var(--accent-color);
}

`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    "--accent-color": "--accent-color_yosy6", button: "button_oims0",
                });

                expect(result.code).equals(`:root {
 --accent-color_yosy6: hotpink
}
.button_oims0 {
 background: var(--accent-color_yosy6)
}`)
            })
        });


        it('module #3', function () {
            return transform(`
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo;
  composes: title block ruler from global;
  color: white;
}
`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    goal: "goal_r7bhp",
                    "bg-indigo": "bg-indigo_gy28g",
                    "indigo-white": "indigo-white_wims0 bg-indigo_gy28g ruler block title",
                });

                expect(result.code).equals(`.goal_r7bhp .bg-indigo_gy28g {
 background: indigo
}
.indigo-white_wims0 {
 color: #fff
}`)
            })
        });

        it('module #4', function () {
            return transform(`
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo;
composes: button cell title from "${dirname(new URL(import.meta.url).pathname)}/../../css-modules/mixins.css";  color: white;
}
`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    goal: "goal_r7bhp",
                    "bg-indigo": "bg-indigo_gy28g",
                    "indigo-white": "indigo-white_wims0 bg-indigo_gy28g title_fnrx5_mixins cell_dptz7_mixins button_rptz7_mixins",
                });

                expect(result.code).equals(`.goal_r7bhp .bg-indigo_gy28g {
 background: indigo
}
.indigo-white_wims0 {
 color: #fff
}`)
            })
        });

        it('module @keyframes and @property #5', function () {
            return transform(`

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

`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    "--progress": "--progress_rlpv3", bar: "bar_dnrx5", progressAnimation: "progressAnimation_nrv19",
                });

                expect(result.code).equals(`@property --progress_rlpv3 {
 syntax: "<percentage>";
 inherits: false;
 initial-value: 25%
}
.bar_dnrx5 {
 display: inline-block;
 --progress_rlpv3: 25%;
 width: 100%;
 height: 5px;
 background: linear-gradient(to right,#00d230 var(--progress_rlpv3),#000 var(--progress_rlpv3));
 animation: progressAnimation_nrv19 2.5s infinite
}
@keyframes progressAnimation_nrv19 {
 to {
  --progress_rlpv3: 100%
 }
}`)
            })
        });

        it('module @keyframes and @property #6', function () {
            return transform(`
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

`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    sun: "sun_ckou2", rise: "rise_jtx3b", bounce: "bounce_gw06e",
                });

                expect(result.code).equals(`:root {
 overflow: hidden;
 background-color: #add8e6;
 display: flex;
 justify-content: center
}
.sun_ckou2 {
 background-color: #ff0;
 border-radius: 50%;
 height: 100vh;
 aspect-ratio: 1 / 1;
 animation: 4s linear infinite alternate rise_jtx3b,4s linear 0s infinite alternate bounce_gw06e
}
@keyframes rise_jtx3b {
 0% {
  transform: translateY(110vh)
 }
 to {
  transform: none
 }
}
@keyframes bounce_gw06e {
 0% {
  transform: translateX(-50vw)
 }
 to {
  transform: translateX(50vw)
 }
}`)
            })
        });

        it('module :local :global #7', function () {
            return transform(`
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

`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    className: "className_vjnt1", subClass: "subClass_sgkqy",
                });

                expect(result.code).equals(`.className_vjnt1 {
 background: red
}
.className_vjnt1,.className_vjnt1 .subClass_sgkqy {
 color: green
}
.className_vjnt1 .subClass_sgkqy .global-class-name {
 color: blue
}`)
            })
        });

        it('module composes #8', function () {
            return transform(`
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`, {
                module: true, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    className: "className_vjnt1", subClass: "subClass_sgkqy className_vjnt1",
                });

                expect(result.code).equals(`.className_vjnt1 {
 background: red;
 color: #ff0
}
.subClass_sgkqy {
 background: blue
}`)
            })
        });

        it('module dash case only #9', function () {
            return transform(`
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`, {
                module: ModuleCaseTransformEnum.DashCaseOnly, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    "class-name": "class-name_vjnt1", "sub-class": "sub-class_sgkqy class-name_vjnt1",
                });

                expect(result.code).equals(`.class-name_vjnt1 {
 background: red;
 color: #ff0
}
.sub-class_sgkqy {
 background: blue
}`)
            })
        });

        it('module dash case #10', function () {
            return transform(`
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`, {
                module: ModuleCaseTransformEnum.DashCase, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    "class-name": "className_vjnt1", "sub-class": "subClass_sgkqy className_vjnt1",
                });

                expect(result.code).equals(`.className_vjnt1 {
 background: red;
 color: #ff0
}
.subClass_sgkqy {
 background: blue
}`)
            })
        });

        it('module camel case only #11', function () {
            return transform(`
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`, {
                module: ModuleCaseTransformEnum.CamelCaseOnly, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    className: "className_agkqy", subClass: "subClass_nfjpx className_agkqy",
                });

                expect(result.code).equals(`.className_agkqy {
 background: red;
 color: #ff0
}
.subClass_nfjpx {
 background: blue
}`)
            })
        });

        it('module camel case #12', function () {
            return transform(`
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`, {
                module: ModuleCaseTransformEnum.CamelCase, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    className: "class-name_agkqy", subClass: "sub-class_nfjpx class-name_agkqy",
                });

                expect(result.code).equals(`.class-name_agkqy {
 background: red;
 color: #ff0
}
.sub-class_nfjpx {
 background: blue
}`)
            })
        });

        it('module case ignore #13', function () {
            return transform(`
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`, {
                module: ModuleCaseTransformEnum.IgnoreCase, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    className: "className_vjnt1", subClass: "subClass_sgkqy className_vjnt1",
                });

                expect(result.code).equals(`.className_vjnt1 {
 background: red;
 color: #ff0
}
.subClass_sgkqy {
 background: blue
}`)
            })
        });

        it('module case ignore #14', function () {
            return transform(`
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`, {
                module: ModuleCaseTransformEnum.IgnoreCase, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    "class-name": "class-name_agkqy", "sub-class": "sub-class_nfjpx class-name_agkqy",
                });

                expect(result.code).equals(`.class-name_agkqy {
 background: red;
 color: #ff0
}
.sub-class_nfjpx {
 background: blue
}`)
            })
        });

        it('module mode global #15', function () {
            return transform(`
:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
}
`, {
                module: ModuleScopeEnumOptions.Global, beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    "class-name": "class-name", "sub-class": "sub-class class-name",
                });

                expect(result.code).equals(`.class-name {
 background: red;
 color: #ff0
}
.sub-class {
 background: blue
}`)
            })
        });

        it('module mode global #16', function () {

            transform(`
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
`, {
                module: ModuleScopeEnumOptions.Pure | ModuleScopeEnumOptions.Global, beautify: true
            }).catch(error => error).then(error => expect(error).to.be.an('error'));

        });

        it('module mode ICSS #17', function () {

            transform(`

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
              composes: button cell title from "${dirname(new URL(import.meta.url).pathname)}/../../css-modules/mixins.css";  color: white;
              }
`, {
                module: ModuleScopeEnumOptions.ICSS, beautify: true
            }).then(result => {

                expect(result.importMapping).deep.equals({
                    "./test/css-modules/mixins.css": {
                        title: "title_seiow_mixins", cell: "cell_s04ai_mixins", button: "button_egkqy_mixins",
                    }
                });

                expect(result.mapping).deep.equals({
                    goal: "goal_r7bhp",
                    "bg-indigo": "bg-indigo_gy28g",
                    "indigo-white": "indigo-white_wims0 bg-indigo_gy28g ruler block title title_seiow_mixins cell_s04ai_mixins button_egkqy_mixins",
                });
                expect(result.code).equals(`:import("./test/css-modules/mixins.css") {
 title_seiow_mixins: title;
 cell_s04ai_mixins: cell;
 button_egkqy_mixins: button;
}
:export {
 goal: goal_r7bhp;
 bg-indigo: bg-indigo_gy28g;
 indigo-white: indigo-white_wims0 bg-indigo_gy28g ruler block title title_seiow_mixins cell_s04ai_mixins button_egkqy_mixins;
}
.goal_r7bhp .bg-indigo_gy28g {
 background: indigo
}
.indigo-white_wims0 {
 color: #fff
}`)
            });

        });

        it('module export variables #18', function () {

            return transform(`

              @value blue: #0c77f8;
              @value red: #ff0000;
              @value green: #aaf200;
`, {
                module: ModuleScopeEnumOptions.ICSS, beautify: true
            }).then(result => expect(result.cssModuleVariables).deep.equals({
                "blue": {
                    "typ": EnumToken.CssVariableTokenType, "nam": "blue", "val": [{
                        "typ": EnumToken.ColorTokenType, "val": "#0c77f8", "kin": ColorType.HEX
                    }]
                }, "red": {
                    "typ": EnumToken.CssVariableTokenType, "nam": "red", "val": [{
                        "typ": EnumToken.ColorTokenType, "val": "#ff0000", "kin": ColorType.HEX
                    }]
                }, "green": {
                    "typ": EnumToken.CssVariableTokenType, "nam": "green", "val": [{
                        "typ": EnumToken.ColorTokenType, "val": "#aaf200", "kin": ColorType.HEX
                    }]
                }
            }))
        });

        it('module import variables #19', function () {

            transform(`

  /* import your colors... */
  @value colors: "${dirname(new URL(import.meta.url).pathname)}/../../css-modules/color.css";
  @value blue, red, green from colors;
  
  .button {
    color: light-dark(blue , red);
    display: inline-block;
  }
  
  @supports (border-color: green) or (color:color(from green  srgb r g b / 0.5)) {
  
  .green {
  
  .button {
    color: green;
  }
  
  }
`, {
                module: ModuleScopeEnumOptions.ICSS, beautify: true
            }).then(result => {

                expect(result.code).equals(`:export {
 button: button_oims0;
 green: green_znrx5;
}
.button_oims0 {
 color: light-dark(#0c77f8,#ff0020);
 display: inline-block
}
@supports (border-color:#aaf201) or (color:#00800080) {
 .green_znrx5 .button_oims0 {
  color: #aaf201
 }
}`);
            });

        });

        it('module grid #19', function () {

            transform(`
.grid {
  grid-template-areas: 'nav main';
  grid-template-columns: [line-name1] 100px [line-name2 line-name3];
}

.nav {
  grid-column-start: nav-start;
  grid-column-end: nav-end;
}
`, {
                module: {
                    pattern: '[local]-[hash:sha256]'
                }, beautify: true
            }).then(result => {

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
    });
}