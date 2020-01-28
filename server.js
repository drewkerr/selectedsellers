var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const cheerio = require('cheerio')
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
      var $ = cheerio.load(body)
      $("a[href^='https://www.ebay.com.au/str/']").eq(4).each( (i, e) => {
        console.log($(e).attr('href'))
        promises.push(
          fetch.get( $(e).attr('href') )
            .then( (body) => {
              var $ = cheerio.load(body)
              console.log($("a[href^='https://www.ebay.com.au/usr/']").eq(0).attr('href').slice(26))
              return $("a[href^='https://www.ebay.com.au/usr/']").eq(0).attr('href').slice(26)
            })
            .catch( (err) => {
              console.log(err)
              return
            })
        )
      })
    }
  })
  
  Promise.all(promises).then( (stores) => {
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