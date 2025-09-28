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
                        "indigo-white": "wyCIQ_indigo-white gosyG_bg-indigo mixins_jX17f_title mixins_NZ39h_cell mixins_pxBHP_button",
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
    });
}