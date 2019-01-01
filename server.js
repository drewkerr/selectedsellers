var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
app.locals.pretty = true;
app.set('json spaces', 2)
const cheerio = require('cheerio')

var fetch = require('request')
var data = {}
var symbols = ['BKW','CSL']

app.use(function (request, response, next) {
  //if (! data.length) {
  for (let symbol of symbols) {
    fetch.get({
      url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/balance-sheet',
    }, (err, res, body) => {
      if (err) {
        console.log('Error:', err)
      } else if (res.statusCode !== 200) {
        console.log('Status:', res.statusCode)
      } else {
        console.log('Data loaded')
        const $ = cheerio.load(body)
        switch($('.fiscalYr').eq(1).text()) {
          case "All values AUD Millions.":
            var multiplier = 1000000
            break
          default:
            var multiplier = 1
        }
        data[symbol] = parseInt($('td:contains("Long-Term Debt")').first().parent().children().eq(1).text())*multiplier
        console.log(data)
        next()
      }
    })
  }
  //} else {
  //  next()
  //}
})

app.get('/', function (request, response) {
  response.render('index', {data: data})
})

app.get('/json', function (request, response) {
  response.json(data);
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})