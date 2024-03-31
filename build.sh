#!/bin/bash
# force export interfaces and types in dist/index.d.ts
file="$1"
shift

while [ "$#" -gt 0 ]
do
  sed -i "s/^$1/export $1/g" "$file" 2>/dev/null || sed -i '' "s/^$1/export $1/g" "$file"
  shift
done
# delete extra .d.ts files in dist/ sub directories
find dist/lib | grep .d.ts | xargs rm
find dist/node | grep .d.ts | xargs rm
find dist/web | grep .d.ts | xargs rm