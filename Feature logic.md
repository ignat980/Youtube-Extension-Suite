#Feature logic

###Length of playlist
On pages with a playlist, add the detail of how long it would take to watch

Before requests have finished,
  make a loader
  add loader to webpage.

Send a request to see how many items there are in the playlist.
Since you can only send requests for 50 items at a time,
  send all (total items / 50) requests for video ids to /playlistItems,
  when a request is finished,
    send a request with those video ids to /videos to get video duration information,
    when that request is finished,
      render progress in the playlist details section (extra 50 videos have been processed)
      add the string durations into a moment.js duration object that keeps track of all previous durations processed
  when all the requests are finished,
    remove loader
    format the moment.js object into something readable based on the webpage
    render the duration string into the playlist details section
