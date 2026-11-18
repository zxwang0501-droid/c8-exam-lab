#!/bin/sh
# Concatenate sources into two pages:
#   artifact.html - page body for the Claude artifact (the artifact host adds doctype, head and viewport)
#   index.html    - complete standalone document for GitHub Pages or opening locally
cd "$(dirname "$0")"
{ cat src/head.html; echo '<script>'; for f in kb i18n bank-a bank-b1 bank-b2 bank-b3 bank-c bank-d bank-e cases-1 cases-2 cases-3 cases-tables tr-a tr-b1 tr-b2 tr-b3 tr-c tr-d tr-e tr-cases1 tr-cases2 tr-cases3 tr-cases-tables tr-kb gen app-core ai app-ui app-init; do cat "src/$f.js"; echo; done; echo '</script>'; } > artifact.html
{ printf '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'; cat src/seo-head.html; printf '</head>\n<body>\n'; sed '/^<title>Data C8 Exam Lab<\/title>$/d' artifact.html; printf '</body>\n</html>\n'; } > index.html
