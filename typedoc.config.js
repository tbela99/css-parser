import taskLists from "markdown-it-task-lists";

export default {
    $schema: "https://typedoc.org/schema.json",
    entryPoints: ["./src"],
    readme: "files/index.md",
    entryPointStrategy: "resolve",
    navigationLinks: {
        Benchmark: "https://tbela99.github.io/css-parser/benchmark/index.html",
        Docs: "https://tbela99.github.io/css-parser/docs/",
        Playground: "https://tbela99.github.io/css-parser/playground/",
        GitHub: "https://github.com/tbela99/css-parser",
    },
    plugin: ["typedoc-unhoax-theme", "typedoc-plugin-coverage", "typedoc-plugin-redirect"],
    redirects: {
        "documents/Guide.html": "documents/Guide.Getting_started.html",
    },
    coverageOutputType: "all",
    out: "docs",
    // Inject the checkbox parser into TypeDoc's markdown engine
    markdownItLoader(parser) {
        parser.use(taskLists, {
            enabled: false, // Set to true if you want users to be able to toggle checkboxes on the web page
            label: true, // Wraps the item text in a <label> element for better accessibility
            labelAfter: false, // Place the checkbox after the item
        });
    },
    projectDocuments: ["files/index.md"],
    groupOrder: ["Functions", "Classes", "TypeAlias", "Enumerations", "*"],
    categoryOrder: ["Functions", "Classes", "TypeAlias", "Enumerations", "*"],
    kindSortOrder: [
        "Document",
        "Project",
        "Module",
        "Namespace",
        "Function",
        "Class",
        "Constructor",
        "Property",
        "Variable",
        "Accessor",
        "Method",
        "Parameter",
        "TypeParameter",
        "TypeLiteral",
        "CallSignature",
        "ConstructorSignature",
        "IndexSignature",
        "GetSignature",
        "SetSignature",
        "Enum",
        "EnumMember",
        "TypeAlias",
        "Interface",
        "Reference",
    ],
    json: "docs/typedoc.json",
    customCss: "./files/assets/typedoc-custom.css",
    customJs: ["./files/assets/typedoc-custom.js"],
    coverageLabel: "documentation",
};
