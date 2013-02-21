#!/usr/bin/env bash

{
  echo '<!DOCTYPE HTML><html><body></body>'
  echo '<link rel=stylesheet href=./style>'
  echo '<script'\
  'src=http://rumoursdb.com/examples/css-colab/css-colab.js>'\
  '></script>'
  echo '<script>CssColab("DJ")</script>'
  echo '<script>'
  browserify client.js --debug --exports require || exit 1
  echo '</script></html>'
} > static/index.html

