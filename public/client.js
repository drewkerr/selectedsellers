$(function(){
  
  $('input').val(window.location.hash.substr(1))

  var socket = io()
  
  $('form').submit(event => {
    event.preventDefault()
    $('#progress').text('')
    $('#error').text('')
    var term = $('input').val()
    socket.emit('search', term)
    window.location.hash = term
    $('form').remove()
  })
  
  socket.on('progress', data => {
    $('#progress').text(Math.round(data) + '%')
    $('progress').attr('value', data)
    if (data == 100) {
      $('progress').remove()
      $('#progress').html($('<a>').attr('href', 'javascript:window.location.reload(true)').text('Restart'))
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