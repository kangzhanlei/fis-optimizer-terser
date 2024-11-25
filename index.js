var deasync = require("deasync");
var terser = require("terser");

function syncPromise(fn) {
    return function () {
        var done = false;
        var args = Array.prototype.slice.apply(arguments);
        var err;
        var res;

        var ret = fn.apply(this, args);

        if (!ret || !ret.then) {
            throw new Error("It's not a promise.");
        }

        ret.then(function (result) {
            done = true;
            res = result;
        });

        ret.catch(function (e) {
            done = true;
            err = e;
        });

        deasync.loopWhile(function () {
            return !done;
        });
        if (err) throw err;

        return res;
    };
}

var syncMinify = syncPromise(terser.minify);

module.exports = function (content, file, defaultOptions) {
    var options = Object.assign({}, defaultOptions);

    delete options.filename;

    var result = syncMinify(content, options);

    if (result.map) {
        let mapping = file.wrap(file.dirname + '/' + file.filename + file.rExt + '.map');
        mapping.setContent(result.map);
        file.extras = file.extras || {};
        file.extras.derived = file.extras.derived || [];
        file.extras.derived.push(mapping);
    }
    return result.code;
};

module.exports.defaultOptions = {};
