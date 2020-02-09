var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const $ = require('cheerio')
var fetch = require('request-promise')
const Promise = require('bluebird')

app.get('/search', (request, response) => {
  var urls = []
  fetch.get(request.query.url).then(body => {
    $("a[href^='https://www.ebay.com.au/str/']", body).each( (i, e) => {
      urls.push( $(e).attr('href') )
    })
    Promise.each(urls, url => {
      fetch.get(url).then(body => {
        var store = $("a[href^='http://www.ebay.com.au/usr/']", body).eq(0).attr('href') || $("a[href^='http://myworld.ebay.com.au/']", body).eq(0).attr('href')
        if (store) {
          console.log(store)
          return store
        } else {
          console.error("Error:", url)
        }
      }).catch(err => { console.error(err) })
    }).then(stores => {
      var search = 'https://www.ebay.com.au/sch/ebayadvsearch?_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
      search += stores.join('%2C')
      response.redirect(search)
    })
  }).catch(err => { console.error(err) })
})

app.get('/', (request, response) => {
  response.render('index')
})

var server = require('http').createServer(app)
var listener = server.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

var io = require('socket.io')(server)

io.on('connection', function(socket) {
  
  socket.on('search', function(term, fn) {
    console.log('Search for:', term)
    var results = { resultCount: 0, results: [] }
    var url = 'https://itunes.apple.com/search?media=music&explicit=no&limit=10&term='
    url += encodeURIComponent(term)
    itunes.get({ url: url, json: true  }, (err, res, data) => {
      if (err) {
        console.log('Error:', err)
      } else if (res.statusCode !== 200) {
        console.log('Status:', res.statusCode)
      } else {
        results = data
      }
      fn(results)
    })
  })
})