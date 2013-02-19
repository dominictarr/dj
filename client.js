
var Rumours    = require('rumours')
var hashchange = require('hash-change')
var o          = require('observable')
var h          = require('hyperscript')

var rumours = Rumours({
  db: 'dj',
  host: 'http://localhost:4567'
})

var playlist, ctrl, doc

hashchange.on('change', onChange)
onChange()

function onChange() {

  var name = hashchange.hash() || '_'

  if(playlist) playlist.dispose()
  if(ctrl)     ctrl.dispose()

  playlist = rumours.open('r-array!playlist!'+name, function () {})
  ctrl     = rumours.open('model!ctrl!'+name   , function () {})

  var state   = o.property(ctrl, 'state')
  var current = o.property(ctrl, 'current')
  var button  = o.boolean (state, '[stop]', '[play>')
  var button2  = o.boolean (state, '[]', '>>')

  var list = h('ul#playlist', {style: {'font-size': '2em'}})

  playlist.on('update', function () {
    //h(list, playlist.toJSON())
    list.innerHTML = ''
    playlist.toJSON().forEach(function (e, i) {
      list.appendChild(h('li.track', 
        o.compute([current, button], function (s) {
          return s == i ? button2()+' ' : '-- '
        }),
        h('span.trackname', e, {style: {
          'min-width': '250px', display: 'inline-block'
        }}),
        h('a', {
          href: '#', 
          onclick: function (e) {
            playlist.splice(i, 1)
            e.preventDefault()
          }},
          'xx'
        )
        
      ))
    })
  })

  document.body.innerHTML = ''

  document.body.appendChild(
    h('div#content', h('code', {style: {'font-family': 'monospace'}},
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
            console.log(current(), c >= playlist.toJSON().length ? 0 : ++c)
            current(c >= playlist.toJSON().length ? 0 : c ++)
            e.preventDefault()
          }},
          '>>'
        ), ' ',
        o.compute([current], function (c) {
          return playlist.toJSON()[c]
        })
      ),
      list, //the current playlist
      h('input', {onkeydown: function (e) {
        if(e.keyCode == 13 && this.value) {
          console.log('V', this.value)
          playlist.push(this.value)
          this.select()
        }
      }})
    ))
  )
}

