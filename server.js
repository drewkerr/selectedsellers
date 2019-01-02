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
var statements = ['balance-sheet','cash-flow']

app.use(function (request, response, next) {
  //if (! data.length) {
  for (let symbol of symbols) {
    for (let statement of statements)
      fetch.get({
        url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/'+statement,
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
        var st = parseInt($('td:contains("ST Debt & Current Portion LT Debt")').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0
        var lt = parseInt($('td:contains("Long-Term Debt")').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0
        var cf = parseInt($('td:contains("Free Cash Flow")').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0
        data[symbol] = st,lt,(st+lt)/cf
        console.log(st,lt,cf,data)
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