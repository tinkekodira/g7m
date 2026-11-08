#!/usr/bin/env bash
set -euo pipefail

# The release API redirects straight to asset storage, avoiding a failing
# github.com/releases/download gateway. Versions remain pinned by the caller.
repository=$1
tag=$2
asset=$3
destination=$4

auth=()
if [[ -n ${GH_TOKEN:-} ]]; then
  auth=(-H "Authorization: Bearer $GH_TOKEN")
fi

download() {
  curl -sSfL --retry 4 --retry-delay 3 --retry-max-time 120 \
    --connect-timeout 20 --max-time 120 "${auth[@]}" "$@"
}

asset_url=$(download -H 'Accept: application/vnd.github+json' \
  "https://api.github.com/repos/$repository/releases/tags/$tag" \
  | jq -er --arg name "$asset" '.assets[] | select(.name == $name) | .url')

mkdir -p "$(dirname "$destination")"
download -H 'Accept: application/octet-stream' "$asset_url" -o "$destination"
