var Macro = {
    Native: function (parse, preprocess, generate) {
        return {
            type: Syntaxes.Macro,
            parse: parse,
            generate: generate,
            preprocess: function (expression, context, preproccessor) {
                var string = false;
                expression.arguments.some(function (e) {
                    switch (e.type) {
                        case Syntaxes.Lambda:
                        case Syntaxes.If:
                        case Syntaxes.Let:
                        case Syntaxes.Native:
                        case Syntaxes.Program:
                        case Syntaxes.Invocation:
                            string = e.resultType.dataType != Syntaxes.Number;
                            break;

                        case Syntaxes.Number:
                            string = false;
                            break;

                        default:
                            string = true;
                    }

                    return string;
                });

                if (string) expression.resultType = context.findPremitive('%string');
            }
        }
    },

    Operator: function (name) {
        return Macro.Native(function () {

        }, function (expression, context, preproccessor) {
        }, function (expression, context, generator) {
            return expression.arguments.map(function (e) {
                return generator(e, context);
            }).join(name);
        });
    },
    
    Or: function () {
        return Macro.Native(function () {

        }, function (expression, context, preproccessor) {
            
        }, function (expression, context, generator) {
            return expression.arguments.map(function (e) {
                return generator(e, context);
            }).join('||');
        });
    },

    And: function () {
        return Macro.Native(function () {

        }, function (expression, context, preproccessor) {
            
        }, function (expression, context, generator) {
            return expression.arguments.map(function (e) {
                return generator(e, context);
            }).join('&&');
        });
    },

    Not: function () {
        return Macro.Native(function () {

        }, function (expression, context, preproccessor) {
            
        }, function (expression, context, generator) {
            return expression.arguments.map(function (e) {
                return '!' + generator(e, context);
            }).join('&&');
        });
    },

    Ref: function () {
        return Macro.Native(function (args) {
            
        }, function (expression, context, generator) {
            return generator(expression.arguments[0], context) + expression.arguments.slice(1).map(function (e) {
                return '[' + generator(e, context) + ']';
            }).join('');
        });
    },

    Premitive: function (dataType) {
        return {
            type: Syntaxes.Premitive,
            dataType: dataType
        };
    }
}