require("dotenv").config();
import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as crypto from "crypto";
import * as mime from "mime/lite";
const conf = require("./default.config.json");
import { Resizer } from "./lib/resizer";
import { checkExtensionIf, query } from "./lib/checker";

const NOT_ALLOWED_EXTENSION: string = "Not allowed extension";

const ACL: any = [
  "private",
  "public-read",
  "public-read-write",
  "aws-exec-read",
  "authenticated-read",
  "bucket-owner-read",
  "bucket-owner-full-control",
  "log-delivery-write",
];

// s3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

export class Uploader {
  Resizer: any;

  constructor() {
    this.Resizer = new Resizer();
  }

  public routes = (app) => {
    const multer = require("multer");

    const storage = multer.diskStorage({
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      },
    });

    let upload = multer({ storage: storage, limits: { fileSize: 100000000 } });

    app.post("/upload", upload.array("files"), this.post);
  };

  /**
   * Check if bucket were exists or not
   * @param {*} name
   */
  checkBucket = (name) => {
    // Call S3 to list the buckets
    s3.listBuckets(function (err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data.Buckets);
      }
    });
  };

  /**
   * Upload part for video
   * @param {*} file
   */
  uploadPart = (file) => {
    const stream = fs.createReadStream(file.path);
    // console.log(file)
    const params = {
      ACL: conf.ACL,
      Bucket: process.env.BUCKET_NAME,
      Body: stream,
      Key: file.originalname,
    };

    const options = {
      partSize: 5 * 1024 * 1024,
      queueSize: 5,
    };

    try {
      return s3.upload(params, options).promise();
      // return s3.upload(params, options).on('httpUploadProgress', function(evt) {
      //   console.log("Uploaded : " + (evt.loaded * 100) / evt.total +'%');
      // }).promise();
    } catch (error) {
      console.log("upload ERROR", file, error);
    }
  };

  doUpload = (file: any, buffer = null, folder: any = false) => {
    interface Params {
      ACL: string;
      Bucket: string;
      Body: any;
      Key: string;
    }
    let params = {} as Params;
    if (folder !== "" && folder !== false) {
      folder = `${folder}/`;
    } else {
      folder = "";
    }
    if (!buffer) {
      const FILES = file;
      let path = FILES.path;
      let fileName = crypto
        .createHash("md5")
        .update(FILES.originalname)
        .digest("hex");
      fileName = `${folder}${fileName}.${FILES.originalname.split(".").pop()}`;
      params = {
        ACL: conf.ACL,
        Bucket: process.env.BUCKET_NAME,
        Body: fs.createReadStream(path),
        Key: `${fileName}`,
      };
    } else {
      params = {
        ACL: conf.ACL,
        Bucket: process.env.BUCKET_NAME,
        Body: buffer.Body,
        Key: folder + buffer.Key,
      };
    }
    return s3.upload(params).promise();
  };

  post = async (req: any, res: any) => {
    var promises: Array<object> = [];
    var folder: string = "";
    // check if user specify the bucket name
    // if (req.query.bucket !== undefined) {
    //   process.env.BUCKET_NAME = req.query.bucket;
    //   checkBucket(req.query.bucket);
    // }

    /** Checking each query */
    folder = query(req.query, "folder");
    conf.image.bulk_resize = query(req.query, "bulk_image");
    if (
      query(req.query, "ACL") != false &&
      ACL.includes(query(req.query, "ACL"))
    ) {
      conf.ACL = query(req.query, "ACL");
    }
    /** end checking */

    for (var i = 0; i < req.files.length; i++) {
      var file = req.files[i];
      if (checkExtensionIf(file.mimetype, "image")) {
        if (conf.image.bulk_resize != false) {
          for (const key in conf.sizes.image) {
            if (conf.sizes.image.hasOwnProperty(key)) {
              var resized = await this.Resizer.resizeImage(
                file,
                conf.sizes.image[key],
                key
              );
              promises.push(this.doUpload(file, resized, folder));
            }
          }
        }
        // original files will always uploaded
        promises.push(this.doUpload(file, null, folder));
      } else if (checkExtensionIf(file.mimetype, "video")) {
        promises.push(this.uploadPart(file));
      } else {
        return res.end(NOT_ALLOWED_EXTENSION);
      }
    }
    Promise.all(promises)
      .then(function (data) {
        // console.log(data)
        res.send(data);
      })
      .catch(function (err) {
        res.send(err.stack);
      });
  };

  public upload = (app) => {
    return this.routes(app);
  };
}
