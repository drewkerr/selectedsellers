var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
app.locals.pretty = true;
app.set('json spaces', 2)
const cheerio = require('cheerio')

var fetch = require('request-promise')
var data = {}
var symbols = ['BKW','CSL','SNZ','CCL','EMB','FNP','TGR','ALK','WAM']
var identifiers = { 'balance-sheet': { st: 'ST Debt & Current Portion LT Debt', lt: 'Long-Term Debt' },
                    'cash-flow': { fcf: 'Free Cash Flow' } }

app.use(function (request, response, next) {
  if (!data.length) {
    var promises = []
    for (let symbol of symbols) {
      data[symbol] = {}
      for (let page in identifiers) {
        promises.push(fetch.get({
          url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/'+page,
        }, (err, res, body) => {
          if (err) {
            console.log('Error:', err)
          } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode)
          } else {
            console.log('Loaded',symbol,page)
            const $ = cheerio.load(body)
            switch($('.fiscalYr').eq(1).text().split(' ').pop()) {
              case "Millions.":
                var multiplier = 1000000
                break
              case "Thousands.":
                var multiplier = 1000
                break
              default:
                var multiplier = 1
            }

            for (let id in identifiers[page]) {
              var number = $('td:contains("'+identifiers[page][id]+'")').first().parent().children().eq(1).text()
              data[symbol][id] = parseFloat(number.replace(/[(]/,'-').replace(/[,]/g,''))*multiplier || 0
              console.log(symbol,identifiers[page][id],data[symbol][id],number,multiplier)
            }
          }
        }))
      }
    }
    Promise.all(promises).then(function() {
      for (let symbol of symbols) {
        data[symbol]['dfcf'] = ((data[symbol]['st']+data[symbol]['lt'])/data[symbol]['fcf']).toFixed(2);
      }
      identifiers['cash-flow']['dfcf'] = "Debt / Free Cash Flow"
      next()
    })
  } else {
    next()
  }
})

app.get('/', function (request, response) {
  response.render('index', {data: data, ids: identifiers})
})

app.get('/json', function (request, response) {
  response.json(data);
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})