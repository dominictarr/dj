#!/usr/bin/env bash

{
  echo '<!DOCTYPE HTML><html><head>'
  echo '<link rel=stylesheet href=./style.css >'
  echo '<script'\
  'src=http://rumoursdb.com/examples/css-colab/css-colab.js>'\
  '></script>'
  echo '<script>CssColab("DJ")</script>'
  echo '</head><body></body><script>'
  browserify client.js --debug --exports require || exit 1
  echo '</script></html>'
} > static/index.html

