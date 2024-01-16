var Syntaxes = {
    Unknown: -1,
    Bool: 0,
    Name: 1,
    Null: 2,
    Number: 3,
    Regexp: 4,
    String: 5,
    Assign: 6,
    Comment: 7,
    Keyword: 8,
    Punctuation: 9,

    If: 10,
    Let: 11,
    Macro: 12,
    Access: 13,
    Lambda: 14,
    Native: 15,
    Record: 16,
    Vector: 17,
    Program: 18,
    TopLevel: 19,
    Indexing: 20,
    Invocation: 21,
    Variable: 22,
    VariableDefine: 23,
    Premitive: 24,
    Arrow: 25,
};

var SymbolTable = {
    Null: { type: Syntaxes.Null, data: 'null' },
    TypeAny: { type: Syntaxes.Premitive, tokenType: null }
};

var Syntax = {
    If: function (condition, thenClause, elseClause) {
        return {
            type: Syntaxes.If,
            condition: condition,
            thenClause: thenClause,
            elseClause: elseClause || TokenNull
        };
    },

    Let: function (name, variables, body) {
        return {
            type: Syntaxes.Let,
            name: name,
            variables: variables,
            body: body
        }
    },

    Access: function (left, right) {
        return {
            type: Syntaxes.Access,
            left: left,
            right: right
        }
    },

    Assign: function (left, right) {
        return {
            type: Syntaxes.Assign,
            left: left,
            right: right
        }
    },

    Lambda: function (parameters, body) {
        return {
            type: Syntaxes.Lambda,
            parameters: parameters,
            body: body
        }
    },

    Native: function (macro, args) {
        macro.parse(args);
        return {
            type: Syntaxes.Native,
            macro: macro,
            arguments: args,
        }
    },

    Record: function (items) {
        return {
            type: Syntaxes.Record,
            items: items,
        }
    },

    Vector: function (items) {
        return {
            type: Syntaxes.Vector,
            items: items,
        }
    },

    Program: function (expressions) {
        return {
            type: Syntaxes.Program,
            expressions: expressions,
        }
    },

    TopLevel: function (expressions) {
        return {
            type: Syntaxes.TopLevel,
            expressions: expressions,
        }
    },

    Indexing: function (target, index) {
        return {
            type: Syntaxes.Indexing,
            target: target,
            index: index
        }
    },

    Invocation: function (caller, args) {
        return {
            type: Syntaxes.Invocation,
            caller: caller,
            arguments: args,
        }
    },

    Variable: function (name, type) {
        return {
            type: Syntaxes.Variable,
            name: name,
            variableType: type || SymbolTable.TypeAny,
        };
    },

    VariableDefine: function (variable, data) {
        return {
            type: Syntaxes.VariableDefine,
            variable: variable,
            data: data || SymbolTable.Null
        }
    }
}

function syntaxTypeToString(type) {
    return [
        'unknown',
        'bool',
        'name',
        'null',
        'number',
        'regexp',
        'string',
        'assign',
        'comment',
        'keyword',
        'punctuation',
        'if',
        'let',
        'macro',
        'access',
        'lambda',
        'native',
        'record',
        'vector',
        'program',
        'top-level',
        'indexing',
        'invocation',
        'variable',
        'variable-define',
        'premitive',
        'arrow'
    ][type + 1];
}