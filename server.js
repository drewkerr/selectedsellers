process.env.UV_THREADPOOL_SIZE = 128
const options = {
  timeout: 20000,
  pool: {
    maxSockets: Infinity
  }
}

var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const $ = require('cheerio')
var fetch = require('request-promise')
const Promise = require('bluebird')

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
    var urls = []
    fetch.get(term).then(body => {
      $("a[href^='https://www.ebay.com.au/str/']", body).each( (i, e) => {
        urls.push( $(e).attr('href') )
      })
      Promise.map(urls, url => {
        fetch.get(url, options).then(body => {
          var store = $("a[href^='http://www.ebay.com.au/usr/']", body).eq(0).attr('href') || $("a[href^='http://myworld.ebay.com.au/']", body).eq(0).attr('href')
          if (store) {
            console.log(store)
            return store
          } else {
            console.error("Error:", url)
          }
        }).catch(err => { console.error(err) })
      }, {concurrency: 3} ).then(stores => {
        var search = 'https://www.ebay.com.au/sch/ebayadvsearch?_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
        search += stores.join('%2C')
      })
    }).catch(err => { console.error(err) })
  })

})