require('dotenv').config();
const express = require('express');
const cors = require('cors');

// added modules
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const mongoose = require('mongoose');

// destructure mongoose
const { Schema, model } = mongoose;

const app = express();

// body parsing middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// connect to MongoDB database fcc-url-shortener
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// create shorturlSchema
const shorturlSchema = Schema({
  shorturl: {
    type: Number,
    required: true
  },
  website: {
    type: String,
    required: true
  }
});

// create Shorturl model
const Shorturl = model('Shorturl', shorturlSchema);

// async function to add doc to database
async function addUrl(url) {
  // create new id for shorturl
  const docsNum = await Shorturl.countDocuments();
  const newId = docsNum + 1;
  // add document
  const shorturl = await Shorturl.create({
    shorturl: newId,
    website: url
  });
  return newId;
}

// URL shortener endpoint
app.post('/api/shorturl', (req, res) => {
  // check for valid URL format
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  if (urlRegex.test(req.body.url)) {
    // create URL object
    const inputUrl = url.parse(req.body.url);
    // check for valid URL with DNS lookup
    dns.lookup(inputUrl.host, (error, address, family) => {
      if (error) {
        res.json({
          error: 'invalid url'
        });
      } else {
        // aysnc IIFE to obtain id to display in json res
        (async () => {
          number = await addUrl(req.body.url);
          res.json({
            original_url: req.body.url,
            short_url: number
          });
          console.log(`shorturl ${number} added: ${req.body.url}`);
        })()
      }
    });
  } else {
    res.json({
      error: 'invalid url'
    });
  }
})

// async function to retrieve website url from shorturl
async function retrieveUrl(id) {
  const shorturl = await Shorturl.findOne({ shorturl: id }).exec();
  return shorturl.website;
}

// URL redirect endpoint
app.get('/api/shorturl/:id(\\d+)/', (req, res) => {
  const number = req.params.id;
  // async IIFE to obtain url to redirect to
  (async () => {
    const url = await retrieveUrl(number);
    res.redirect(url);
    console.log(`shorturl ${number} retrieved: ${url}`);
  })()
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
