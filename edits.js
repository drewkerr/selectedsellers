var pages = ['balance-sheet','cash-flow']
var indicators = ['ST Debt & Current Portion LT Debt','Long-Term Debt', 'Free Cash Flow' ]
var st = (pages[0], indicators[0]);
var lt = (pages[0], indicators[1]);
var fcf = (pages[1], indicators[2]);

Function(symbol, page, indicator)

for (let symbol of symbols)
  data[0] = symbol
  data[0][1][0] = "Short-term Debt and Current Portion Long-term Debt"
  data[0][1][1] = st
  data[0][2][0] = "Long-term Debt"
  data[0][2][1] = lt
  data[0][3][0] = "Free Cash Flow"
  data[0][3][1] = fcf
  data[0][4][0] = "Debt / Free Cash Flow"
  data[0][4][1] = "(st + lt) / fcf"*/

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