var rewrite = require('../');
var fs = require('fs');

function run(fixtureName, callback) {
  var input = fs.readFileSync(fixture(fixtureName)).toString();
  var rewritten = rewrite(input);
  input = 'var __jsmd__ = require("assert").deepEqual;' + rewritten;
  try {
    eval(input); // jshint ignore:line
  } catch (e) {
    callback(e);
  }
  callback();
}

test('ignores code different than javascript', function(done) {
  run('ruby', done);
});

test('ignores line comments that are not assertions', function(done) {
  run('line-comments', done);
});

test('can assert properly', function(done) {
  run('assertions', done);
});

test('returns an error when the verification was not successful', function(done) {
  run('bad', function(err) {
    err.should.be.ok;
    done();
  });
});

test('can require relative files', function(done) {
  run('require', done);
});
