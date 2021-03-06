# S3 Upload Files

S3 Upload files is a NodeJS application for uploading files to S3 with ease.

## Prerequisite

- S3 Upload files requires [Node.js](https://nodejs.org/) v10+ to run.
- A configuration for s3 such as Secret Key, Key ID, Bucket name, etc\
  Create a new file called .env and paste it. You may need to fill it with your own credentials

  ```sh
  PORT="3000"
  ACCESS_KEY_ID="ACCESS_KEY_ID"
  SECRET_ACCESS_KEY="SECRET_ACCESS_KEY"
  BUCKET_NAME="BUCKET_NAME"
  REGION="ap-southeast-1"
  ```

## Installation

### Local Development

Clone this repository

```sh
git clone https://github.com/aldycavalera/s3-upload-files.git
```

Then install all the dependencies

```sh
$cd s3-upload-files
$npm install
```

Create a new file inside of s3-upload-files/dist folder, name it to server.js or whatever you want. Then create your own development server by pasting this code:

```sh
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const index = require("./index");

const upload = new index.Uploader();
const app = express();
const port = process.env.PORT;
const bodyPraser = require("body-parser");

app.use(
  bodyPraser.urlencoded({
    extended: false,
  })
);
app.listen(port);
console.log("\x1b[32m", `Server listening on port ${port}`);
upload.upload(app);
```

Start development server

```sh
$node ./dist/server.js
```

### Deploy to Live Server

To deploy this package to your own hosting provider, please see [DEPLOYMENT.md](https://github.com/aldycavalera/s3-upload-files/blob/main/DEPLOYMENT.md)

## License

---

MIT
