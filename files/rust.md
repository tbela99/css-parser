---
title: Rust crate
group: Documents
category: Guides
---

## Rust crate

[`rust-css-parser`](https://crates.io/crates/rust-css-parser) is CSS-Parser as a Rust library, published on
crates.io. It is the library that the [native build](./native.md) and the [WebAssembly build](./wasm.md) are built
from. It parses, validates, minifies and renders CSS with the same options and the same output as
`@tbela99/css-parser`.

| Package | Used from | Registry |
|---------|-----------|----------|
| [`@tbela99/rust-css-parser-napi`](./native.md) | Node.js on macOS and Linux | npm, JSR |
| [`@tbela99/rust-css-parser-wasm`](./wasm.md) | Node.js, the browsers | npm, JSR |
| `rust-css-parser` | Rust | crates.io |

The source code is in the [rust-css-parser](https://github.com/tbela99/rust-css-parser) repository.

## Installation

```shell
$ cargo add rust-css-parser
```

or in `Cargo.toml`:

```toml
[dependencies]
rust-css-parser = "2.3"
```

The crate is imported as `rust_css_parser`. It has no native dependency: the syntax data are embedded.

## Usage

There is no single entry point like `transform()`: you create a tokenizer, parse it, then render the result.

```rust
use rust_css_parser::host::NoHost;
use rust_css_parser::options::{ParserOptions, SourcesMap};
use rust_css_parser::parser::input::CssInput;
use rust_css_parser::parser::parse::do_parse_sync;
use rust_css_parser::parser::source::SourceFile;
use rust_css_parser::parser::tokenize::{create_parse_info, Tokenizer};
use rust_css_parser::printer::render::do_render;
use std::rc::Rc;

let css = ".a { color: rgb(255 0 0); width: calc(1px + 2px) } .b { color: red }";

// the source file: the locations, the source maps and the string table refer to it
let source = SourceFile::new(Rc::from(css), Vec::new(), Some(Rc::from("in.css")));
let sources = SourcesMap::default();
sources.borrow_mut().insert(source.id, source.clone());

let options = ParserOptions { minify: Some(true), source: Some(source.clone()), sources_map: Some(sources), ..Default::default() };
let tokenizer = Tokenizer::new(create_parse_info(Some(&CssInput::from(css)), source));

// NoHost: no callbacks (visitors, load(), ...)
let result = do_parse_sync(tokenizer, options, None, Rc::new(NoHost)).expect("parse");

let rendered = do_render(&result.arena, result.ast, &ParserOptions { minify: Some(true), ..Default::default() }, None);

assert_eq!(rendered.code(), ".a{color:red;width:3px}.b{color:red}");
```

- The options are the options of the TypeScript library in snake case (`ParserOptions`): `minify`, `fast_mode`,
  `merge_rules`, `nesting_rules`, `validation`, ...
- `do_parse_sync()` parses synchronously and `do_parse()` is the async version. The callbacks (visitors, `load()` of
  the imported files, `generateScopedName`) are called through a `Host`. Use `NoHost` when there are none.
- The AST is stored in an arena: a node is an id, and its fields are read from the columns of the arena
  (`arena.first_child.get(node)`, `arena.children(node)`, `arena.get_name(node)`, ...). See
  [Arena Memory](./arena.md).

## Modules

The crate is a file-by-file port of the TypeScript sources: its modules mirror `src/` and the functions keep their
names in snake case.

| Module | TypeScript | Content |
|--------|------------|---------|
| `parser::tokenize` | `parser/tokenize.ts` | tokenizer |
| `parser::parse` | `parser/parse.ts` | `do_parse()`, `do_parse_sync()`, `parse_string()`, `parse_declarations()` |
| `ast::arena` | `ast/arena.ts` | the arena: column storage of the nodes and the tokens |
| `ast::minify`, `ast::features` | `ast/minify.ts`, `ast/features/*` | minification |
| `printer::render` | `printer/render.ts` | `do_render()`, `render_value()` |
| `printer::sourcemap` | `printer/sourcemap.ts` | source maps |
| `syntax::color` | `syntax/color/*` | color parsing and conversion |
| `validation` | `validation/*` | syntax validation |

The API reference is on [docs.rs](https://docs.rs/rust-css-parser).

------
[← WebAssembly build](./wasm.md) | [Performance →](./performance.md)
