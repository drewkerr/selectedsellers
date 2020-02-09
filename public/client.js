$(function(){

  var socket = io()
  
  $('form').submit(function(event) {
    event.preventDefault()
    var term = $('input').val()
    $('#results').text('Searching...')
    socket.emit('search', term)
  })
  
  socket.on('progress', data => {
    $('progress').attr('value', data)
  })
  
  socket.on('redirect', data => {
    window.location.href = data
  })
  
  socket.on('error', data => {
    $('#results').text(data)
  })
  
})