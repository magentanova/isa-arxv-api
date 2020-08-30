require('dotenv/config');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const S3 = require('aws-sdk/clients/s3');

const app = express();

app.use(bodyParser.json({limit:'15gb'}));
app.use(cors());

const Bucket = 'isa-arxv';

const s3 = new S3({
    apiVersion: '2006-03-01',
    region: 'us-east-1', 
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })

app.get('/list/all', (req, res) => {
  return s3.listObjectsV2({Bucket})
    .promise()
    .then(data => res.send(data));
});

app.get('/list/:key', (req, res) => {
  return s3.listObjectsV2({Bucket, Prefix: req.params.key})
    .promise()
    .then(data => res.send(data));
})

app.post('/upload', (req, res) => {
  const {
    year, 
    category,
    type,
    order,
    title,
    filename,
    body
  } = req.body;
  const Key = `${year}/${category}/${type}/${order}/${filename}`
  return s3.putObject({
      Bucket, 
      Key,
      Body: body
    })
    .promise()
    .then(result => res.send(result));
})
 
app.get('/head/:key', (req, res) => {
  return s3.headObject({
      Bucket,
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