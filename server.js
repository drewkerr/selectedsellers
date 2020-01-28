var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const $ = require('cheerio')
var fetch = require('request-promise-native')

app.get('/search', function (request, response) {
  var promises = []
  console.log(request.query.url)
  fetch.get(request.query.url, (err, res, body) => {
    if (err) {
      console.log('Error:', err)
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode)
    } else {
      $("a[href^='https://www.ebay.com.au/str/']", body).eq(4).each( (i, e) => {
        console.log($(e).attr('href'))
        promises.push(
          fetch.get( $(e).attr('href') )
            .then(body => {
              return $("a[href^='http://www.ebay.com.au/usr/']", body).eq(0).attr('href').slice(25)
            })
            .catch(err => {
              console.log(err)
              return err
            })
        )
      })
    }
  })
  
  Promise.all(promises).then(stores => {
    console.log(stores)
    var url = 'https://www.ebay.com.au/sch/ebayadvsearch?_fsradio=%26LH_SpecificSeller%3D1&_sop=12&_saslop=1&_sasl='
    url += stores.join('%2C')
    response.redirect(url)
  })
})

app.get('/', function (request, response) {
  response.render('index')
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})