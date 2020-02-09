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
    Promise.map(urls, fetch.get, {concurrency: 1}).then(stores => {
      var url = 'https://www.ebay.com.au/sch/ebayadvsearch?_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
      url += stores.join('%2C')
      response.redirect(url)
    })
  }).catch(err => { console.log(err) })
})

app.get('/', (request, response) => {
  response.render('index')
})

var listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})