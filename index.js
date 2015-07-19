var Lexer = require('marked').Lexer;
var parse = require('esprima').parse;
var replace = require('estraverse').replace;
var generate = require('escodegen').generate;

var LINE_COMMENT = 'Line';
var EXPRESSION = 'ExpressionStatement';

var CODE = 'code';
var HTML = 'html';

function Rewriter(input, name) {
  name = name ? name : '__jsmd__';
  this.input = input.replace(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g, '\n');
  this.name = name;
  this.assertions = [];
}

Rewriter.prototype.extractJavaScript = function() {
  var buff = [];
  var lexer = new Lexer();

  lexer.lex(this.input).forEach(function(token) {
    if (token.type === CODE && ~['js', 'javascript'].indexOf(token.lang)) {
      buff.push(token.text);
    }

    if (token.type === HTML) {
      var match = token.text.trim().match(/^<!--\s*(js|javascript)\s+([\S\s]*)-->$/);
      if (match) buff.push(match[2]);
    }
  });

  return this.generateAssertions(buff.join('\n'));
};

Rewriter.prototype.generateAssertions = function(code) {
  var tree = this.parse(code);
  var ast = this.buildAst(tree, code);
  return generate(tree);
};

Rewriter.prototype.parse = function(code) {
  var tree = parse(code, { comment: true, range: true, tokens: true, loc: true });

  tree.comments.forEach(function(comment) {
    if (comment.type !== LINE_COMMENT) return;
    var match = /^\s*=>\s*/.exec(comment.value);
    if (!match) return;
    var raw = comment.value.substring(match[0].length);
    var line = comment.loc.start.line;
    raw = '(function() { return ' + raw + '; })()';
    this.assertions[line] = parse(raw).body[0].expression.callee.body.body[0].argument;
  }, this);

  return tree;
};

Rewriter.prototype.buildAst = function(ast, input) {
  var assertions = this.assertions;
  var self = this;

  return replace(ast, {
    leave: function(node) {
      if (node.type !== EXPRESSION) return node;
      var line = node.loc.end.line;
      var newlines = input.substring(node.range[0], node.range[1]).match(/\n(?=\s*$)/g) || [];
      line -= newlines.length;
      if (!assertions.hasOwnProperty(line)) return node;
      return self.assertion(node.expression, assertions[line]);
    }
  });
};

Rewriter.prototype.assertion = function(first, second) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: this.name,
      },
      arguments: [first, second]
    }
  };
};

module.exports = function(input, name) {
  return (new Rewriter(input, name)).extractJavaScript();
};
