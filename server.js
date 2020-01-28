var data = {}

// Init server
var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
app.locals.pretty = true;
app.set('json spaces', 2)
const cheerio = require('cheerio')
var fetch = require('request-promise')

// Data to grab from web
var identifiers = { 'balance-sheet': { st: 'ST Debt & Current Portion LT Debt', lt: 'Long-Term Debt' },
                    'cash-flow': { fcf: 'Free Cash Flow' } }

// Load list of symbols
var symbols = []
// Remove symbols from stored data if not in list
for (let symbol in data) {
  if (!symbols.includes(symbol)) {
    delete data[symbol]
    console.log('Deleting old symbol',symbol)
  }
}

app.use(function (request, response, next) {
  var promises = []
  for (let symbol of symbols) {
    // only fetch if not already in data
    if (!(symbol in data)) {
      data[symbol] = {}
      for (let page in identifiers) {
        // fetch data from web page
        promises.push(fetch.get({
          url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/'+page,
        }, (err, res, body) => {
          if (err) {
            console.log('Error:', err)
          } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode)
          } else {
            // load DOM parser (jQuery syntax)
            const $ = cheerio.load(body)
            // check symbol is valid
            if ($('h1').eq(0).text() != 'Company Not Found') {
              console.log('Loaded',symbol,page)
              // check for multiplier note in page
              switch ($('.fiscalYr').eq(1).text().split(' ').pop()) {
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
                // extract data from page using DOM parser
                var number = $('td:contains("'+identifiers[page][id]+'")').first().parent().children().eq(1).text()
                // remove non-numeric characters, brackets to negatives, convert to number and multiply or zero if empty
                data[symbol][id] = parseFloat(number.replace(/[(]/,'-').replace(/[,]/g,''))*multiplier || 0
                console.log(symbol,identifiers[page][id],data[symbol][id],number,multiplier)
              }
            } else {
              console.log('Invalid symbol',symbol)
            }
          }
        }))
      }
    } else {
      next()
    }
  }
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
  // serve page using index.pug as template
  response.render('index', {data: data, ids: identifiers})
})

app.get('/reload/:symbol', function (request, response) {
  delete data[request.params.symbol]
  response.redirect('/')
})

app.get('/json', function (request, response) {
  response.json(data);
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})