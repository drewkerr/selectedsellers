var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
const cheerio = require('cheerio')
var fetch = require('request-promise-native')

app.post('/search', function (request, response) {
  var promises = []
  fetch.get({ url: request.query.url }, (err, res, body) => {
    if (err) {
      console.log('Error:', err)
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode)
    } else {
      const $ = cheerio.load(body)
      $("a[href^='https://www.ebay.com.au/str/']").each( (i, e) => {
        promises.push(fetch.get({
          url: $(this).attr('href')
        }, (err, res, body) => {
          if (err) {
            console.log('Error:', err)
          } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode)
          } else {
            return $("a[href^='https://www.ebay.com.au/usr/']").eq(0).attr('href').slice(26)
          }
        }))
      })
    }
  })
  
  Promise.all(promises).then( (stores) => {
    var url = 'https://www.ebay.com.au/sch/i.html?_nkw=ipad+mini+case&_in_kw=1&_ex_kw=&_sacat=0&_udlo=&_udhi=&_ftrt=901&_ftrv=1&_sabdlo=&_sabdhi=&_samilow=&_samihi=&_sadis=15&_stpos=2223&_sargn=-1%26saslc%3D1&_salic=15&_fss=1&_fsradio=%26LH_SpecificSeller%3D1&_saslop=1&_sasl=100percentmoto&_sop=12&_dmd=1&_ipg=200&_fosrp=1'
    response.redirect(url)
  })
})

app.get('/', function (request, response) {
  response.render('index')
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})