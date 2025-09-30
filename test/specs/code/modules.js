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
                    goal: "RDHNV_goal",
                    "bg-indigo": "gosyG_bg-indigo",
                    "indigo-white": "wyCIQ_indigo-white gosyG_bg-indigo qAEKS_title",
                    title: "qAEKS_title",
                });
                expect(result.code).equals(`.RDHNV_goal .gosyG_bg-indigo {
 background: indigo
}
.wyCIQ_indigo-white {
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
                        "--accent-color": "--y04ai_accent-color",
                        button: "o48em_button",
                    }
                );

                expect(result.code).equals(`:root {
 --y04ai_accent-color: hotpink
}
.o48em_button {
 background: var(--y04ai_accent-color)
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
                        goal: "RDHNV_goal",
                        "bg-indigo": "gosyG_bg-indigo",
                        "indigo-white": "wyCIQ_indigo-white gosyG_bg-indigo ruler block title",
                    }
                );

                expect(result.code).equals(`.RDHNV_goal .gosyG_bg-indigo {
 background: indigo
}
.wyCIQ_indigo-white {
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
                        goal: "RDHNV_goal",
                        "bg-indigo": "gosyG_bg-indigo",
                        "indigo-white": "wyCIQ_indigo-white gosyG_bg-indigo mixins_sCGMU_title mixins_Scgmu_cell mixins_eaeks_button",
                    }
                );

                expect(result.code).equals(`.RDHNV_goal .gosyG_bg-indigo {
 background: indigo
}
.wyCIQ_indigo-white {
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
                        "--progress": "--r59fn_progress",
                        bar: "dDHNV_bar",
                        progressAnimation: "NNRX5_progressAnimation",
                    }
                );

                expect(result.code).equals(`@property --r59fn_progress {
 syntax: "<percentage>";
 inherits: false;
 initial-value: 25%
}
.dDHNV_bar {
 display: inline-block;
 --r59fn_progress: 25%;
 width: 100%;
 height: 5px;
 background: linear-gradient(to right,#00d230 var(--r59fn_progress),#000 var(--r59fn_progress));
 animation: NNRX5_progressAnimation 2.5s infinite
}
@keyframes NNRX5_progressAnimation {
 to {
  --r59fn_progress: 100%
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
                        sun: "C8ciq_sun",
                        rise: "jDHNV_rise",
                        bounce: "G8ciq_bounce",
                    }
                );

                expect(result.code).equals(`:root {
 overflow: hidden;
 background-color: #add8e6;
 display: flex;
 justify-content: center
}
.C8ciq_sun {
 background-color: #ff0;
 border-radius: 50%;
 height: 100vh;
 aspect-ratio: 1 / 1;
 animation: 4s linear infinite alternate jDHNV_rise,4s linear 0s infinite alternate G8ciq_bounce
}
@keyframes jDHNV_rise {
 0% {
  transform: translateY(110vh)
 }
 to {
  transform: none
 }
}
@keyframes G8ciq_bounce {
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
                        className: "VPTZ7_className",
                        subClass: "SAEKS_subClass",
                    }
                );

                expect(result.code).equals(`.VPTZ7_className {
 background: red
}
.VPTZ7_className,.VPTZ7_className .SAEKS_subClass {
 color: green
}
.VPTZ7_className .SAEKS_subClass .global-class-name {
 color: blue
}`)
            })
        });

        it('module composes #78', function () {
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
                        className: "VPTZ7_className",
                        subClass: "SAEKS_subClass VPTZ7_className",
                    }
                );

                expect(result.code).equals(`.VPTZ7_className {
 background: red;
 color: #ff0
}
.SAEKS_subClass {
 background: blue
}`)
            })
        });
    });
}