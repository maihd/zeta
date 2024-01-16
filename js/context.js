function Context(parent, premitives) {
    var scope = {};
    var variables = {};
    parent = parent || null;
    premitives = premitives || {};

    var context = {
        find: find,
        findType: findType,
        findVariable: findVariable,
        findPremitive: findPremitive,
        define: define,
        defineVariable: defineVariable,
        getVariables: function () {
            return variables;
        },
        extend: function () {
            return Context(context);
        }
    };

    return context;

    function define(name, data) {
        if (findPremitive(name)) {
            croaker.croak('attempt to redefine <premitive>: "' + name + '" .');
        }

        scope[name] = data;
    }

    function defineVariable(name, data) {
        if (findPremitive(name)) {
            croaker.croak('attempt to redefine <premitive>: "' + name + '" .');
        }

        var variable = variables[name];
        if (!variable) variables[name] = data || TokenNull;
        else if (variable.type == Syntaxes.Variable) variable.data = data;
    }

    function findType(name) {
        return findPremitive(name, premitives);
    }

    function findPremitive(name) {
        return premitives[name] || (parent && parent.find(name));
    }

    function findVariable(name) {
        return variables[name] || (parent && parent.findVariable(name));
    }

    function find(name) {
        return findPremitive(name) || findVariable(name);
    }
}