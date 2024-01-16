function isPunctuation(char) {
    var punctuations = ';{}[]():,\'`".';
    return punctuations.indexOf(char) > -1;
}

function isClosePunctuation(char) {
    var punctuations = ';}]),.';
    return punctuations.indexOf(char) > -1;
}

function isSpace(char) {
    return /\s/.test(char);
}

function Lexer(code) {
    return (function (stream) {
        var current = null;

        var atoms = [
            { name: Syntaxes.Bool, match: '(true|false)' },
            { name: Syntaxes.Null, match: 'null' },
            { name: Syntaxes.Arrow, match: '\\->' }, 
            { name: Syntaxes.Keyword, match: '(@define|@import|@export|@if|if|then|else|lambda|let|var)' },
            { name: Syntaxes.Number, match: '(\\+|\\-)?(0x[0-9a-fA-F]|0b[0-1]|[0-9])' },
            { name: Syntaxes.Name, match: '.+' },
        ];

        var literials = [
            { name: Syntaxes.Regexp, begin: '`', end: '`' },
            { name: Syntaxes.String, begin: '"', end: '"' },
            { name: Syntaxes.String, begin: "'", end: "'" },
            { name: Syntaxes.Comment, begin: ';', end: '\n' }
        ];

        function equalCharPredicate(char) {
            return function (other) {
                return char == other;
            }
        }

        function notCharPredicate(char) {
            return function (other) {
                return char != other;
            }
        }

        function notPunctuationAndSpace(char) {
            return !isPunctuation(char) && !isSpace(char);
        }

        return {
            code: code,
            peek: peek,
            next: next,
            eof: eof,
            croak: stream.croak,
        }

        function scanWhile(predicate) {
            var char = stream.peek();
            var data = '';
            while (!stream.eof() && char && predicate(char)) {
                data = data + char;
                char = stream.next();
            }
            return data;
        }

        function scan() {
            scanWhile(isSpace);

            var char = stream.peek();

            if (stream.eof() || char.length == 0) return null;

            var type = null;
            var data = null;

            literials.some(function (pattern) {
                if (pattern.begin == char) {
                    var begin = pattern.begin;
                    var end = pattern.end;
                    stream.next();
                    data = begin + scanWhile(notCharPredicate(end)) + end;
                    type = pattern.name;
                    stream.next();
                    return true;
                }
            });

            if (type) return { type: type, data: data };

            if (!isPunctuation(char)) {
                data = scanWhile(notPunctuationAndSpace);
                atoms.some(function (pattern) {
                    var regexp = new RegExp('^' + pattern.match + '$');
                    if (regexp.test(data)) {
                        type = pattern.name;
                        return true;   
                    }
                });
                type = type || Tokens.Unknown;
            } else {
                data = char
                type = Syntaxes.Punctuation;
                if (stream.next() == ':' && char == ':') {
                    data = '::';
                    stream.next();
                }
            }
            
            return {
                type: type,
                data: data
            };
        }

        function peek() {
            return current || (current = scan());
        }

        function next() {
            return (current = scan());
        }

        function eof() {
            return peek() == null;
        }
    })((function (buffer) {
        var line = 1;
        var column = 1;
        var current = 0;

        return {
            peek: peek,
            next: next,
            eof: eof,
            croak: croak,
            position: function () {
                return current;
            },
            column: function () {
                return column;
            },
            line: function () {
                return line;
            }
        };

        function peek() {
            return buffer.charAt(current);
        }

        function next() {
            var char = buffer.charAt(++current);
            if (char == '\n') {
                line = line + 1;
                column = 1;
            } else {
                column = column + 1;
            }
            return char;
        }
        
        function eof() {
            return peek() == '';
        }

        function croak(message) {
            if (message) {
                throw message + ' - line: ' + line + ', column: ' + column + ' .' 
            } 
        }
    })(code));
}