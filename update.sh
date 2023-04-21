#!/bin/bash
fail() {

  echo "$1"
  exit 1
}

dir="tools/syntax/data"
[ ! -d "$dir" ] && mkdir -p "$dir"; cd "$dir" && rm -f *.json || fail "can't remove syntax definition files"
for file in $(echo -e "at-rules\nfunctions\nproperties\nselectors\nsyntaxes\ntypes\nunits")
do
  wget "https://raw.githubusercontent.com/mdn/data/main/css/${file}.json" || fail "failed to download https://raw.githubusercontent.com/mdn/data/main/css/${file}.json"
done
