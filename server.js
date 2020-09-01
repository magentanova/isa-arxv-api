require('dotenv/config');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const mime = require('mime-types');
const sharp = require('sharp');
const cors = require('cors');

const S3 = require('aws-sdk/clients/s3');

const app = express();

app.use(bodyParser.json({limit:'15gb'}));
app.use(cors());

const bucket = 'isa-arxv';

const s3 = new S3({
    apiVersion: '2006-03-01',
    region: 'us-east-1', 
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })

const upload = multer({
    storage: 
      multerS3({
        s3,
        bucket,
        acl: "public-read",
        contentType: function(req,file,cb) {
          cb(null,file.mimetype);
        },
        key: function(req, file, cb) {
          const {
            year, 
            category,
            type,
            order,
            title,
            filename
          } = req.body;
          cb(null,`${year}/${category}/${type}/${order}/${filename}`);
        },
        shouldTransform: function(req, file, cb) {
          cb(null, req.body.type === "photo")
        },
        transforms: [
          { 
            id: "web",
            key: function(req, file, cb) {
              const {
                year, 
                category,
                type,
                order,
                filename,
                title
              } = req.body;
              let nameToWrite = filename;
              if (title && title !== "undefined") {
                const ext = filename.split('.')[filename.split('.').length - 1];
                nameToWrite = title + '.' + ext;
              }
              cb(null,`${year}/${category}/${type}/${order}/${nameToWrite}`);
            },
            transform: function(req, file, cb) {
              cb(null, sharp().resize({
                  width: 1800,
                  height: 1200,
                  fit: "inside"
                })
              )
            }
          }
        ]
      }),
    limits: {
      fileSize: "15gb"
    }
  });
  

app.get('/list/all', (req, res) => {
  return s3.listObjectsV2({Bucket: bucket})
    .promise()
    .then(data => res.send(data));
});

app.get('/list/:key', (req, res) => {
  return s3.listObjectsV2({Bucket: bucket, Prefix: req.params.key})
    .promise()
    .then(data => res.send(data));
})

app.post('/upload', upload.single('file'), (req, res) => {
  return res.json("Uploaded!");
})
 
app.get('/head/:key', (req, res) => {
  return s3.headObject({
      Bucket: bucket,
      Key: req.params.key
    })
    .promise()
    .then(
        data => res.send(data),
        err => res.send(err)
    )
});

app.listen(process.env.PORT, () => {
    console.log(`Listening for requests on port ${process.env.PORT}...\n`);
})