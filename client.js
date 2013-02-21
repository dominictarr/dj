
var Rumours    = require('rumours')
var hashchange = require('hash-change')
var o          = require('observable')
var u          = require('./utils')
var h          = require('hyperscript')
var jsonp      = require('jsonp')
var YouTubePlayer 
               = require('youtube-player')

var rumours = Rumours({
  db: 'dj'
})

var playlist, ctrl, doc

hashchange.on('change', onChange)
onChange()

function onChange() {

  var name = hashchange.hash() || '_'

  if(playlist) playlist.dispose()
  if(ctrl)     ctrl.dispose()

  PLAYLIST =
  playlist = rumours.open('r-array!playlist!'+name, function () {})
  ctrl     = rumours.open('model!ctrl!'+name   , function () {
    if('number' !== typeof ctrl.get('current'))
      ctrl.set('current', 0)
  })

  //TODO validate playlist. MUST NOT CONTAIN strings, etc.

  playlist.on('update', function () {
    var splices = []
    playlist.forEach(function (e, i) {
      if(!(e && e.thumbnail)) {
        console.log('splice', e, i)
        playlist.splice(i, 1)
      }
    })
    var l = playlist.length
    var c = ctrl.get('current')
    if('number' !== typeof c || l > c || c < 0)
      ctrl.set('current', 0)      
  })

  var state   = o.property(ctrl, 'state')
  var current = o.property(ctrl, 'current')
  var show    = o()
  var part = PART = o(); part(true)
  var _part = o.not(part)
  var button  = o.boolean (state, '[stop]', '[play>')
  var button2  = o.boolean (state, '[]', '>>')
  
  show(true)

  var list = h('table#playlist')

  var list2 = h('table#searchlist')
  
  var plist = u.rArray(playlist)

  var player, input, search, list2

  var item
  document.body.innerHTML = ''

  var plEl, sEl

  document.body.appendChild(
    h('div#content',
      plEl = h('div#playlist', 
        h('h1',
          h('a', {
            onclick: function (e) {
              var c = current() || 0
              current(c <= 0 ? playlist.length - 1 : --c)
              e.preventDefault()
            }},
            '<<'
          ), ' ',
          h('a', {
            onclick: function (e) {
              state(!state())
              if(!current) current(0)
              e.preventDefault()
            }},
            button
          ), ' ',
          h('a', {
            onclick: function (e) {
              var c = current() || 0
              current(c >= playlist.length ? 0 : ++c)
              e.preventDefault()
            }},
            '>>'
          ), ' ',
          o.compute([current, plist], function (c, list) {
            var t = list[c]
            return t ? t.title : ''
          })
        ),
        u.list(plist, function (e, i) {
          return h('tr', 
            {className:
              o.compute([current, button], function (s) {
                return s == i ? 
                  'track_playing' : 'track_notplaying'
              })
            },

            h('td.thumb', 
              h('img', {src: e.thumbnail.sqDefault})
            ),

            h('td.trackname', e.title),
            h('td.del',
              h('a', {
                href: '#',
                onclick: function (e) {
                  playlist.splice(i, 1)
                  e.preventDefault()
                }}, 'X'
              )
            )
          )
        }, list)
      ),
      h('div#search',
        input = h('input', {onkeydown: function (e) {
          if(e.keyCode == 13 && this.value) {            
            playlist.push(search()[item()])
            this.select()
          } else {
            if(e.keyCode == 38) {
              if(!item()) part(false)
              else        item(item() - 1)
              e.preventDefault()
            }
            if(e.keyCode == 40) {
              item(item() + 1)
              e.preventDefault()
            }
          }
        }}),
        sEl = h('div#search', list2)
      ),
      h('div#player',
        h('a', {onclick: function (e) {
          show(!show());
        }}, o.boolean(show, 'hide', 'show')),
        h('div', {className: 
            o.boolean(show, 'showplayer', 'hideplayer') 
          },
          h('div#yt_player')
        )
      )
    )
  )
  

  o.hover(plEl)(part)

  search = 
  u.query(u.debounce(o.input(input)), function (v, cb) {
    jsonp(
      'http://gdata.youtube.com/feeds/api/videos?q='
      + v
      + '&format=5&max-results=20&v=2&alt=jsonc',
      function (err, data) {
        cb(err, data && data.data.items)
      })
  }, [])

  item = u.index(search)

  u.list(search, function (e, i) {
    return h('tr', {className:
      o.compute([item], function (j) {
        return j == i ? 'current': 'notcurrent'
      }),
      onclick: function () {
          playlist.push(e)
      }}, 
      h('td', h('img', {src: e.thumbnail.sqDefault})),
      h('td', e.title))
  }, list2)

  player = PLAYER = new YouTubePlayer({id: 'yt_player'})

  var cur = 
  o.compute([state, show, current, plist], function (play, show, i, list) {
    return play && show ? list[i || 0].id : null
  })

  var ended = false
  var prev
  cur(function (id) {
    if(ended) {
      ended = false
      return current(current() + 1)
    }
    id ? 
      prev !== id && player.play(prev = id)
    : player.pause(), prev = null
  })

  player.on('end', function () {
    //if the last track has ended, move to the next one.
    if(current() + 1 == plist().length)
      return current(0)
    current(current() + 1)
  })

}

