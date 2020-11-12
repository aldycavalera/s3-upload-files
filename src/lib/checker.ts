import * as crypto from "crypto";
import * as mime from "mime/lite";
const conf = require("../default.config.json");

const checkExtensionIf = (ext: string, type: string) => {
  try {
    if (
      mime.getExtension(ext) in conf.extension[type] &&
      conf.extension[type][mime.getExtension(ext)] === true
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }
};

const query = (query: any, param: string) => {
  if (query[param] !== undefined) return query[param];
  else return false;
};

export { checkExtensionIf, query };
