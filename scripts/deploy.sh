#!/usr/bin/env bash

LAST_COMMIT_MESSAGE="$(git log -1 --pretty=%s)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SHA="$(git rev-parse --short HEAD)"
DIRTY="$(git diff-index --quiet HEAD -- || echo "-dirty")"
MESSAGE="${BRANCH}/${SHA}${DIRTY}: ${LAST_COMMIT_MESSAGE}"

set -xe
wrangler deploy --message "$MESSAGE" --tag "$BRANCH"