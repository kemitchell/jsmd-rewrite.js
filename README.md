Rewrite code examples in Markdown code blocks as test assertions.

Rewrite this:

    # Title of Your README.md

    This is _Markdown_!

	<!--javascript
	  var additionModule = require('./');
	-->

	The above won't be rendered in HTML, such as on GitHub or
	npmjs.com, but it will be included in the rewritten
	JavaScript.

	The JavaScript expressions with comments that follow will
	be rewritten as asssertions.
    
    ```javascript
	additionmodule(1, 1); // => 2
	additionmodule(2, 2); // => 4
    ```

into this:

```javascript
var additionModule = require('./');
__jsmd__(additionModule(l, 1), 2, 'line 1');
__jsmd__(additionModule(2, 2), 4, 'line 2');
```

Commmand-Line Interface
=======================

```shellsesssion
$ npm install --global jsmd-rewrite
$ jsmd-rewrite --version
$ jsmd-rewrite --help
$ jsmd-rewrite README.md
```

Node.js
=======

Install:

```shellsession
$ npm install --save jsmd-rewrite
```

then:

```javascript
var rewrite = require('jsmd-rewrite');
rewrite(markdown); // returns string
rewrite(markdown, assertionFunctionName); // returns string
```

The function name used for assertions is `"__jsmd__"` by default.
