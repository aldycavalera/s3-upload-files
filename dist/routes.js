module.exports = function (app) {
    var controller = require('./src/controller/controller');
    var multer = require('multer');
    var storage = multer.diskStorage({
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    });
    var upload = multer({ storage: storage, limits: { fileSize: 100000000 } });
    app.post('/upload', upload.single('image'), controller.post);
};
