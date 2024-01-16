function SemanticAnalyzer() {
    return analyze;

    function analyze(expression, context) {
        if (!expression) return null;
        switch (expression.type) {
            case Syntaxes.Access:
                return analyzeAccess(expression, context);

            case Syntaxes.Assign:
                return analyzeAssign(expression, context);

            case Syntaxes.If:
                return analyzeIf(expression, context);

            case Syntaxes.Let:
                return analyzeLet(expression, context);

            case Syntaxes.Lambda:
                return analyzeLambda(expression, context);

            case Syntaxes.Variable:
                return analyzeVariable(expression, context);

            case Syntaxes.VariableDefine:
                return analyzeVariableDefine(expression, context);

            case Syntaxes.Name:
                return context.find(expression) || expression;

            case Syntaxes.Record:
                return analyzeRecord(expression, context);

            case Syntaxes.Vector:
                return analyzeVector(expression, context);

            case Syntaxes.Program:
                return analyzeProgram(expression, context);

            case Syntaxes.TopLevel:
                return analyzeTopLevel(expression, context);

            case Syntaxes.Invocation:
                return analyzeInvocation(expression, context);;

            case Syntaxes.Native:
                return analyzeNative(expression, context);

            default:
                return expression;
        }
    };

    function analyzeAccess(expression, context) {
        expression.resultType = getResultType(expression.right, context);
        return expression;
    }

    function analyzeAssign(expression, context) {
        var left = expression.left = analyze(expression.left, context);

        var name = null;
        switch (left.type) {
            case Syntaxes.Name:
                name = left.data;
                break;
            case Syntaxes.Variable:
                name = left.name.data;
                break;

            default:
                croaker.begin(Syntaxes.Assign);
                croaker.unexpected(left.type, Syntaxes.Name);
                croaker.end();
                break;
        }

        expression.right = analyze(expression.right, context);
        expression.resultType = getResultType(expression.right, context);
        context.defineVariable(name, left);
        context.defineVariable(name, expression.right);
        return expression;
    }

    function analyzeVariable(expression, context) {
        expression.name = analyze(expression.name, context);
        expression.variableType = analyze(expression.variableType, context);
        if (expression.variableType.type != Syntaxes.Premitive) {
            croaker.expecting(Syntaxes.Premitive, expression.variableType.type);
        }
        if (context.findVariable(expression.name.data)) {
            
        }
        return expression;
    }

    function analyzeVariableDefine(expression, context) {
        expression.data = analyze(expression.data, context);
        expression.variable = analyze(expression.variable, context);
        context.defineVariable(expression.variable.name.data, expression);
        return Syntax.Assign(expression.variable, expression.data);
    }

    function analyzeIf(expression, context) {
        expression.condition = analyze(expression.condition, context);
        expression.thenClause = analyze(expression.thenClause, context);
        expression.elseClause = analyze(expression.elseClause, context);
        var thenClauseResultType = getResultType(expression.thenClause);
        var elseClauseResultType = getResultType(expression.elseClause)
        expression.resultType = 
            thenClauseResultType.dataType == elseClauseResultType.dataType 
            ? thenClauseResultType : context.findPremitive('%any');
        return expression;
    }

    function analyzeLambda(expression, context) {
        expression.parameters = expression.parameters.map(function (e) {
            return analyze(e, context);
        });
        context = context.extend();
        expression.parameters.forEach(function (e) {
            context.defineVariable(e.name.data, e);
        });
        expression.body = analyze(expression.body, context);
        expression.resultType = getResultType(expression.body, context);
        return expression;
    }

    function analyzeLet(expression, context) {
        expression.variables = expression.variables.map(function (e) {
            return analyze(e, context);
        });
        context = context.extend();
        expression.variables.forEach(function (e) {
            context.defineVariable(e.left.name.data, e.right);
        });
        expression.body = analyze(expression.body, context);
        expression.resultType = getResultType(expression.body, context);
        return expression;
    }

    function analyzeRecord(expression, context) {
        expression.items = expression.items.map(function (e) {
            return analyze(e, context);
        });
        return expression;
    }

    function analyzeVector(expression, context) {
        expression.items = expression.items.map(function (e) {
            return analyze(e, context);
        });
        return expression;
    }

    function analyzeNative(expression, context) {
        expression.arguments = expression.arguments.map(function (e) {
            return analyze(e, context);
        });
        expression.analyze(expression, context, analyze);
        return expression;
    }
    
    function analyzeProgram(expression, context) {
        expression.expressions = expression.expressions.map(function (e) {
            return analyze(e, context);
        });
        context = context.extend();
        expression.resultType = getResultType(expression.expressions[expression.expressions.length - 1], context);
        return expression;
    }

    function analyzeTopLevel(expression, context) {
        expression.expressions = expression.expressions.map(function (e) {
            return analyze(e, context);
        });
        expression.resultType = getResultType(expression.expressions[expression.expressions.length - 1], context);
        return expression;
    }

    function analyzeInvocation(expression, context) {
        expression.caller = analyze(expression.caller, context);
        expression.arguments = expression.arguments.map(function (e) {
            return analyze(e, context);
        });
        var caller = null;
        switch (expression.caller.type) {
            case Syntaxes.Name:
                var found = context.find(expression.caller.data);
                if (found) {
                    caller = found;
                }
                break;

            default:
                caller = expression.caller.resultType;
        }

        if (caller && caller.type == Syntaxes.Lambda) {
            var length = Math.min(caller.parameters.length, expression.arguments.length);
            for (var i = 0; i < length; i++) {
                var arg = getResultType(expression.arguments[i], context); 
                var par = getResultType(caller.parameters[i], context);
                console.log(arg, par);
                if (par.dataType && arg.dataType != par.dataType) {
                    croaker.begin(Syntaxes.Invocation);
                    croaker.croak(
                        'type mismatch at ' 
                        + (i + 1) 
                        + ' argument. expecting a <' 
                        + syntaxTypeToString(par.dataType)
                        + '>, there is <'
                        + syntaxTypeToString(arg.dataType)
                        + '>.'
                        );
                    croaker.end();
                }
            }
        }
        
        expression.resultType = getResultType(expression.caller, context);
        return expression;
    }

    function getResultType(expression, context) {
        if (!expression) return context.findPremitive('%any');
        switch (expression.type) {
            case Syntaxes.Bool:
                return context.findPremitive('%bool');
            case Syntaxes.Null:
                return context.findPremitive('%null');
            case Syntaxes.Number:
                return context.findPremitive('%number');
            case Syntaxes.String:
                return context.findPremitive('%string');
            case Syntaxes.Record:
                return context.findPremitive('%record');
            case Syntaxes.Vector:
                return context.findPremitive('%vector');
            case Syntaxes.Lambda:
                return context.findPremitive('%lambda');

            case Syntaxes.Name:
                return getResultType(context.find(name), context);

            case Syntaxes.Variable:
            case Syntaxes.VariableDefine:
                return expression.variableType;

            default:
                return expression.resultType;
        }
    }
}