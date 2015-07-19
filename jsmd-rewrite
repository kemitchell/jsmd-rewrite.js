#!/usr/bin/env node
var transform = require('./')
require('stdin-transform-cli')(
  require('./package'),
  function(input, callback) {
    try {
      callback(null, transform(input)) }
    catch (error) {
      callback(error) } })()
