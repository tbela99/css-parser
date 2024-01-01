#!/bin/bash
#
file="$1"
shift

while [ "$#" -gt 0 ]
do
  sed -i "s/^$1/export $1/g" "$file" 2>/dev/null || sed -i '' "s/^$1/export $1/g" "$file"
  shift
done