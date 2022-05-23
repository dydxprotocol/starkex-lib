#!/bin/bash
set -euxo pipefail

VERSION=$(cat package.json | jq -r '.version')
NAME=$(cat package.json | jq -r '.name')

test -z "$(npm info $NAME@$VERSION)"
if [ $? -eq 0 ]
then
    set -e
    
    echo "Committing to GitHub"
	git config credential.helper 'cache --timeout=120'
	git config user.email "circleci@flash1.com"
	git config user.name "CircleCI Job"
	git add .
	git commit --allow-empty -m "[skip ci] Publish to NPM via CircleCI"

    # Get version and tag
    git tag v${VERSION}
    git push --tags

    yarn publish --access public
else
    echo "skipping publish, package $NAME@$VERSION already published"
fi
