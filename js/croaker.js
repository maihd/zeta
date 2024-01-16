var croaker = (function () {
    var parsing = [];
    var lexer = null;
    return {
        croak: croak,

        setLexer: function (l) {
            lexer = l;
        },

        begin: function (type) {
            parsing.push(syntaxTypeToString(type) || syntaxTypeToString(Syntaxes.Unknown));   
        },

        end: function () {
            parsing.pop();
        },

        require: function (type, tokenType) {
            croak('require a <' + syntaxTypeToString(type) + '>. there is <' + syntaxTypeToString(tokenType) + '>.');
        },

        expecting: function (type, tokenType) {
            croak('expecting a <' + syntaxTypeToString(type) + '>. there is <' + syntaxTypeToString(tokenType) + '>.');
        },

        unexpected: function (type, tokenType) {
            croak('expecting a <' + syntaxTypeToString(type) + '>. there is <' + syntaxTypeToString(tokenType) + '>.');
        }
    };

    function croak(message) {
        return lexer.croak('[syntax:' + parsing[parsing.length - 1] + '] ' + message);
    }
})();