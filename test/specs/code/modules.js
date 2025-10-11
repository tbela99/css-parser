import {ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions} from "../../../dist/node.js";

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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                    goal: "r7bhp_goal",
                    "bg-indigo": "gy28g_bg-indigo",
                    "indigo-white": "wims0_indigo-white gy28g_bg-indigo qw06e_title",
                    title: "qw06e_title",
                });
                expect(result.code).equals(`.r7bhp_goal .gy28g_bg-indigo {
 background: indigo
}
.wims0_indigo-white {
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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        "--accent-color": "--yosy6_accent-color",
                        button: "oims0_button",
                    }
                );

                expect(result.code).equals(`:root {
 --yosy6_accent-color: hotpink
}
.oims0_button {
 background: var(--yosy6_accent-color)
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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        goal: "r7bhp_goal",
                        "bg-indigo": "gy28g_bg-indigo",
                        "indigo-white": "wims0_indigo-white gy28g_bg-indigo ruler block title",
                    }
                );

                expect(result.code).equals(`.r7bhp_goal .gy28g_bg-indigo {
 background: indigo
}
.wims0_indigo-white {
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
composes: button cell title from "${import.meta.dirname}/../../css-modules/mixins.css";  color: white;
}
`, {
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        goal: "r7bhp_goal",
                        "bg-indigo": "gy28g_bg-indigo",
                        "indigo-white": "wims0_indigo-white gy28g_bg-indigo mixins_seiow_title mixins_s04ai_cell mixins_egkqy_button",
                    }
                );

                expect(result.code).equals(`.r7bhp_goal .gy28g_bg-indigo {
 background: indigo
}
.wims0_indigo-white {
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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        "--progress": "--rlpv3_progress",
                        bar: "dnrx5_bar",
                        progressAnimation: "nrv19_progressAnimation",
                    }
                );

                expect(result.code).equals(`@property --rlpv3_progress {
 syntax: "<percentage>";
 inherits: false;
 initial-value: 25%
}
.dnrx5_bar {
 display: inline-block;
 --rlpv3_progress: 25%;
 width: 100%;
 height: 5px;
 background: linear-gradient(to right,#00d230 var(--rlpv3_progress),#000 var(--rlpv3_progress));
 animation: nrv19_progressAnimation 2.5s infinite
}
@keyframes nrv19_progressAnimation {
 to {
  --rlpv3_progress: 100%
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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        sun: "ckou2_sun",
                        rise: "jtx3b_rise",
                        bounce: "gw06e_bounce",
                    }
                );

                expect(result.code).equals(`:root {
 overflow: hidden;
 background-color: #add8e6;
 display: flex;
 justify-content: center
}
.ckou2_sun {
 background-color: #ff0;
 border-radius: 50%;
 height: 100vh;
 aspect-ratio: 1 / 1;
 animation: 4s linear infinite alternate jtx3b_rise,4s linear 0s infinite alternate gw06e_bounce
}
@keyframes jtx3b_rise {
 0% {
  transform: translateY(110vh)
 }
 to {
  transform: none
 }
}
@keyframes gw06e_bounce {
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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        className: "vjnt1_className",
                        subClass: "sgkqy_subClass",
                    }
                );

                expect(result.code).equals(`.vjnt1_className {
 background: red
}
.vjnt1_className,.vjnt1_className .sgkqy_subClass {
 color: green
}
.vjnt1_className .sgkqy_subClass .global-class-name {
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
                module: true,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        className: "vjnt1_className",
                        subClass: "sgkqy_subClass vjnt1_className",
                    }
                );

                expect(result.code).equals(`.vjnt1_className {
 background: red;
 color: #ff0
}
.sgkqy_subClass {
 background: blue
}`)
            })
        });

        it('module dash only #9', function () {
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
                module: ModuleCaseTransformEnum.DashCaseOnly,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        "class-name": "vjnt1_class-name",
                        "sub-class": "sgkqy_sub-class vjnt1_class-name",
                    }
                );

                expect(result.code).equals(`.vjnt1_class-name {
 background: red;
 color: #ff0
}
.sgkqy_sub-class {
 background: blue
}`)
            })
        });

        it('module dash #10', function () {
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
                module: ModuleCaseTransformEnum.DashCase,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        "class-name": "vjnt1_className",
                        "sub-class": "sgkqy_subClass vjnt1_className",
                    }
                );

                expect(result.code).equals(`.vjnt1_className {
 background: red;
 color: #ff0
}
.sgkqy_subClass {
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
                module: ModuleCaseTransformEnum.CamelCaseOnly,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        className: "agkqy_className",
                        subClass: "nfjpx_subClass agkqy_className",
                    }
                );

                expect(result.code).equals(`.agkqy_className {
 background: red;
 color: #ff0
}
.nfjpx_subClass {
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
                module: ModuleCaseTransformEnum.CamelCase,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        className: "agkqy_class-name",
                        subClass: "nfjpx_sub-class agkqy_class-name",
                    }
                );

                expect(result.code).equals(`.agkqy_class-name {
 background: red;
 color: #ff0
}
.nfjpx_sub-class {
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
                module: ModuleCaseTransformEnum.Ignore,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        className: "vjnt1_className",
                        subClass: "sgkqy_subClass vjnt1_className",
                    }
                );

                expect(result.code).equals(`.vjnt1_className {
 background: red;
 color: #ff0
}
.sgkqy_subClass {
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
                module: ModuleCaseTransformEnum.Ignore,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        "class-name": "agkqy_class-name",
                        "sub-class": "nfjpx_sub-class agkqy_class-name",
                    }
                );

                expect(result.code).equals(`.agkqy_class-name {
 background: red;
 color: #ff0
}
.nfjpx_sub-class {
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
                module: ModuleScopeEnumOptions.Global,
                beautify: true
            }).then((result) => {

                expect(result.mapping).deep.equals({
                        "class-name": "class-name",
                        "sub-class": "sub-class class-name",
                    }
                );

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
                    module: ModuleScopeEnumOptions.Pure | ModuleScopeEnumOptions.Global,
                    beautify: true
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
              composes: button cell title from "${import.meta.dirname}/../../css-modules/mixins.css";  color: white;
              }
`, {
                    module: ModuleScopeEnumOptions.ICSS,
                    beautify: true
                }).then(result => {
                  
                    expect(result.code).equals(`:import("./test/css-modules/mixins.css") {
 qw06e_title: title;
 oims0_button: button;
 kmqw4_cell: cell;
}
:export {
 goal: r7bhp_goal;
 bg-indigo: gy28g_bg-indigo;
 indigo-white: wims0_indigo-white gy28g_bg-indigo ruler block title qw06e_title kmqw4_cell oims0_button;
}
.r7bhp_goal .gy28g_bg-indigo {
 background: indigo
}
.wims0_indigo-white {
 color: #fff
}`);
                });

        });

        it('module export variables #18', function () {

            transform(`

              @value blue: #0c77f8;
              @value red: #ff0000;
              @value green: #aaf200;
`, {
                module: ModuleScopeEnumOptions.ICSS,
                beautify: true
            }).then(result => {

                expect(result.cssModuleVariables).deep.equals({
                    "blue": {
                        "typ": EnumToken.CssVariableTokenType,
                        "nam": "blue",
                        "val": [
                            {
                                "typ": EnumToken.ColorTokenType,
                                "val": "#0c77f8",
                                "kin": ColorType.HEX
                            }
                        ]
                    },
                    "red": {
                        "typ": EnumToken.CssVariableTokenType,
                        "nam": "red",
                        "val": [
                            {
                                "typ": EnumToken.ColorTokenType,
                                "val": "red",
                                "kin": ColorKind.LIT
                            }
                        ]
                    },
                    "green": {
                        "typ": EnumToken.CssVariableTokenType,
                        "nam": "green",
                        "val": [
                            {
                                "typ": EnumToken.ColorTokenType,
                                "val": "#aaf200",
                                "kin": ColorType.HEX
                            }
                        ]
                    }
                });
            });

        });

        it('module import variables #19', function () {

            transform(`

  /* import your colors... */
  @value colors: "${import.meta.dirname}/../../css-modules/color.css";
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
                module: ModuleScopeEnumOptions.ICSS,
                beautify: true
            }).then(result => {

                expect(result.code).equals(`:export {
 button: oims0_button;
 green: znrx5_green;
}
.oims0_button {
 color: light-dark(#0c77f8,#ff0020);
 display: inline-block
}
@supports (border-color:#aaf201) or (color:#00800080) {
 .znrx5_green .oims0_button {
  color: #aaf201
 }
}`);
            });

        });
    });
}