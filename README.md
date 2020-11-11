# S3 Upload Files

S3 Upload files is a NodeJS application for uploading files to S3 with ease.

## Installation

S3 Upload files requires [Node.js](https://nodejs.org/) v10+ to run.

#### Local Development

Clone this repository

```sh
git clone https://github.com/aldycavalera/s3-upload-files.git
```

Then install all the dependencies

```sh
$ cd s3-upload-files/dist
$ npm install
```

Create a new file inside of s3-upload-files folder, name it to server.js or whatever you want. Then create your own development server by pasting this code:

```sh 
import * as dotenv from "dotenv";
dotenv.config();
import * as express from "express";
import { Uploader } from "./index";

const upload = new Uploader();
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
$ node ./server.js
```

#### Deploy to Live Server

To deploy this package to your own hosting provider, please see [DEPLOYMENT.md](https://github.com/aldycavalera/s3-upload-files/blob/main/DEPLOYMENT.md)


License
----

MIT
