/* MIT License
 * 
 * Copyright (C) 2013 Veselin Todorov (hi@vesln.com)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var Lexer = require('marked').Lexer;
var parse = require('esprima').parse;
var replace = require('estraverse').replace;
var generate = require('escodegen').generate;

var LINE_COMMENT = 'Line';
var EXPRESSION = 'ExpressionStatement';

var CODE = 'code';
var HTML = 'html';

function Rewriter(input, assertName) {
  assertName = assertName ? assertName : '__jsmd__';
  this.input = input.replace(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g, '\n');
  this.assertName = assertName;
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
      var lineAST = {
        type: 'Literal',
        value: 'line ' + line
      };
      return self.assertionAST(node.expression, assertions[line], lineAST);
    }
  });
};

Rewriter.prototype.assertionAST = function(first, second, message) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: this.assertName,
      },
      arguments: [first, second, message]
    }
  };
};

module.exports = function(input, assertName) {
  return (new Rewriter(input, assertName)).extractJavaScript();
};
