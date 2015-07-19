var rewrite = require('./');
var fs = require('fs');

require('tape')(function(test) {
  require('glob').sync('examples/*.md').forEach(function(markdownPath) {
    var js = markdownPath.replace(/\.md$/, '.js');
    test.equal(
      rewrite(fs.readFileSync(markdownPath).toString()) + '\n',
      fs.readFileSync(js).toString(),
      markdownPath
    );
  });
  test.end();
});
