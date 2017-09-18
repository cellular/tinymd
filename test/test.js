import tinymd from '../src';

const spec = (name, md, opts) =>
  test(name, () => {
    expect(tinymd(md, opts)).toMatchSnapshot();
  });

spec('Paragraph', 'Lorem ipsum');

spec(
  'Inline styles',
  '__bold__ regular ~~del~~ *italic* __bold__ ~~*deli*~~ **_boldi_** regular *ital*'
);

spec('Non-italic snake case', 'Text _italic_ snake_case_text');

spec(
  'Multiple paragraphs',
  `**bold**
line 1
line 2

line 3
**bold**
`
);

spec(
  'Code blocks',
  `Lorem
ipsum

    let md = 'hello';
    md += 'world';

dolor sit amed
`
);

spec(
  'Headings',
  `# h1
## h2
### h3
#### h4
##### h4
###### h6
####### no heading

#nospace-noheading

# trailing hashes #######################
# `
);

spec(
  'Unordered lists',
  `
* 1st level
   * 2nd level
   * 2nd
 * 2nd level
* 1st level`
);

spec(
  'Unorderd lists with dashes',
  `
* 1st level
   - 2nd level
   - 2nd
   - 2nd level
* 1st level`
);

spec(
  'Ordered lists',
  `
* 1st level
   1. 2nd level
   2. 2nd
   3. 2nd level
* 1st level`
);

spec(
  'Mixed lists',
  `
* 1st level
   1. 2nd level
   2. 2nd
   3. 2nd level
----`
);

spec(
  'Links',
  `lorem [example](http://example.com) ![alt](/image.jpg) [with title](/link.html "title") [blank target](+http://example.com) ipsum`
);

spec('Links with whitespace', `lorem [example]( mailto: me@example.com )`);

spec(
  'Horizontal rulers',
  `---
-- - - - - -
------------------------------------`
);

spec('Escaped asterisks', `aaa \\*bbb\\* ccc* \\\\ddd`);

spec('Escaped hashes', `aaa \\#bbb\\+ ccc\\- ddd`);

spec('Escaped chars', `aaa \\.bbb\\! ccc- ddd`);

spec('Escaped links', `aaa \\[bbb\\]\\(http://example.com\\) ccc ddd`);

spec('Escaped braces', `aaa \\{bbb\\} ccc`);

spec(
  'README example',
  `
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

And \\[escaping]\\(of special chars).
`
);

spec('Link rewriting', '[Issue 42](#42)', {
  rewrite: s => {
    const m = /^#(\d+)/.exec(s);
    return m ? `/issue${m[1]}` : s;
  }
});

spec('Header ids', '# Hello World', { addIds: true });

spec('Custom target _blank', '[foo](foo) [bar](bar)', {
  isBlank: s => s == 'foo'
});
