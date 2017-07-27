# tinymd 💃

## Why

All other solutions were either _too large_ to be used in webapps where bundle size is important or _too constraint_ (like missing support for paragraphs or nested lists).

Tinymd tries to strike a good balance between size and features. It's fully tested and works in browsers as well as in Node.

The underlying parsing alorithm is heavily based on Vladimir Antonov's [nano-markdown](https://github.com/Holixus/nano-markdown) implementation.

## Basic Usage

```js
import tinymd from 'tinymd';

const opts = {};
const html = tinymd('', opts);
```

## Supported markdown syntax

```markdown
# tinymd

supports ...

* lists
  - nested lists
    1. ordered
    2. with [links](http://example.com)
  - ![images](/cat.jpg)
  - rulers

----

All ~~common~~ **inline** _styles_

    code blocks
    rulers

And \[escaping]\(of special chars).
```

## Options

### Rewriting Links

```js
tinynmd('[Issue 42](#42)', {
  rewrite: s => {
    const m = /^#(\d+)/.exec(s);
    return m ? `/issue${m[1]}` : s;
  }
};
```

### Adding headline anchors

```js
tinynmd('# hello world', { addIds: true });
// <h1 id="hello_world">hello world</h1>
```

## License

MIT
