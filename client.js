
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
  ctrl     = rumours.open('model!ctrl!'+name   , function () {})

  var state   = o.property(ctrl, 'state')
  var current = o.property(ctrl, 'current')
  var show    = o()
  var part = PART = o(); part(true)
  var _part = o.not(part)
  var button  = o.boolean (state, '[stop]', '[play>')
  var button2  = o.boolean (state, '[]', '>>')
  
  var list = h('table#playlist', {style: {
    'font-size': '2em',
    border: o.boolean(_part, 'dashed 1px', 'solid 1px')
  }})

  var list2 = h('table', {style: {
    border: o.boolean(part, 'dashed 1px', 'solid 1px')
  }})
  
  var plist = u.rArray(playlist)

  var player, input, search, list2

  var item
  document.body.innerHTML = ''

  var plEl, sEl

  document.body.appendChild(
    h('div#content', h('code', {style: {'font-family': 'monospace'}},
      plEl = h('div#playlist', 
        h('h1',
          h('a', {
            href: '#', 
            onclick: function (e) {
              var c = current() || 0
              current(c <= 0 ? playlist.toJSON().length - 1 : --c)
              e.preventDefault()
            }},
            '<<'
          ), ' ',
          h('a', {
            href: '#',
            onclick: function (e) {
              state(!state())
              if(!current) current(0)
              e.preventDefault()
            }},
            button
          ), ' ',
          h('a', {
            href: '#', 
            onclick: function (e) {
              var c = current() || 0
              current(c >= playlist.toJSON().length ? 0 : ++c)
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

          return h('tr.track', 
            {style: {
              display: 'table-row',
              border: o.compute([current, button], function (s) {
                return s == i ? '1px solid red' : ''
                return s == i ? 
                  '1px solid ' + (button2() ? 'green'  : 'blue')
                : ''
              })
            }},

            h('td.thumb', 
              h('img', {src: e.thumbnail.sqDefault})
            ),

            h('td.trackname', {style: {
                'min-width': '250px', display: 'inline-block'
              }}, 
              e.title
            ),
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
          h('a', {href: '#', onclick: function (e) {
            show(!show()); e.preventDefault()
          }}, o.boolean(show, 'hide', 'show')),
          h('div', {style: { display: o.boolean(show, 'block', 'none') }},
            h('div#yt_player')
          )
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
    return h('tr', {style: {
        'background' : o.compute([item], function (j) {
          return j == i ? '#5ee' : '#eee'
        })
      }}, 
      h('td', h('img', {src: e.thumbnail.sqDefault})),
      h('td', e.title))
  }, list2)

  player = PLAYER = new YouTubePlayer({id: 'yt_player'})

  var cur = 
  o.compute([state, show, current, plist], function (play, show, i, list) {
    return play && show ? list[i].id : null
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

