function Parser(code, context) {
    var lexer = Lexer(code);
    var parsing = [];
    croaker.setLexer(lexer);

    return {
        parse: parseTopLevel,
        lexer: lexer
    };

    function skipWhile(data) {
        var token = lexer.peek();
        while (!lexer.eof() && token && token.data == data) {
            token = lexer.next();
        }
        return token;
    }

    function skip(type, data) {
        var token = lexer.peek();
        if (token && token.type == type && token.data == data) {
            lexer.next();
        } else {
            croaker.require(type, token.type);
        }
    }

    function skipPunctuation(data) {
        skip(Syntaxes.Punctuation, data);
    }

    function skipKeyword(data) {
        skip(Syntaxes.Keyword, data);
    }

    function until(predicate, parser) {
        var token = lexer.peek();
        var items = [];
        while (!lexer.eof() && token && !predicate(token.data)) {
            items.push(parser());
            token = lexer.peek();
        }
        return items;
    }

    function tuple(begin, end, separator, parser) {
        var items = [];
        var first = true;
        skipPunctuation(begin);
        var token = lexer.peek();
        while (!lexer.eof() && token && token.data != end) {
            if (first) first = false; else skipPunctuation(separator);
            items.push(parser());
            token = lexer.peek();
        }
        skipPunctuation(end);
        return items;
    }

    function delimit(begin, end, separator, parser) {
        var items = [];
        skipPunctuation(begin);
        var token = skipWhile(separator);
        while (!lexer.eof() && token && token.data != end) {
            token = skipWhile(separator);
            if (token && token.data != end) {
                items.push(token);
                token = lexer.next();
            }
            if (!lexer.eof() && token.data != end) {
                skipPunctuation(separator);
            }
        }
        skipPunctuation(end);
        return items;
    }

    function parseName() {
        var token = lexer.peek();
        if (token && token.type == Syntaxes.Name) {
            lexer.next();
        } else {
            croaker.expecting(Syntaxes.Name, token.type);
        }
        return token;
    }

    function maybeName() {
        var token = lexer.peek();
        if (token && token.type == Syntaxes.Name) {
            lexer.next();
            return token;
        }
        return null;
    }

    function parseNameAssign() {
        var syntax = parseName();
        var token = lexer.peek();
        skip(Syntaxes.Assign, token.data);
        syntax = Syntax.Assign(syntax, parseExpression());
        return syntax;
    }

    function parseType() {
        var name = parseName();
        var type = context.findType(name.data) || name;
        return type;
    }

    function parseVariable(name) {
        name = name || parseName();
        if (context.findPremitive(name.data)) {
            croaker.expecting(Syntaxes.Name, Syntaxes.Premitive);
        }
        var token = lexer.peek();
        var type = context.findType('%any');
        if (token && token.data == ':') {
            skipPunctuation(':');
            type = parseType();
        }
        return Syntax.Variable(name, type);
    }

    function parseVariableAssign(name) {
        var left = parseVariable();
        var token = lexer.peek();
        skip(Syntaxes.Arrow, token.data);
        return Syntax.Assign(left, parseExpression());
    }

    function maybeAssign(left) {
        left = left || parseAtom();

        var token = lexer.peek();

        if (token && token.type == Syntaxes.Arrow) {
            skip(Syntaxes.Arrow, token.data);
            if (left.type == Syntaxes.Name) {
                var found = context.findPremitive(left.data);
                if (found) {
                    croak('attempt to assign <premitive>. use <define> instead.');
                }
            }
            return Syntax.Assign(left, parseExpression());
        }

        return left;
    }

    function parseAssign() {
        var syntax = parseAtom();
        skip(Syntaxes.Assign, token.data);
        syntax = Syntax.Assign(syntax, parseExpression());

        return syntax;
    }

    function parseAtom() {
        var token = lexer.peek();
        
        if (lexer.eof() || !token) return null;

        switch (token.type) {
            case Syntaxes.Keyword:
                switch (token.data) {
                    case 'if':      return parseIf();
                    case 'let':     return parseLet();
                    case 'var':     return parseVariableDefine();
                    case 'lambda':  return parseLambda();
                }
                break;

            case Syntaxes.Punctuation:
                switch (token.data) {
                    case '{': return parseProgram();
                    case '[': return parseVectorOrRecord();
                    case '(': return parseBoundExpression();
                    case ':':
                    case '.':
                    case ')':
                    case ']':
                    case '}':
                        croaker.unexpected(token.type, token.data);
                }
                break;

            case Syntaxes.Assign:
                croaker.unexpected(token.type, token.data);
                break;

            case Syntaxes.Comment:
                lexer.next();
                return parseAtom();

            case Syntaxes.Name:
                token = context.findPremitive(token.data) || token;

            default:
                lexer.next();
        }

        return maybeAssign(maybeAccess(token));
    }

    function parseExpression() {
        return maybeNative() || parseAtom();
    }

    function parseVectorOrRecord() {
        var items = tuple('[', ']', ',', maybeRecordPair);
        var record = false;
        items.some(function (i) { return record = i.type == Syntaxes.Assign; });
        return record ? Syntax.Record(items) : Syntax.Vector(items);
    }

    function maybeRecordPair() {
        var left = parseExpression();
        var token = lexer.peek();
        if (token.type == Syntaxes.Assign) {
            skip(Syntaxes.Assign, token.data);
            return Syntax.Assign(left, parseExpression());
        }
        return left;
    }

    function maybeAccess(left) {
        left = left || parseAtom();
        var token = lexer.peek();
        if (token && token.data == '::') {
            skipPunctuation('::');
            return Syntax.Access(left, maybeAccess(parseName()));
        }
        return left;
    }

    function maybeIndexing(target) {
        return null;

        //target = target || parseAtom();
        //var token = lexer.peek();
        //if (token && token.data == '[') {
        //    skipPunctuation('[');
        //    var syntax = Syntax.Indexing(target, parseName());
        //    skipPunctuation(']');
        //}
        //return target;
    }

    function maybeNative(token) {
        token = token || lexer.peek();
        if (token.type == Syntaxes.Name) {
            var macro = context.find(token.data);
            if (macro && macro.type == Syntaxes.Macro) {
                croaker.begin(Syntaxes.Native);
                lexer.next();
                var args = until(isClosePunctuation, parseAtom);
                croaker.end();
                return Syntax.Native(macro, args);
            }
        }
        return null;
    }

    function maybeInvocation(caller) {
        croaker.begin(Syntaxes.Invocation);
        caller = caller || parseAtom();
        var token = lexer.peek();
        if (token && token.data == '(') {
            return Syntax.Invocation(caller, tuple('(', ')', ',', parseExpression));
        }
        croaker.end();
        return caller;
    }

    function parseBoundExpression() {
        skipPunctuation('(');
        var syntax = parseAtom();
        switch (syntax.type) {
            case Syntaxes.Access:
            case Syntaxes.Name:
                syntax = maybeNative(syntax) || parseInvocation(syntax);
                break;
            
            default:
                syntax = syntax.bound ? parseInvocation(syntax) : syntax.bound = true && syntax;
                break;
        }
        skipPunctuation(')');
        return syntax;
    }

    function parseInvocation(caller) {
        croaker.begin(Syntaxes.Invocation);
        var syntax = Syntax.Invocation(caller || parseExpression(), until(isClosePunctuation, parseAtom));
        croaker.end();
        return syntax;
    }

    function parseIf() {
        croaker.begin(Syntaxes.If);
        skipKeyword('if');
        var condition = parseExpression();
        skipKeyword('then');
        var thenClause = parseExpression();
        var elseClause = null;
        if (lexer.peek().data == 'else') {
            skipKeyword('else');
            elseClause = parseExpression();
        }
        croaker.end();
        return Syntax.If(condition, thenClause, elseClause);
    }

    function parseLet() {
        skipKeyword('let');
        croaker.begin(Syntaxes.Let);
        var syntax = Syntax.Let(maybeName(), tuple('(', ')', ',', parseVariableAssign), parseExpression())
        croaker.end();
        return syntax;
    }

    function parseVariableDefine() {
        skipKeyword('var');
        var variable = parseVariable();
        var assign = maybeAssign(variable);
        var data = null;
        if (assign.type == Syntaxes.Assign) {
            data = assign.right;
        }
        return Syntax.VariableDefine(variable, data);
    }

    function parseLambda() {
        skipKeyword('lambda');
        croaker.begin(Syntaxes.Lambda);
        var syntax = Syntax.Lambda(tuple('(', ')', ',', parseVariable), parseExpression());
        croaker.end();
        return syntax;
    }

    function parseProgram() {
        croaker.begin(Syntaxes.Program);
        var expressions = delimit('{', '}', '.', parseExpression);
        croaker.end();
        return Syntax.Program(expressions);
    }

    function parseTopLevel() {
        var expressions = [];
        var token = skipWhile('.');
        croaker.begin(Syntaxes.TopLevel);
        while (!lexer.eof()) {
            token = skipWhile('.');
            expressions.push(parseExpression());
            if (!lexer.eof()) {
                skipPunctuation('.');
            }
            token = lexer.peek();
        }
        croaker.end();
        return Syntax.TopLevel(expressions);
    }
}