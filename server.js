// Load from and save to file

var fs = require('fs')
try {
  var data = require('./db.json')
  console.log(data.length + ' symbols loaded.')
} catch(e) {
  var data = {}
  console.log('Symbols reset: ' + e)
}

process.on('SIGTERM', function() {
  fs.writeFile('db.json', JSON.stringify(data), function(err) {
    if (err) {
      console.log(err)
    } else {
      console.log(data.length + ' tracks saved.')
    }
    process.exit(0)
  })
})

var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
app.locals.pretty = true;
app.set('json spaces', 2)
const cheerio = require('cheerio')

var fetch = require('request-promise')
var data = {}
var symbols = [
  'CHC','TWD','SUL','IVC','SHL','BKW','POO'
  /*
'JHX',
'AMP',
'HSO',
'CNU',
'SUN',
'VEA',
'SGR',
'TGR',
'BIN',
'EMB',
'APT',
'NXT',
'FNP',
'BRU',
'ALK',
'ALU',
'NWL',
'OZL',
'PME',
'REH',

'TWD',
'A2M',
'MGX',
'CUE',  
'SBM',
'SAR',
'SFR',
'NHC',
'WTC',
'LMW',
'NST',
'GRR',
'SOL',
'FLT',
'SDI',
'RND',
'MTS',
'BRG',
'SGM',  
'WHC',

'EVN',
'COH',
'KMD',
'ILU',
'UNV',
'S32',
'MND',
'ARB',
'CIM',
'IGO',
'TME',
'BSE',
'WEB',
'BSL',
'COL',
'REA',
'IEL',
'RIO',
'WES',
'CLH',

'BKL',
'PMV',
'SIQ',
'AGL',
'BHP',
'BPT',
'OGC',
'NCM',
'CTX',
'HVN',
'WOW',
'MPL',
'ING',
'SUL',
'NHF',
'ZEL',
'MIN',
'MYO',
'MMS',
'IRE',

'ABC',
'CPU',
'AIS',
'QAN',
'SPK',
'SEK',
'ALL',
'NVT',
'CSL',
'GEM',
'CAR',
'LNK',
'CWN',
'DMP',
'WOR',
'BAP',
'CEN',
'ORI',
'SHL',
'RIC',

'DLX',
'AZJ',
'ORA',
'STO',
'MYX',
'TPM',
'ALQ',
'HLS',
'ANN',
'APX',
'DOW',
'CAT',
'APE',
'IPL',
'CLX',
'RHC',
'DHG',
'BGA',
'CCL',
'AMC',

'CWY',
'IVC',
'TWE',
'C6C',
'BXB',
'EVT',
'ORG',
'SKC',
'PGH',
'TCL',
'VOC',
'BLD',
'SYD',
'SVW',
'RWC',
'GNC',
'TAH',
'YAL',
'AST',
'APA',

'QUB',
'VAH',
'AIA',
'NAB',
'ANZ',
'QBE',
'WBC',
'CBA',
'ABP',
'ASX',
'BEN',
'BOQ',
'BWP',
'CCP',
'CGF',
'CHC',
'CIN',
'CMW',
'CQR',
'CYB',

'DXS',
'GMG',
'GOZ',
'IAG',
'LLC',
'MFG',
'MGR',
'MQG',
'NSR',
'PDL',
'PTM',
'SCG',
'SCP',
'SDF',
'SGP',
'SNZ',
'URW',
'VCX',
'VVR',
'WAM',

'GPT',
'IFL',
'PPT',
'BKW',
'RMS',
'TNE',
'RRL',
'XRO',
'TBR',
'FPH',
'RMD',
'TLS',
'WPL',
'SKI',
'NUF',
'CTD',
'JBH',
'LYC',
'OSH',
'FMG',

'CGC',
'ALX',
'AVN',
'AWC',
'CLW',
'CSR',
'HTA',
'IPH',
'JHG',
'NEC',
'PLS'
*/]
var identifiers = { 'balance-sheet': { st: 'ST Debt & Current Portion LT Debt', lt: 'Long-Term Debt' },
                    'cash-flow': { fcf: 'Free Cash Flow' } }

app.use(function (request, response, next) {
  var promises = []
  for (let symbol of symbols) {
    // only fetch if not already in data (resets when project is edited/reloaded)
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
              // extract data from page
              for (let id in identifiers[page]) {
                var number = $('td:contains("'+identifiers[page][id]+'")').first().parent().children().eq(1).text()
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
      if (!('dfcf' in data[symbol])) {
        if ('st' in data[symbol] && 'lt' in data[symbol] && 'fcf' in data[symbol]) {
          data[symbol]['dfcf'] = ((data[symbol]['st']+data[symbol]['lt'])/data[symbol]['fcf']).toFixed(2)
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

app.get('/json', function (request, response) {
  response.json(data);
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})