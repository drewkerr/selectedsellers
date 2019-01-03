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
var pages = ['balance-sheet','cash-flow']
var indicators = ['ST Debt & Current Portion LT Debt','Long-Term Debt', 'Free Cash Flow' ]
var st = 0;
var lt = 0;
var fcf = 0;


/*
class Company {
  constructor(symbol, st, lt, fcf){
    this.symbol = symbol;
    this.st = st;
    this.lt = lt;
    this.fcf = fcf;
  }

  get symbol() {
    return this._symbol;
  }

  set symbol(value) {
    this._name = value;
  }
  
  get st() {
    return this._st;
  }

  set st(value) {
    value = app.getData(this.symbol, pages(0), indicators(0));
    console.log(value);
    this._st = value; 
  }
  
  get lt() {
    return this._lt;
  }

  set lt(value) {
    value = app.getData(this.symbol, pages(0), indicators(1));
    this._lt = value;
  }
  
  get fcf() {
    return this._fcf;
  }

  set fcf(value) {
    value = app.getData(this.symbol, pages(1), indicators(2));
    this._fcf = value;
  }
}

*/

/*
app.getData(function (symbol, page, indicator){
    
    fetch.get({
      url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/'+page,
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
        
        var temp = parseInt($('td:contains(' + indicator + ')').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0
        return temp;
      }
    })
})
*/

app.use(function (request, response, next) {
  //if (! data.length) {
  for (let symbol of symbols) {
    fetch.get({
      url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/'+pages[0],
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
        
        st = parseInt($('td:contains("ST Debt & Current Portion LT Debt")').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0
        lt = parseInt($('td:contains("Long-Term Debt")').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0      
        
        //console.log(st,lt,data)
        next()
      }
    }) 
  }
})

app.use2(function (request, response, next) {
  //if (! data.length) {
  for (let symbol of symbols) {
    fetch.get({
      url: 'https://quotes.wsj.com/AU/XASX/'+symbol+'/financials/annual/'+pages[1],
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
        
        fcf = parseInt($('td:contains("Free Cash Flow")').first().parent().children().eq(1).text().replace(/[^0-9]/g, ''))*multiplier || 0
              
        
        console.log(st,lt,fcf)
        next()
      }
    }) 
  }
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