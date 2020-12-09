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
            var upload = multer({ storage: storage, limits: { fileSize: 2000 * 1024 * 1024 } });
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
        this.uploadWithResizer = function (file) { return __awaiter(_this, void 0, void 0, function () {
            var ffprobePath, ffmpegPath, ffmpeg, availableReso, getVideoInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ffprobePath = require('@ffprobe-installer/ffprobe').path;
                        ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
                        ffmpeg = require('fluent-ffmpeg');
                        ffmpeg.setFfmpegPath(ffmpegPath);
                        ffmpeg.setFfprobePath(ffprobePath);
                        availableReso = conf.resolutions;
                        getVideoInfo = require('get-video-info');
                        return [4, getVideoInfo(file.path).then(function (info) {
                                var resize = ffmpeg(file.path);
                                var fileName = crypto
                                    .createHash("md5")
                                    .update(file.originalname)
                                    .digest("hex");
                                var ext = info.format.filename.split('.').pop();
                                fs.copyFile(file.path, "tmp/" + fileName + "-" + info.streams[0].height + "p." + ext, function (err) {
                                    if (err)
                                        throw err;
                                    console.log('Original file has been copied');
                                });
                                for (var key in availableReso) {
                                    if (Object.prototype.hasOwnProperty.call(availableReso, key)) {
                                        if (key < info.streams[0].height) {
                                            resize.videoCodec('libx264')
                                                .format('mp4')
                                                .output("tmp/" + fileName + "-" + key + "p." + ext)
                                                .size(availableReso[key]);
                                        }
                                        else {
                                            delete conf.resolutions[key];
                                        }
                                    }
                                }
                                resize.on('end', function (stdout, stderr) {
                                    console.log('Done Processing!');
                                });
                                resize.run();
                                return resize._outputs;
                            })];
                    case 1: return [2, _a.sent()];
                }
            });
        }); };
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
            var promises, folder, resizeData, index, i, file, _a, _b, _i, key, resized;
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
                        if (!(checker_1.query(req.query, "autoresize") === 'true')) return [3, 2];
                        return [4, this.uploadWithResizer(req.files[0])];
                    case 1:
                        resizeData = _c.sent();
                        console.log(resizeData);
                        for (index = 0; index < resizeData.length; index++) {
                            promises.push(this.uploadPart({
                                originalname: resizeData[index].target.split('/').pop(),
                                path: resizeData[index].target
                            }));
                        }
                        return [3, 10];
                    case 2:
                        i = 0;
                        _c.label = 3;
                    case 3:
                        if (!(i < req.files.length)) return [3, 10];
                        file = req.files[i];
                        if (!checker_1.checkExtensionIf(file.mimetype, "image")) return [3, 8];
                        if (!(conf.image.bulk_resize != false)) return [3, 7];
                        _a = [];
                        for (_b in conf.sizes.image)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 4;
                    case 4:
                        if (!(_i < _a.length)) return [3, 7];
                        key = _a[_i];
                        if (!conf.sizes.image.hasOwnProperty(key)) return [3, 6];
                        return [4, this.Resizer.resizeImage(file, conf.sizes.image[key], key)];
                    case 5:
                        resized = _c.sent();
                        promises.push(this.doUpload(file, resized, folder));
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3, 4];
                    case 7:
                        promises.push(this.doUpload(file, null, folder));
                        return [3, 9];
                    case 8:
                        if (checker_1.checkExtensionIf(file.mimetype, "video")) {
                            promises.push(this.uploadPart(file));
                        }
                        else {
                            return [2, res.end(NOT_ALLOWED_EXTENSION)];
                        }
                        _c.label = 9;
                    case 9:
                        i++;
                        return [3, 3];
                    case 10:
                        Promise.all(promises)
                            .then(function (data) {
                            var _this = this;
                            if (checker_1.query(req.query, "autoresize") === 'true') {
                                var fs_1 = require('fs').promises;
                                setTimeout(function () {
                                    (function () { return __awaiter(_this, void 0, void 0, function () {
                                        var _a, _b, _i, key, e_1;
                                        return __generator(this, function (_c) {
                                            switch (_c.label) {
                                                case 0:
                                                    _c.trys.push([0, 5, , 6]);
                                                    _a = [];
                                                    for (_b in data)
                                                        _a.push(_b);
                                                    _i = 0;
                                                    _c.label = 1;
                                                case 1:
                                                    if (!(_i < _a.length)) return [3, 4];
                                                    key = _a[_i];
                                                    if (!Object.prototype.hasOwnProperty.call(data, key)) return [3, 3];
                                                    return [4, fs_1.unlink('tmp/' + data[key]['Key'])];
                                                case 2:
                                                    _c.sent();
                                                    _c.label = 3;
                                                case 3:
                                                    _i++;
                                                    return [3, 1];
                                                case 4: return [3, 6];
                                                case 5:
                                                    e_1 = _c.sent();
                                                    console.log(e_1);
                                                    return [3, 6];
                                                case 6: return [2];
                                            }
                                        });
                                    }); })();
                                }, 30000);
                                res.send({
                                    resolutions: conf.resolutions,
                                    data: data
                                });
                            }
                            else {
                                res.send(data);
                            }
                        })
                            .catch(function (err) {
                            if (checker_1.query(req.query, "autoresize") === 'true') {
                                res.rend(err);
                            }
                            else {
                                res.send(err.stack);
                            }
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
