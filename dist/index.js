"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uploader = void 0;
require("dotenv").config();
var AWS = require("aws-sdk");
var fs = require("fs");
var crypto = require("crypto");
var conf = require("./default.config.json");
var resizer_1 = require("./lib/resizer");
var checker_1 = require("./lib/checker");
var NOT_ALLOWED_EXTENSION = "Not allowed extension";
var ACL = [
    "private",
    "public-read",
    "public-read-write",
    "aws-exec-read",
    "authenticated-read",
    "bucket-owner-read",
    "bucket-owner-full-control",
    "log-delivery-write",
];
var s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION,
});
var Uploader = (function () {
    function Uploader() {
        var _this = this;
        this.routes = function (app) {
            var multer = require("multer");
            var storage = multer.diskStorage({
                filename: function (req, file, cb) {
                    cb(null, file.originalname);
                },
            });
            var upload = multer({ storage: storage, limits: { fileSize: 100000000 } });
            app.post("/upload", upload.array("files"), _this.post);
        };
        this.checkBucket = function (name) {
            s3.listBuckets(function (err, data) {
                if (err) {
                    console.log("Error", err);
                }
                else {
                    console.log("Success", data.Buckets);
                }
            });
        };
        this.uploadPart = function (file) {
            var stream = fs.createReadStream(file.path);
            var params = {
                ACL: conf.ACL,
                Bucket: process.env.BUCKET_NAME,
                Body: stream,
                Key: file.originalname,
            };
            var options = {
                partSize: 5 * 1024 * 1024,
                queueSize: 5,
            };
            try {
                return s3.upload(params, options).promise();
            }
            catch (error) {
                console.log("upload ERROR", file, error);
            }
        };
        this.doUpload = function (file, buffer, folder) {
            if (buffer === void 0) { buffer = null; }
            if (folder === void 0) { folder = false; }
            var params = {};
            if (folder !== "" && folder !== false) {
                folder = folder + "/";
            }
            else {
                folder = "";
            }
            if (!buffer) {
                var FILES = file;
                var path = FILES.path;
                var fileName = crypto
                    .createHash("md5")
                    .update(FILES.originalname)
                    .digest("hex");
                fileName = "" + folder + fileName + "." + FILES.originalname.split(".").pop();
                params = {
                    ACL: conf.ACL,
                    Bucket: process.env.BUCKET_NAME,
                    Body: fs.createReadStream(path),
                    Key: "" + fileName,
                };
            }
            else {
                params = {
                    ACL: conf.ACL,
                    Bucket: process.env.BUCKET_NAME,
                    Body: buffer.Body,
                    Key: folder + buffer.Key,
                };
            }
            return s3.upload(params).promise();
        };
        this.post = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var promises, folder, i, file, _a, _b, _i, key, resized;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        promises = [];
                        folder = "";
                        folder = checker_1.query(req.query, "folder");
                        conf.image.bulk_resize = checker_1.query(req.query, "bulk_image");
                        if (checker_1.query(req.query, "ACL") != false &&
                            ACL.includes(checker_1.query(req.query, "ACL"))) {
                            conf.ACL = checker_1.query(req.query, "ACL");
                        }
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < req.files.length)) return [3, 8];
                        file = req.files[i];
                        if (!checker_1.checkExtensionIf(file.mimetype, "image")) return [3, 6];
                        if (!(conf.image.bulk_resize != false)) return [3, 5];
                        _a = [];
                        for (_b in conf.sizes.image)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3, 5];
                        key = _a[_i];
                        if (!conf.sizes.image.hasOwnProperty(key)) return [3, 4];
                        return [4, this.Resizer.resizeImage(file, conf.sizes.image[key], key)];
                    case 3:
                        resized = _c.sent();
                        promises.push(this.doUpload(file, resized, folder));
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5:
                        promises.push(this.doUpload(file, null, folder));
                        return [3, 7];
                    case 6:
                        if (checker_1.checkExtensionIf(file.mimetype, "video")) {
                            promises.push(this.uploadPart(file));
                        }
                        else {
                            return [2, res.end(NOT_ALLOWED_EXTENSION)];
                        }
                        _c.label = 7;
                    case 7:
                        i++;
                        return [3, 1];
                    case 8:
                        Promise.all(promises)
                            .then(function (data) {
                            res.send(data);
                        })
                            .catch(function (err) {
                            res.send(err.stack);
                        });
                        return [2];
                }
            });
        }); };
        this.upload = function (app) {
            return _this.routes(app);
        };
        this.Resizer = new resizer_1.Resizer();
    }
    return Uploader;
}());
exports.Uploader = Uploader;
