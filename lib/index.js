'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = tinymd;
var ESC = '\\[!]#{()}*+-._';
var ESC_OFFSET = 16;

var lex = function lex(md, opts) {
  return md
  // temporarily replace escaped chars by control characters
  .replace(/\\([(){}[\]#*+\-.!_\\])/g, function (_, char) {
    return String.fromCharCode(1, ESC.indexOf(char) + ESC_OFFSET);
  })
  // two-char delimiter inline styles
  .replace(/(\*\*|__|~~)(\S(?:[\s\S]*?\S)?)\1/g, function (_, delim, text) {
    return delim === '~~' ? '<del>' + text + '</del>' : '<b>' + text + '</b>';
  })
  // one-char delimiter inline styles
  .replace(/(\n|^|\W)([_*])(\S(?:[\s\S]*?\S)?)\2(\W|$|\n)/g, function (_, start, delim, text, end) {
    return start + '<i>' + text + '</i>' + end;
  })
  // links and images
  .replace(/(!?)\[([^\]<>]+)\]\(\s*(\+?)([^")]+?)(?: "([^()"]+)")?\s*\)/g, function (_, img, text, blank, ref, title) {
    var attrs = title ? ' title="' + title + '"' : '';
    if (img) return '<img src="' + opts.rewrite(ref) + '" alt="' + text + '"' + attrs + '/>';
    if (blank) attrs += ' target="_blank"';
    return '<a href="' + opts.rewrite(ref) + '"' + attrs + '>' + text + '</a>';
  });
};

// transform control characters back original
var unesc = function unesc(s) {
  return (
    // eslint-disable-next-line no-control-regex
    s.replace(/\x01([\x0f-\x1c])/g, function (_, c) {
      return ESC.charAt(c.charCodeAt(0) - ESC_OFFSET);
    })
  );
};

function chunk(m, opts) {
  // blocks indented by 4 spaces
  var code = /^\s{4}([^]*)$/.exec(m);
  if (code) {
    return '<pre><code>' + code[1].replace(/\n {4}/g, '\n') + '</code></pre>';
  }

  var rows = lex(m, opts).split('\n');

  // map rows to [text, type, level]
  var blocks = rows.map(function (row) {
    var heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(row);
    if (heading) {
      var _heading = _slicedToArray(heading, 3),
          level = _heading[1],
          text = _heading[2];

      return [text, 'h', level.length];
    }
    var list = /^(\s*)(?:[-*]|(\d[.)])) (.+)$/.exec(row);
    if (list) {
      var _list = _slicedToArray(list, 4),
          _level = _list[1],
          ordered = _list[2],
          _text = _list[3];

      return [_text, ordered ? 'ol' : 'ul', _level.length];
    }
    if (/^\s{0,3}([-])(\s*\1){2,}\s*$/.test(row)) {
      return ['', 'hr'];
    }
    return [row, '+', ''];
  });

  // move continuations to previous block
  blocks.reduce(function (prev, cur, i) {
    if (cur[1] === '+') {
      if (prev && prev[1] !== 'hr' && prev[1] !== 'h') {
        prev[0] += '\n' + cur[0];
        blocks.splice(i, 1);
      } else cur[1] = 'p';
    }
    return cur;
  }, null);

  var out = [];
  var lists = [];

  var append = function append(s) {
    out.push(s);
  };
  var close = function close() {
    append('</li></' + lists.shift().tag + '>');
  };

  blocks.forEach(function (cur) {
    var _cur = _slicedToArray(cur, 3),
        text = _cur[0],
        tag = _cur[1],
        level = _cur[2];

    if (tag === 'ul' || tag === 'ol') {
      while (lists.length > 1 && level <= lists[1].level) {
        close();
      }
      if (!lists.length || level > lists[0].level) {
        // first list or deeper level
        lists.unshift({ tag: tag, level: level });
        return append('<' + lists[0].tag + '><li>' + text);
      }
      // same level
      return append('</li><li>' + text);
    }
    while (lists.length) {
      close();
    }if (tag === 'hr') return append('<hr/>');

    // heading
    var attrs = opts.headingAttrs(level, text);
    append('<' + tag + level + attrs + '>' + text + '</' + tag + level + '>');
  });

  while (lists.length) {
    close();
  }return unesc(out.join(''));
}

var hdId = function hdId(level, text) {
  return ' id="' + text.replace(/[^a-z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/^_*(.*?)_*$/, '$1').toLowerCase() + '"';
};

function tinymd(md) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var o = {
    headingAttrs: opts.headingAttrs || opts.addIds ? hdId : function () {
      return '';
    },
    rewrite: opts.rewrite || function (s) {
      return s;
    }
  };
  return md.replace(/.+(?:\n.+)*/g, function (m) {
    return chunk(m, o);
  });
}