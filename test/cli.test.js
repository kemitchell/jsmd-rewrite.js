var join = require('path').join;
var nixt = require('nixt');
var bin = join(__dirname, '..');

var app = function() {
  return nixt({ newlines: false })
    .cwd(bin)
    .base('./jsmd-rewrite ')
    .clone();
};

test('--version', function(done) {
  app()
  .stdout(require('../package.json').version)
  .run('--version')
  .end(done);
});

test('--help', function(done) {
  app()
  .stdout(/Usage: jsmd-rewrite <path>/)
  .run('--help')
  .end(done);
});

test('Rewrites Markdown files', function(done) {
  app()
  .stdout('')
  .code(0)
  .run(fixture('empty'))
  .end(done);
});
