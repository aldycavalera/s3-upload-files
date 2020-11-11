require("dotenv").config();
import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as crypto from "crypto";
import * as mime from "mime/lite";
const conf = require("./uploader_config.json");
import { Resizer } from "./lib/resizer";

// s3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
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
      ACL: "public-read",
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
    } catch (error) {
      console.log("upload ERROR", file, error);
    }
  };

  doUpload = (file, buffer = null) => {
    interface Params {
      ACL: string;
      Bucket: string;
      Body: any;
      Key: string;
    }
    let params = {} as Params;
    if (!buffer) {
      const FILES = file;
      let path = FILES.path;
      let fileName = crypto
        .createHash("md5")
        .update(FILES.originalname)
        .digest("hex");
      fileName = fileName + `.${FILES.originalname.split(".").pop()}`;
      params = {
        ACL: "public-read",
        Bucket: process.env.BUCKET_NAME,
        Body: fs.createReadStream(path),
        Key: `${fileName}`,
      };
    } else {
      params = {
        ACL: "public-read",
        Bucket: process.env.BUCKET_NAME,
        Body: buffer.Body,
        Key: buffer.Key,
      };
    }
    return s3.upload(params).promise();
  };

  post = async (req, res) => {
    var promises = [];
    // check if user specify the bucket name
    // if (req.query.bucket !== undefined) {
    //   process.env.BUCKET_NAME = req.query.bucket;
    //   checkBucket(req.query.bucket);
    // }
    for (var i = 0; i < req.files.length; i++) {
      var file = req.files[i];
      if (
        mime.getExtension(file.mimetype) in conf.extension.image &&
        conf.extension.image[mime.getExtension(file.mimetype)] === true
      ) {
        for (const key in conf.sizes.image) {
          if (conf.sizes.image.hasOwnProperty(key)) {
            var resized = await this.Resizer.resizeImage()(
              file,
              conf.sizes.image[key],
              key
            );
            promises.push(this.doUpload(file, resized));
          }
        }
        promises.push(this.doUpload(file));
      } else {
        promises.push(this.uploadPart(file));
      }
    }
    Promise.all(promises)
      .then(function (data) {
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
