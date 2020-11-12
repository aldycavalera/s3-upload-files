"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.checkExtensionIf = void 0;
var mime = require("mime/lite");
var conf = require("../default.config.json");
var checkExtensionIf = function (ext, type) {
    try {
        if (mime.getExtension(ext) in conf.extension[type] &&
            conf.extension[type][mime.getExtension(ext)] === true) {
            return true;
        }
    }
    catch (error) {
        return false;
    }
};
exports.checkExtensionIf = checkExtensionIf;
var query = function (query, param) {
    if (query[param] !== undefined)
        return query[param];
    else
        return false;
};
exports.query = query;
