const ESC = '\\[!]#{()}*+-._';
const ESC_OFFSET = 16;

const lex = (md, opts) =>
  md
    // temporarily replace escaped chars by control characters
    .replace(/\\([(){}[\]#*+\-.!_\\])/g, (_, char) =>
      String.fromCharCode(1, ESC.indexOf(char) + ESC_OFFSET)
    )
    // two-char delimiter inline styles
    .replace(
      /(\*\*|__|~~)(\S(?:[\s\S]*?\S)?)\1/g,
      (_, delim, text) =>
        delim === '~~' ? `<del>${text}</del>` : `<b>${text}</b>`
    )
    // one-char delimiter inline styles
    .replace(
      /(\n|^|\W)([_*])(\S(?:[\s\S]*?\S)?)\2(\W|$|\n)/g,
      (_, start, delim, text, end) => `${start}<i>${text}</i>${end}`
    )
    // links and images
    .replace(
      /(!?)\[([^\]<>]+)\]\(\s*(\+?)([^")]+?)(?: "([^()"]+)")?\s*\)/g,
      (_, img, text, blank, ref, title) => {
        let attrs = title ? ` title="${title}"` : '';
        if (img)
          return `<img src="${opts.rewrite(ref)}" alt="${text}"${attrs}/>`;
        if (blank) attrs += ' target="_blank"';
        return `<a href="${opts.rewrite(ref)}"${attrs}>${text}</a>`;
      }
    );

// transform control characters back original
const unesc = s =>
  // eslint-disable-next-line no-control-regex
  s.replace(/\x01([\x0f-\x1c])/g, (_, c) =>
    ESC.charAt(c.charCodeAt(0) - ESC_OFFSET)
  );

function chunk(m, opts) {
  // blocks indented by 4 spaces
  const code = /^\s{4}([^]*)$/.exec(m);
  if (code) {
    return `<pre><code>${code[1].replace(/\n {4}/g, '\n')}</code></pre>`;
  }

  const rows = lex(m, opts).split('\n');

  // map rows to [text, type, level]
  const blocks = rows.map(row => {
    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(row);
    if (heading) {
      const [, level, text] = heading;
      return [text, 'h', level.length];
    }
    const list = /^(\s*)(?:[-*]|(\d[.)])) (.+)$/.exec(row);
    if (list) {
      const [, level, ordered, text] = list;
      return [text, ordered ? 'ol' : 'ul', level.length];
    }
    if (/^\s{0,3}([-])(\s*\1){2,}\s*$/.test(row)) {
      return ['', 'hr'];
    }
    return [row, '+', ''];
  });

  // move continuations to previous block
  let i = blocks.length;
  while (i--) {
    const cur = blocks[i];
    if (cur[1] === '+') {
      if (i) {
        const prev = blocks[i - 1];
        if (prev[1] !== 'hr' && prev[1] !== 'h') {
          prev[0] += '\n' + cur[0];
          blocks.splice(i, 1);
          continue;
        }
      }
      cur[1] = 'p';
    }
  }

  const out = [];
  const lists = [];

  const append = s => {
    out.push(s);
  };
  const close = () => {
    append(`</li></${lists.shift().tag}>`);
  };

  blocks.forEach(cur => {
    const [text, tag, level] = cur;
    if (tag === 'ul' || tag === 'ol') {
      while (lists.length > 1 && level <= lists[1].level) {
        close();
      }
      if (!lists.length || level > lists[0].level) {
        // first list or deeper level
        lists.unshift({ tag, level });
        return append(`<${lists[0].tag}><li>${text}`);
      }
      // same level
      return append(`</li><li>${text}`);
    }
    while (lists.length) close();
    if (tag === 'hr') return append('<hr/>');

    // heading
    const attrs = opts.headingAttrs(level, text);
    append(`<${tag}${level}${attrs}>${text}</${tag}${level}>`);
  });

  while (lists.length) close();
  return unesc(out.join(''));
}

const hdId = (level, text) =>
  ` id="${text
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_*(.*?)_*$/, '$1')
    .toLowerCase()}"`;

export default function tinymd(md, opts = {}) {
  const o = {
    headingAttrs: opts.headingAttrs || opts.addIds ? hdId : () => '',
    rewrite: opts.rewrite || (s => s)
  };
  return md.replace(/.+(?:\n.+)*/g, m => chunk(m, o));
}
