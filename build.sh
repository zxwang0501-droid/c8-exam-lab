#!/bin/sh
# Concatenate sources into one self-contained page.
cd "$(dirname "$0")"
{ cat src/head.html; echo '<script>'; for f in kb bank-a bank-b1 bank-b2 bank-b3 bank-c bank-d bank-e cases-1 cases-2 cases-3 gen app-core app-ui app-init; do cat "src/$f.js"; echo; done; echo '</script>'; } > index.html
