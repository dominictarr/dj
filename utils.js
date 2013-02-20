
var o = require('observable')

exports.debounce = function (b, delay, max) {

  var v = o()
  v(b())

  var timer, start

  b(function () {
    clearTimeout(timer)
    console.log('DEBOUNCE +')

    timer = setTimeout(function () {
      console.log('DEBOUNCE -')
      v(b())
    }, delay || 333)

  })

  return v
}

exports.query = function (b, get, initial) {

  var v = o(), m = 0

  v(initial)

  b(function (val) {
    var n = m + 1

    get(val, function (err, data) {
      if(!err && m < n)
        m = n, v(data)
    })
  })
  return v
}

exports.rArray = function (ary) {
  var v = o()
  ary.on('update', function () {
    v(ary.toJSON())
  })
  v(ary.toJSON())
  return v
}

exports.log = function (ob, name) {
  ob(function (val) {
    console.log(name, val)
  })
  return ob
}

exports.list = function (ary, template, el) {
  el = el || document.createElement('ul')
  ary(function(a) {
    el.innerHTML = ''
    a.forEach(function (e, i) {
      el.appendChild(template(e, i))
    })
  })
  return el
}

exports.index = function (list) {
  var v = o(); v(0)
  return o.transform(v, function (n) {
    var l = list() ? list().length : 1
    console.log('N', n)
    return 0 > n ? 0 : n >= l ? l - 1 : n
  })
}

