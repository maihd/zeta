function Generator() {
    return function generate(expression, context) {
        if (!expression) return '';
        switch (expression.type) {
            case Syntaxes.Access:
                return generate(expression.left, context)
                    + '.' + generate(expression.right, context);

            case Syntaxes.Assign:
                return generate(expression.left, context) 
                    + '=' + generate(expression.right, context);

            case Syntaxes.If:
                return '(' + generate(expression.condition, context) 
                    + '?' + generate(expression.thenClause, context)
                    + ':' + generate(expression.elseClause, context)
                    + ')' ;

            case Syntaxes.Let:
                return '(function ' + generate(expression.name, context) 
                + '(' + expression.variables.map(function (v) {
                    return generate(v.left, context);
                }).join(',') + '){return ' + generate(expression.body, context) + '})('
                + expression.variables.map(function (v) {
                    return generate(v.right, context);
                }).join(',') + ')';

            case Syntaxes.Lambda:
                return 'function(' + expression.parameters.map(function (e) {
                    return generate(e, context);
                }).join(',') + '){return ' + generate(expression.body, context) + '}';

            case Syntaxes.Variable:
                return generate(expression.name, context);

            case Syntaxes.VariableDefine:
                return 'var ' + generate(expression.variable, context);

            case Syntaxes.Name:
                return Convention.Naming(expression.data);

            case Syntaxes.Record:
                var items = expression.items.map(function (e) {
                    switch (e.type) {
                        case Syntaxes.Assign:
                            var left = generate(e.left, context);
                            left = e.left.type != Syntaxes.Name ? '[' + left + ']' : left;
                            return left + ':' + generate(e.right, context);

                        default:
                            return generate(e, context);
                    }
                });
                return '{' + items.join(',') + '}';

            case Syntaxes.Vector:
                return '[' + expression.items.map(function (e) {
                    return generate(e, context);
                }).join(',') + ']';

            case Syntaxes.Program:
            case Syntaxes.TopLevel:
                var generated = expression.expressions.map(function (e) {
                    return generate(e, context);
                });
                var variables = context.getVariables();
                for (var name in variables) {
                    console.log(variables[name]);
                    if (variables[name].type == Syntaxes.VariableDefine) {
                        generated.unshift(generate(variables[name], context));
                    }
                }
                generated[generated.length - 1] = 'return ' + generated[generated.length - 1];
                return '(function(){' + generated.join(';') + '})()';

            case Syntaxes.Invocation:
                return generate(expression.caller, context) + '(' + expression.arguments.map(function (e) {
                    return generate(e, context);
                }).join(',') + ')';

            case Syntaxes.Native:
                return expression.macro.generate(expression, context, generate);

            case Syntaxes.Premitive:
                return '"' + syntaxTypeToString(expression.tokenType) + '"';

            default:
                return expression.data;
        }
    };
}