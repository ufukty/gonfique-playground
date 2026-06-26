#!/usr/bin/env bash

LAST_COMMIT_MESSAGE="$(git log -1 --pretty=%s)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BRANCH_SAFE="$(echo "$BRANCH" | tr -dc '[A-Za-z0-9]')"
SHA="$(git rev-parse --short HEAD)"
DIRTY="$(git diff-index --quiet HEAD -- || echo "-dirty")"
MESSAGE="${BRANCH}/${SHA}${DIRTY}: ${LAST_COMMIT_MESSAGE}"

set -xe
wrangler versions upload --message "$MESSAGE" --tag "$BRANCH" --preview-alias "$BRANCH_SAFE"