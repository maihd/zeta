var core = 
`;; Vector functions
record      -> lambda () Object:create(null) .
vector      -> Array:of                     .
vector-from -> Array:from                   .
tail -> lambda (v) v:slice(1).
init -> lambda (v) v:slice(0, - v::length 1) .
head -> lambda (v) ref v 0.
last -> lambda (v) ref v (- v::length 1).

;; Printing
print       -> console::log                  .
`;

function Compiler(Parser) {
    var context = Context(null, {
        '%any': Macro.Premitive(null),
        '%bool': Macro.Premitive(Syntaxes.Bool),
        '%null': Macro.Premitive(Syntaxes.Null),
        '%number': Macro.Premitive(Syntaxes.Number),
        '%string': Macro.Premitive(Syntaxes.String),
        '%regexp': Macro.Premitive(Syntaxes.Regexp),
        '%record': Macro.Premitive(Syntaxes.Record),
        '%vector': Macro.Premitive(Syntaxes.Vector),
        '%lambda': Macro.Premitive(Syntaxes.Lambda)
    });

    function defineOperator(name) {
        context.define(name, Macro.Operator(name));
    }
    function defineOperators(operators) {
        operators.forEach(function (o) {
            defineOperator(o);
        });
    }
    defineOperators([
        '+', '-', '*', '/', '%', 
        '<<', '>>',
        '==', '!=',
        '<', '<=', '>', '>=',
        '|', '&', '^',   
    ]);
    context.define('or', Macro.Or());
    context.define('and', Macro.And());
    context.define('not', Macro.Not());
    context.define('ref', Macro.Ref());

    return {
        compile: compile,
        execute: execute
    };

    function compile(code) {
        var parser = Parser(code, context);
        var expression = parser.parse();
        var analyzedExpression = SemanticAnalyzer()(expression, context);
        return Generator()(analyzedExpression, context);
    }

    function execute(code) {
        return eval(compile(code))
    }
}

var compiler = Compiler(Parser);
var code = compiler.compile('var a -> lambda (x : %lambda) (console::log x) . (a "hello world")');
console.log(code);
eval(code);