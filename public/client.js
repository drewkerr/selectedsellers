$(function(){

  var socket = io()
  
  $('form').submit(function(event) {
    event.preventDefault()
    var term = $('input').val()
    $('#results').html('<div>Searching...</div>')
  })
  
  socket.on('progress', data => {
    $('#results').html('<div>Searching...</div>')
  })
  
})