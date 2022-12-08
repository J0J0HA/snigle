"use strict";
exports.__esModule = true;
var prompt = require("readline-sync").question;
var JSZip = require("jszip");
var unzip = require("unzipper");
var path = require("path");
var fetch = require("sync-fetch");
var fs = require("fs");
var os = require("os");
var YAML = require("yaml");
var adp = process.env.APPDATA ? (process.env.APPDATA + "\\keyjay\\libs") : (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences/keyjay/libs' : process.env.HOME + "/.keyjay/libs");
function tmpdir(scope) {
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < 6; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    var dir = path.join(os.tmpdir(), "keyjay-" + scope + "_" + randomString);
    fs.mkdirSync(dir);
    return [dir, (function filenameof(name) {
            return path.join(dir, name);
        })];
}
// Start service
var action = process.argv[2];
var offset = 0;
if (action == "--trace-uncaught") {
    action = process.argv[3];
    offset = 1;
}
if (["pack"].includes(action)) {
    pack();
}
else if (["sglfpack"].includes(action)) {
    sglfpack();
}
else if (["setup"].includes(action)) {
    // setup();
}
else if (["if", "installfile"].includes(action)) {
    installfile(process.argv[3 + offset]);
}
else if (action == "help") {
    console.log("'snigle help' - Show help");
    console.log("'snigle pack [PATH]' - Package module from yaml at PATH or snigle.yml");
}
else if (action) {
    throw "Unknown action ".concat(action, "! Use 'snigle help' to get help.");
}
else {
    throw "No action supplied. Use 'snigle help' to get help.";
}
function pack() {
    var filec = fs.readFileSync(path.join("./", "snigle.yml"), 'utf-8');
    var c = YAML.parse(filec);
    console.log(c);
    if (!c.name)
        throw "No name specified";
    if (!c.version)
        throw "No version specified";
    if (!c.launch)
        throw "No launch script specified";
    var zip = new JSZip();
    var dat = zip.folder(c.name);
    dat.file("config.yml", YAML.stringify({
        name: c.name,
        version: c.version,
        modules: c.modules || []
    }));
    dat.file("main.kj", fs.readFileSync(c.launch, 'utf-8'));
    if (c.files) {
        for (var _i = 0, _a = c.files; _i < _a.length; _i++) {
            var filen = _a[_i];
            dat.file(filen, fs.readFileSync(filen, 'utf-8'));
        }
    }
    zip.generateAsync({
        type: "nodebuffer",
        compression: "STORE",
        platform: process.platform
    }).then(function (content) {
        fs.writeFileSync(c.name + ".zip", content);
    });
}
function sglfpack() {
    var c = {
        name: prompt("Name of your module? (test) ") || "test",
        version: prompt("Version? (1.0.0) ") || "1.0.0",
        launch: prompt("Launch file? (main.kj) ") || "main.kj",
        files: (prompt("Comma seperated list of required files (): ") || "").split(","),
        modules: (prompt("Comma seperated list of required modules (): ") || "").split(",")
    };
    console.log(c);
    var zip = new JSZip();
    var dat = zip.folder(c.name);
    dat.file("config.yml", YAML.stringify({
        name: c.name,
        version: c.version,
        modules: c.modules || []
    }));
    dat.file("main.kj", fs.readFileSync(c.launch, 'utf-8'));
    if (c.files) {
        for (var _i = 0, _a = c.files; _i < _a.length; _i++) {
            var filen = _a[_i];
            dat.file(filen, fs.readFileSync(filen, 'utf-8'));
        }
    }
    zip.generateAsync({
        type: "nodebuffer",
        compression: "STORE",
        platform: process.platform
    }).then(function (content) {
        fs.writeFileSync(c.name + ".zip", content);
    });
}
function installfile(mzip) {
    fs.createReadStream(mzip).pipe(unzip.Extract({ path: adp }));
}
