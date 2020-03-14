$(function(){
  
  var hash = window.location.hash.substr(1)
  if (hash) {
    $('input[name="url"]').val(hash)
    $('input[name="item"]').focus()
  }

  var socket = io()
  
  $('form').submit(event => {
    event.preventDefault()
    $('#progress').text('')
    $('#error').text('')
    var url = $('input[name="url"]').val()
    var item = $('input[name="item"]').val()
    socket.emit('search', {url: url, item: item})
    window.location.hash = url
    $('form').remove()
  })
  
  socket.on('progress', data => {
    $('#progress').text(Math.round(data) + '%')
    $('progress').attr('value', data)
    if (data == 100) {
      $('progress').remove()
      $('#progress').html($('<a>').attr('href', 'javascript:window.location.reload(true)').text('Start over'))
    }
  })
  
  socket.on('link', data => {
    $('<a>').attr({
      href: data,
      target: '_blank'
    }).text('Search Link ' + ($('#links a').length + 1)).appendTo('#links')
  })
  
  socket.on('redirect', data => {
    window.location.href = data
  })
  
  socket.on('error', data => {
    $('<div>').text(data).appendTo('#error')
  })
  
})