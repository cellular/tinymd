'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var ESC = '\\[!]#{()}*+-._';
var ESC_OFFSET = 16;

function lex(a) {
  return a.replace(/\\([(){}[\]#*+\-.!_\\])/g, function (_, char) {
    return String.fromCharCode(1, ESC.indexOf(char) + ESC_OFFSET);
  }).replace(/(\*\*|__|~~)(\S(?:[\s\S]*?\S)?)\1/g, function (_, delim, text) {
    return delim === '~~' ? '<del>' + text + '</del>' : '<b>' + text + '</b>';
  }).replace(/(\n|^|\W)([_*])(\S(?:[\s\S]*?\S)?)\2(\W|$|\n)/g, function (_, start, delim, text, end) {
    return start + '<i>' + text + '</i>' + end;
  }).replace(/(!?)\[([^\]<>]+)\]\(\s*(\+?)([^")]+?)(?: "([^()"]+)")?\s*\)/g, function (_, img, text, blank, ref, title) {
    var attrs = title ? ' title="' + title + '"' : '';
    if (img) return '<img src="' + nmd.href(ref) + '" alt="' + text + '"' + attrs + '/>';
    if (blank) attrs += ' target="_blank"';
    return '<a href="' + nmd.href(ref) + '"' + attrs + '>' + text + '</a>';
  });
}

function unesc(a) {
  return a.replace(/\x01([\x0f-\x1c])/g, function (m, c) {
    return ESC.charAt(c.charCodeAt(0) - ESC_OFFSET);
  });
}

function chunk(m) {
  var code = /^\s{4}([^]*)$/.exec(m);
  if (code) {
    return '<pre><code>' + code[1].replace(/\n {4}/g, '\n') + '</code></pre>';
  }

  var rows = lex(m).split('\n');

  var blocks = rows.map(function (row) {
    var heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(row);
    if (heading) {
      var _heading = _slicedToArray(heading, 3),
          lvl = _heading[1],
          text = _heading[2];

      return [text, 'h', lvl.length];
    }
    var list = /^(\s*)(?:[-*]|(\d[.)])) (.+)$/.exec(row);
    if (list) {
      var _list = _slicedToArray(list, 4),
          _lvl = _list[1],
          ordered = _list[2],
          _text = _list[3];

      return [_text, ordered ? 'ol' : 'ul', _lvl.length];
    }
    if (/^\s{0,3}([-])(\s*\1){2,}\s*$/.test(row)) {
      return ['', 'hr'];
    }
    return [row, '+', ''];
  });

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
        lvl = _cur[2];

    if (tag === 'ul' || tag === 'ol') {
      while (lists.length > 1 && lvl <= lists[1].lvl) {
        close();
      }
      if (!lists.length || lvl > lists[0].lvl) {
        // first list or deeper level
        lists.unshift({ tag: tag, lvl: lvl });
        return append('<' + lists[0].tag + '><li>' + text);
      }
      // same level
      return append('</li><li>' + text);
    }
    // close all lists
    while (lists.length) {
      close();
    }if (tag === 'hr') return append('<hr/>');
    append('<' + tag + lvl + nmd.headAttrs(lvl, text) + '>' + text + '</' + tag + lvl + '>');
  });

  // close all lists
  while (lists.length) {
    close();
  }return unesc(out.join(''));
}

var nmd = function nmd(md) {
  return md.replace(/.+(?:\n.+)*/g, chunk);
};

nmd.href = function (ref) {
  return ref;
};

nmd.headAttrs = function (level, text) {
  return '';
};
// ' id=\''+text.replace(/[^a-z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/^_*(.*?)_*$/, '$1').toLowerCase()+'\'';

exports.default = nmd;