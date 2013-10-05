// Generated by CoffeeScript 1.6.3
var Parser, stream, util;

stream = require('stream');

util = require('util');

Parser = function(options) {
  var _base, _base1, _base10, _base2, _base3, _base4, _base5, _base6, _base7, _base8, _base9;
  if (options == null) {
    options = {};
  }
  options.objectMode = true;
  stream.Transform.call(this, options);
  this.options = options;
  if ((_base = this.options).rowDelimiter == null) {
    _base.rowDelimiter = null;
  }
  if ((_base1 = this.options).delimiter == null) {
    _base1.delimiter = ',';
  }
  if ((_base2 = this.options).quote == null) {
    _base2.quote = '"';
  }
  if ((_base3 = this.options).escape == null) {
    _base3.escape = '"';
  }
  if ((_base4 = this.options).columns == null) {
    _base4.columns = null;
  }
  if ((_base5 = this.options).comment == null) {
    _base5.comment = '#';
  }
  if ((_base6 = this.options).flags == null) {
    _base6.flags = 'r';
  }
  if ((_base7 = this.options).encoding == null) {
    _base7.encoding = 'utf8';
  }
  if ((_base8 = this.options).trim == null) {
    _base8.trim = false;
  }
  if ((_base9 = this.options).ltrim == null) {
    _base9.ltrim = false;
  }
  if ((_base10 = this.options).rtrim == null) {
    _base10.rtrim = false;
  }
  this.lines = 0;
  this.buf = '';
  this.quoting = false;
  this.commenting = false;
  this.field = '';
  this.lastC = '';
  this.nextChar = null;
  this.closingQuote = 0;
  this.line = [];
  this.chunks = [];
  return this;
};

util.inherits(Parser, stream.Transform);

Parser.prototype._transform = function(chunk, encoding, callback) {
  if (chunk instanceof Buffer) {
    chunk = chunk.toString();
  }
  this.__write(chunk);
  return callback();
};

Parser.prototype._flush = function(callback) {
  this.__write('', true);
  if (this.quoting) {
    return this.error(new Error("Quoted field not terminated at line " + (this.lines + 1)));
  }
  if (this.field || this.lastC === this.options.delimiter || this.lastC === this.options.quote) {
    if (this.options.trim || this.options.rtrim) {
      this.field = this.field.trimRight();
    }
    this.line.push(this.field);
    this.field = '';
  }
  if (this.line.length > 0) {
    this.push(this.line);
  }
  return callback();
};

Parser.prototype.__write = function(chars, end) {
  var areNextCharsRowDelimiters, char, delimLength, escapeIsQuote, i, isDelimiter, isEscape, isQuote, isRowDelimiter, l, ltrim, nextNextCharPas, nextNextCharPos, rowDelimiter, rtrim, _results;
  ltrim = this.options.trim || this.options.ltrim;
  rtrim = this.options.trim || this.options.rtrim;
  chars = this.buf + chars;
  l = chars.length;
  delimLength = this.options.rowDelimiter ? this.options.rowDelimiter.length : 0;
  i = 0;
  if (this.lines === 0 && this.options.encoding === 'utf8' && 0xFEFF === chars.charCodeAt(0)) {
    i++;
  }
  while (i < l) {
    if ((i + delimLength >= l && chars.substr(i, this.options.rowDelimiter.length) !== this.options.rowDelimiter) && !end) {
      break;
    }
    if ((i + this.options.escape.length >= l && chars.substr(i, this.options.escape.length) === this.options.escape) && !end) {
      break;
    }
    char = this.nextChar ? this.nextChar : chars.charAt(i);
    this.lastC = char;
    this.nextChar = chars.charAt(i + 1);
    if (this.options.rowDelimiter == null) {
      if ((this.line.length === 0 && this.field === '') && (char === '\n' || char === '\r')) {
        rowDelimiter = char;
        nextNextCharPos = i + 1;
      } else if (this.nextChar === '\n' || this.nextChar === '\r') {
        rowDelimiter = this.nextChar;
        nextNextCharPas = i + 2;
      }
      if (rowDelimiter) {
        this.options.rowDelimiter = rowDelimiter;
        if (rowDelimiter === '\r' && chars.charAt(nextNextCharPas) === '\n') {
          this.options.rowDelimiter += '\n';
        }
        delimLength = this.options.rowDelimiter.length;
      }
    }
    if (char === this.options.escape) {
      escapeIsQuote = this.options.escape === this.options.quote;
      isEscape = this.nextChar === this.options.escape;
      isQuote = this.nextChar === this.options.quote;
      if (!(escapeIsQuote && !this.field && !this.quoting) && (isEscape || isQuote)) {
        i++;
        char = this.nextChar;
        this.nextChar = chars.charAt(i + 1);
        this.field += char;
        i++;
        continue;
      }
    }
    if (char === this.options.quote) {
      if (this.quoting) {
        areNextCharsRowDelimiters = this.options.rowDelimiter && chars.substr(i + 1, this.options.rowDelimiter.length) === this.options.rowDelimiter;
        if (this.nextChar && !areNextCharsRowDelimiters && this.nextChar !== this.options.delimiter && this.nextChar !== this.options.comment) {
          return this.error(new Error("Invalid closing quote at line " + (this.lines + 1) + "; found " + (JSON.stringify(this.nextChar)) + " instead of delimiter " + (JSON.stringify(this.options.delimiter))));
        }
        this.quoting = false;
        this.closingQuote = i;
        i++;
        continue;
      } else if (!this.field) {
        this.quoting = true;
        i++;
        continue;
      }
    }
    isDelimiter = char === this.options.delimiter;
    isRowDelimiter = this.options.rowDelimiter && chars.substr(i, this.options.rowDelimiter.length) === this.options.rowDelimiter;
    if (!this.commenting && !this.quoting && char === this.options.comment) {
      this.commenting = true;
    } else if (this.commenting && isRowDelimiter) {
      this.commenting = false;
    }
    if (!this.commenting && !this.quoting && (isDelimiter || isRowDelimiter)) {
      if (isRowDelimiter && this.line.length === 0 && this.field === '') {
        i += this.options.rowDelimiter.length;
        this.nextChar = chars.charAt(i);
        continue;
      }
      if (rtrim) {
        if (this.closingQuote) {
          this.field = this.field.substr(0, this.closingQuote);
        } else {
          this.field = this.field.trimRight();
        }
      }
      this.line.push(this.field);
      this.closingQuote = 0;
      this.field = '';
      if (isRowDelimiter) {
        this.push(this.line);
        this.line = [];
        i += this.options.rowDelimiter.length;
        this.nextChar = chars.charAt(i);
        continue;
      }
    } else if (!this.commenting && !this.quoting && (char === ' ' || char === '\t')) {
      if (!(ltrim && !this.field)) {
        this.field += char;
      }
    } else if (!this.commenting) {
      this.field += char;
    }
    i++;
  }
  this.buf = '';
  _results = [];
  while (i < l) {
    this.buf += chars.charAt(i);
    _results.push(i++);
  }
  return _results;
};

module.exports = function() {
  return new Parser();
};

module.exports.Parser = Parser;