#!/usr/bin/env bash

{
  echo '<!DOCTYPE HTML><html><body></body><script>'
  browserify client.js --debug --exports require || exit 1
  echo '</script></html>'
} > static/index.html

