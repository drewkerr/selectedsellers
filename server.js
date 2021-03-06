// Load data from and save to file
var fs = require('fs')
try {
  var cache = require('./cache.json')
  console.log(Object.keys(cache).length,'stores loaded.')
} catch(e) {
  var cache = {}
  console.log('Cache reset:',e)
}
process.on('SIGTERM', function() {
  fs.writeFile('./cache.json', JSON.stringify(cache), function(e) {
    if (e) {
      console.log(e)
    } else {
      console.log(Object.keys(cache).length,'stores saved.')
    }
    process.exit(0)
  })
})

var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const $ = require('cheerio')
var fetch = require('request-promise')
const Promise = require('bluebird')

app.get('/', (request, response) => {
  response.render('index', { hits: cache['hits'] } )
})

var server = require('http').createServer(app)
var listener = server.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

var io = require('socket.io')(server)

io.on('connection', socket => {
  
  socket.on('search', term => {
    cache['hits'] = (cache['hits'] || 0) + 1
    console.log('Search for:', term)
    var urls = []
    var stores = []
    var progress = 0
    fetch.get(term['url']).then(body => {
      $("ul a[href*='ebay.com.au/str/']", body).each( (i, e) => {
        urls.push( $(e).attr('href') )
      })
      const makeLink = () => {
        const search = 'https://www.ebay.com.au/sch/ebayadvsearch?'
        const listing = 'https://www.ebay.com.au/sch/i.html?'
        const sellers = '_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
        if (term['item']) {
          var link = listing + sellers + stores.join('%2C') + '&_nkw=' + term['item']
        } else {
          var link = search + stores.join('%2C')
        }
        io.to(socket.id).emit('link', link)
      }
      Promise.mapSeries(urls, async url => {
        if (cache[url]) {
          progress++
          stores.push(cache[url])
          if (stores.length == 50) {
            makeLink()
            stores = []
          }
          io.to(socket.id).emit('progress', progress / urls.length * 100)
        } else {
          await Promise.delay(200).then(() => {
            progress++
            fetch.get(url).then(body => {
              var store = $("a[href^='http://www.ebay.com.au/usr/']", body).eq(0).attr('href') || $("a[href^='http://myworld.ebay.com.au/']", body).eq(0).attr('href')
              if (store) {
                console.log(store)
                cache[url] = store.slice(27).replace('/','')
                stores.push(cache[url])
                if (stores.length == 50) {
                  makeLink()
                  stores = []
                }
              } else {
                throw 'Invalid User'
              }
              io.to(socket.id).emit('progress', progress / urls.length * 100)
            }).catch(err => {
              console.error(url)
              io.to(socket.id).emit('error', 'Invalid store: ' + url)
            })
          })
        }
      }).delay(1000).then(data => {
        if (stores.length) {
          makeLink()
        } else {
          io.to(socket.id).emit('error', 'Invalid URL')
        }
      })
    }).catch(err => {
      console.error(err)
      io.to(socket.id).emit('error', 'Invalid URL')
    })
  })

})