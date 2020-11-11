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
