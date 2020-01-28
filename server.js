// Init server
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
  
  // calculate DFCF once all data is retrieved
  Promise.all(promises).then(function() {
    for (let symbol of symbols) {
      // if not already calculated
      if (!('dfcf' in data[symbol])) {
        if ('st' in data[symbol] && 'lt' in data[symbol] && 'fcf' in data[symbol]) {
          data[symbol]['dfcf'] = ( ( data[symbol]['st'] + data[symbol]['lt'] ) / data[symbol]['fcf'] ).toFixed(2)
        } else {
          delete data[symbol]
        }
      }
    }
    identifiers['cash-flow']['dfcf'] = "Debt / Free Cash Flow"
    next()
  })
})

app.get('/', function (request, response) {
  response.render('index')
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})