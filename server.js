var express = require('express')
var app = express()
app.use(express.static('public'))
app.set('view engine', 'pug')
app.locals.pretty = true;
app.set('json spaces', 2);

var fetch = require('request')
var today = new Date().toISOString().slice(0,10)
var data

app.use(function (request, response, next) {
  if (! data) {
    fetch.get({
      url: 'https://quotes.wsj.com/AU/XASX/BKW/financials/annual/balance-sheet',
    }, (err, res, body) => {
      if (err) {
        console.log('Error:', err)
      } else if (res.statusCode !== 200) {
        console.log('Status:', res.statusCode)
      } else {
        console.log('Data loaded for ' + today)
        data = body
        next()
      }
    })
  } else {
    next()
  }
})

app.get('/', function (request, response) {
  response.render('index', { date: today, data: data})
})

app.get('/json', function (request, response) {
  response.json(data);
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})