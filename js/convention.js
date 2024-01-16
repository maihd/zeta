var Convention = {
    Naming: function (name) {
        var conventions = {
            '-': '_00_',
            '!': '_01_',
            '@': '_02_',
            '#': '_03_',
            '$': '_04_',
            '%': '_05_',
            '^': '_06_',
            '&': '_07_',
            '*': '_08_',
            '+': '_09_',
            '<': '_10_',
            '>': '_11_',
            '=': '_12_',
            '|': '_13_',
            '/': '_14_',
            '?': '_15_',
            '0': '_16_',
            '1': '_17_',
            '2': '_18_',
            '3': '_19_',
            '4': '_20_',
            '5': '_21_',
            '6': '_22_',
            '7': '_23_',
            '8': '_24_',
            '9': '_25_',
        };
        var specials = {
            'new': '_new_',
            'this': '_this_',
            'try': '_try_',
            'catch': '_catch_',
            'class': '_class_',
            'throw': '_throw_',
            'case': '_case_',
            'default': '_default_',
            'switch': '_switch_'
        };

        name = Array.prototype.map.call(name, function (char) {
            return conventions[char] || char;
        }).join('');

        return specials[name] || name;
    }
}