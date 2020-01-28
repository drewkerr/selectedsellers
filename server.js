var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const $ = require('cheerio')
var fetch = require('request-promise-native')

app.get('/search', (request, response) => {
  var promises = []
  fetch.get(request.query.url).then(body => {
    $("a[href^='https://www.ebay.com.au/str/']", body).each( (i, e) => {
      console.log(i)
      promises.push(
        fetch.get( $(e).attr('href') ).then(body => {
            return $("a[href^='http://www.ebay.com.au/usr/']", body).eq(0).attr('href').slice(27)
        }).catch(err => { return err })
      )
    })
    Promise.all(promises).then(stores => {
      console.log(stores)
      var url = 'https://www.ebay.com.au/sch/ebayadvsearch?_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
      url += stores.join('%2C')
      response.redirect(url)
    })
  }).catch(err => { return err })
})

app.get('/', (request, response) => {
  response.render('index')
})

var listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})