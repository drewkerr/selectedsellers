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
  'CHC','TWD','SUL','IVC','SHL','BKW'
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