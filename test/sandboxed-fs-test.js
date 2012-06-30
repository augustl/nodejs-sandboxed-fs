var buster = require("buster");
var assert = buster.assert;
var refute = buster.refute;

var sbfs = require("./../lib/sandboxed-fs");
var corefs = require("fs");

buster.testCase("sandboxed-fs", {
    setUp: function () {
        this.defaultSandboxDir = __dirname + "/fixtures";
        this.existingInside = __dirname + "/fixtures/a-file.txt"
        this.existingOutside = __dirname + "/sandboxed-fs-test.js";
    },

    tearDown: function () {
        var files = corefs.readdirSync(__dirname + "/fixtures/sandbox");
        files.forEach(function (file) {
            corefs.unlinkSync(__dirname + "/fixtures/sandbox/" + file);
        });
    },

    "existingInside actually exists": function () {
        assert(corefs.statSync(this.existingInside))
    },

    "existingOustide actually exists": function () {
        assert(corefs.statSync(this.existingOutside))
    },

    "should call whitelisted async API that takes one argument": function (done) {
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        fs.stat(this.existingInside, function (err, stat) {
            refute(err);
            assert.equals(stat.mtime, new Date(2012, 5, 30, 2, 25, 41));
            assert.equals(stat.size, 16);
            done();
        });
    },

    "should fail for whitelisted async API taking one argiment": function (done) {
        var self = this;
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        fs.stat(this.existingOutside, function (err, stat) {
            assert(err);
            refute(stat);

            assertEnoentErr(err, self.existingOutside);
            done();
        });
    },

    "should return for whitelisted sync API that takes one argument": function () {
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        var stat = fs.statSync(this.existingInside);
        assert.equals(stat.mtime, new Date(2012, 5, 30, 2, 25, 41));
        assert.equals(stat.size, 16);
    },

    "should throw for whitelisted sync API that takes one argument": function (done) {
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        try {
            fs.statSync(this.existingOutside);
        } catch(err) {
            assertEnoentErr(err, this.existingOutside);
            done();
        }
    },

    "first arg of async multiarg inside whitelisted sandbox": function (done) {
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        fs.open(this.existingInside, "r", done(function (err, fd) {
            refute(err);
            assert(fd);
        }));
    },

    "second arg of async multiarg inside whitelisted sandbox": function (done) {
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        fs.open(this.existingInside, "r", 0666, done(function (err, fd) {
            refute(err);
            assert(fd);
        }));
    },

    "first arg of async multiarg outside whitelisted sandbox": function (done) {
        var self = this;
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        fs.open(this.existingOutside, "r", done(function (err, fd) {
            assertEnoentErr(err, self.existingOutside);
            refute(fd);
        }));
    },

    "second arg of async multiarg outside whitelisted sandbox": function (done) {
        var self = this;
        var fs = sbfs.createWhitelisted([this.defaultSandboxDir]);

        fs.open(this.existingOutside, "r", 0666, done(function (err, fd) {
            assertEnoentErr(err, self.existingOutside);
            refute(fd);
        }));
    },

    "// watching inside sandbox": function (done) {
        assert(true);
        var testfile = __dirname + "/fixtures/sandbox/test.txt";

        corefs.writeFileSync(testfile, new Buffer([0xff]));

        var fs = sbfs.createWhitelisted([__dirname + "/fixtures"]);

        fs.watchFile(testfile, {persistent: false, interval: 10}, done(function () {
            fs.unwatchFile(testfile);
        }));

        corefs.appendFileSync(testfile, new Buffer([0xff]));
    }
});


function assertEnoentErr(err, expectedPath) {
    assert.equals(err.code, "ENOENT");
    assert.equals(err.errno, 34);
    assert.equals(err.path, expectedPath);
}
