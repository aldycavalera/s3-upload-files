import * as crypto from "crypto";
import * as sharp from "sharp";

interface ImageInterface {
  resizeImage(file: any, size: object, sizeType: string): void;
}

export class Resizer implements ImageInterface {
  // resize image
  resizeImage = async (file: any, size: object, sizeType = "full") => {
    var data = await sharp(file.path)
      .resize(size)
      .withMetadata()
      .toBuffer()
      .then((data: object) => {
        let fileName = crypto
          .createHash("md5")
          .update(file.originalname)
          .digest("hex");
        fileName = `${fileName}-${sizeType}.${file.originalname
          .split(".")
          .pop()}`;
        return {
          Body: data,
          Key: fileName,
        };
      });
    return data;
  };
}
