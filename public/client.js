$(function(){

  var socket = io()
  
  $('form').submit(function(event) {
    event.preventDefault()
    var term = $('input').val()
    $('#results').text('Searching...')
  })
  
  socket.on('progress', data => {
    $('#results').html('<progress value="80" min="0" max="100"></progress>')
  })
  
  socket.on('redirect', data => {
    window.location.href = data
  })
  
  socket.on('error', data => {
    $('#results').text(data)
  })
  
})