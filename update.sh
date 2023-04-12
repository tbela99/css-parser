#!/bin/bash
fail() {

  echo "$1"
  exit 1
}
cd src/validator/syntax && rm * || fail "can't remove syntax definition files"
for file in $(echo -e "at-rules\nfunctions\nproperties\nselectors\nsyntaxes\ntypes\nunits")
do
  wget "https://raw.githubusercontent.com/mdn/data/main/css/${file}.json" || fail "failed to download https://raw.githubusercontent.com/mdn/data/main/css/${file}.json"
done
