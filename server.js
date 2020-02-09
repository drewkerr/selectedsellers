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

io.on('connection', socket => {
  
  socket.on('search', term => {
    console.log('Search for:', term)
    var urls = []
    var progress = 0
    fetch.get(term).then(body => {
      $("a[href^='https://www.ebay.com.au/str/']", body).each( (i, e) => {
        urls.push( $(e).attr('href') )
      })
      Promise.mapSeries(urls, async url => {
        await Promise.delay(100).then(() => {
          progress++
          fetch.get(url).then(body => {
            var store = $("a[href^='http://www.ebay.com.au/usr/']", body).eq(0).attr('href') || $("a[href^='http://myworld.ebay.com.au/']", body).eq(0).attr('href')
            if (store) {
              console.log(store)
              return store
            } else {
              console.error("Error:", url)
            }
            io.emit('progress', progress / urls.length * 100)
          }).catch(err => {
            console.error(err)
            io.emit('progress', progress / urls.length * 100)
          })
        })
      }).then(stores => {
        var search = 'https://www.ebay.com.au/sch/ebayadvsearch?_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
        search += stores.join('%2C')
        io.emit('redirect', search)
      })
    }).catch(err => {
      console.error(err)
      io.error('error', 'Invalid URL')
    })
  })

})