# nodejs-sandboxed-fs

Identical API to the core `fs` module, but allows for whitelisting and blacklisting of certain paths. Can be used to provide sandboxed file system for VM sandboxes.

## TODO

* Implement all the APIs.
* Normalize relative paths

## Installing

    npm install sandboxed-fs

Or add it as a dependency to your package.json.

    "dependencies": {
        "sandboxed-fs": "0.1.x"
    }

## Usage

Will only be able to access files and folders beyond the listed paths.

    var sbfs = require("sandboxed-fs").createWhitelisted([
        "/home/deploy/foo",
        "/tmp"
    ]);

Will not be able to access any files or folders in the specified paths.

    var sbfs = require("sandboxed-fs").createBlacklisted([
        "/var",
        "/home"
    ]);

The `sbfs` can then be used as a normal fs module, with 100% core fs module API compatibility.

You probably want to use this module in a VM, like so:

    var sbfs = require("sandboxed-fs").createWhitelisted([...]);
    var vm = require("vm");
    var ctx = {};
    ctx.require = function (module) {
        if (module === "fs") {
            return sbfs;
        }
        
        return require(module);
    }
    vm.runInNewContext(stringOfCode, ctx);

The `stringOfCode` will be evaluated as a normal Node.js script, but will only have the globals available that you specify in `ctx`. Here we define our own `require`, where `fs` will return our own `sbfs` module, or otherwise piggyback to the normal require.
