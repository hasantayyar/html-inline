var trumpet = require('trumpet');
var through = require('through2');
var fs = require('fs');
var path = require('path');

module.exports = function (opts) {
    if (!opts) opts = {};
    var basedir = opts.basedir || process.cwd();
    var tr = trumpet();
    tr.selectAll('script[src]', function (node) {
        var file = fix(node.getAttribute('src'));
        node.removeAttribute('src');
        fs.createReadStream(file)
            .pipe(node.createWriteStream())
        ;
    });
    tr.selectAll('img[src]', function (node) {
        var file = fix(node.getAttribute('src'));
        var w = node.createWriteStream({ outer: true });
        var attrs = node.getAttributes();
        w.write('<img');
        Object.keys(attrs).forEach(function (key) {
            if (key === 'src') return;
            w.write(' ' + key + '="' + enc(attrs[key]) + '"');
        });
        var ext = path.extname(file).replace(/^\./, '');;
        w.write(' src="data:image/' + ext + ';base64,');
        fs.createReadStream(file).pipe(through(write, end));
        
        function write (buf, enc, next) {
            w.write(buf.toString('base64'));
            next();
        }
        function end () {
            w.end('">');
        }
    });
    
    tr.selectAll('link[href]', function (node) {
        var rel = node.getAttribute('rel').toLowerCase();
        if (rel !== 'stylesheet') return;
        var file = fix(node.getAttribute('href'));
        
        var w = node.createWriteStream({ outer: true });
        w.write('<style>');
        var r = fs.createReadStream(file);
        r.pipe(w, { end: false });
        r.on('end', function () { w.end('</style>') });
    });
    return tr;
    
    function fix (p) {
        return path.resolve(basedir, path.relative('/', path.resolve('/', p)));
    }
    function enc (s) {
        return s.replace(/"/g, '&#34;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
        ;
    }
};
