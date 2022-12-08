const prompt = require("readline-sync").question;
const JSZip = require("jszip");
const unzip = require("unzipper");
import * as path from 'path';
const fetch = require("sync-fetch");
import * as fs from 'fs';
import * as os from 'os';
import { isStringLiteralLike } from 'typescript';
import * as YAML from 'yaml';

const adp = process.env.APPDATA ? (process.env.APPDATA + "\\keyjay\\libs") : (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences/keyjay/libs' : process.env.HOME + "/.keyjay/libs");

function tmpdir(scope): [string, CallableFunction] {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < 6; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    const dir = path.join(os.tmpdir(), "keyjay-" + scope + "_" + randomString);
    fs.mkdirSync(dir);
    return [dir, (function filenameof(name) {
        return path.join(dir, name);
    })]
}

// Start service
var action = process.argv[2];
var offset = 0;
if (action == "--trace-uncaught") {
    action = process.argv[3];
    offset = 1;
}
if (["pack", "pkg"].includes(action)) {
    pack();
} else if (["fpkg", "file-pack"].includes(action)) {
    sglfpack();
} else if (["setup"].includes(action)) {
    console.log("Creating libs folder...");
    fs.mkdirSync(adp, { recursive: true });
    console.log("For now, this does nothing more. Planned: install keyjay and snigle and put to path.");
} else if (["if", "installfile"].includes(action)) {
    installfile(process.argv[3 + offset]);
} else if (action == "help") {
    console.log("'snigle help' - Show help")
    console.log("'snigle pack [PATH]' - Package module from yaml at PATH or snigle.yml")
} else if (action) {
    throw `Unknown action ${action}! Use 'snigle help' to get help.`;
} else {
    throw `No action supplied. Use 'snigle help' to get help.`;
}

function pack() {
    const filec = fs.readFileSync(path.join("./", "snigle.yml"), 'utf-8');
    const c = YAML.parse(filec);
    console.log(c);
    if (!c.name) throw "No name specified";
    if (!c.version) throw "No version specified";
    if (!c.launch) throw "No launch script specified";

    const zip = new JSZip();
    const dat = zip.folder(c.name);
    dat.file("config.yml", YAML.stringify(
        {
            name: c.name,
            version: c.version,
            modules: c.modules || []
        }
    ));
    dat.file("main.kj", fs.readFileSync(c.launch, 'utf-8'));
    if (c.files) {
        for (const filen of c.files) {
            dat.file(filen, fs.readFileSync(filen, 'utf-8'));
        }
    }
    zip.generateAsync({
        type: "nodebuffer",
        compression: "STORE",
        platform: process.platform,
    }).then(function (content) {
        fs.writeFileSync(c.name + ".zip", content);
    });
}

function sglfpack() {
    const c = {
        name: prompt("Name of your module? (test) ") || "test",
        version: prompt("Version? (1.0.0) ") || "1.0.0",
        launch: prompt("Launch file? (main.kj) ") || "main.kj",
        files: (prompt("Comma seperated list of required files (): ") || "").split(","),
        modules: (prompt("Comma seperated list of required modules (): ") || "").split(",")
    };
    console.log(c);

    const zip = new JSZip();
    const dat = zip.folder(c.name);
    dat.file("config.yml", YAML.stringify(
        {
            name: c.name,
            version: c.version,
            modules: c.modules || []
        }
    ));
    dat.file("main.kj", fs.readFileSync(c.launch, 'utf-8'));
    if (c.files) {
        for (const filen of c.files) {
            dat.file(filen, fs.readFileSync(filen, 'utf-8'));
        }
    }
    zip.generateAsync({
        type: "nodebuffer",
        compression: "STORE",
        platform: process.platform,
    }).then(function (content) {
        fs.writeFileSync(c.name + ".zip", content);
    });
}

function installfile(mzip: string) {
    fs.createReadStream(mzip).pipe(unzip.Extract({ path: adp }));
}
