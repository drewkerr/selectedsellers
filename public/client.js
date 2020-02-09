$(function(){

  var socket = io()
  
  $('form').submit(function(event) {
    event.preventDefault()
    var term = $('input').val()
    $('#results').html('<div>Searching...</div>')
    socket.emit('search', term, function(data) {
      if (data.resultCount == 0) {
        $('#results').html('<div>No results.</div>')
      } else {
        $('#results').html('')
        $.each(data.results, function(i, song) {
          $('#results').append('<div data-track="'+song.trackId+
                               '"><img src="'+song.artworkUrl100+
                               '">'+song.trackName+'<br><em>'+song.artistName+'</em></div>')
        })
        $('#results div').click(function() {
          var trackId = $(this).data('track')
          socket.emit('add', trackId)
          $('#results').html('')
          $('input').val('')
        })
      }
    })
  })
  
})