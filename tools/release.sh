#! /bin/bash
set -e

BASE_BRANCH="$(git -C "$(pwd)" rev-parse --abbrev-ref HEAD)"
ALPHA_FLAG=""
if [ -n "$1" ] && [ "$1" == "--alpha" ]; then
	ALPHA_FLAG="$1"
elif [ -z "$1" ]; then
	if [ "$BASE_BRANCH" != "develop" ]; then
		echo "Non-alpha should be ran on develop only"
		exit 1
	fi
else
	echo "Unsupported arg '$1'"
	exit 1
fi
if [ -n "$(git update-index --refresh && git diff-index --quiet HEAD --)" ]; then
    echo "Unstaged changes"
    exit 1
fi


VERSION="$(node tools/infer-next-version.mjs $ALPHA_FLAG)"
echo "Will publish version '${VERSION}'"
if ! read -p "Are you sure? (y/n)" yn; then
	exit 1
fi
case $yn in 
	[Yy])
		echo 'ok, we will proceed'
		;;
	[Nn])
		echo 'exiting...'
		exit
		;;
	*) echo invalid response;
		exit 1
		;;
esac
# Bump & reinstall
node tools/bump-versions.mjs "${VERSION}"
git add -- packages/*/package.json ./package.json
# Update readmes
pnpm run tools:sync-proto --no-stash
find . \( -name README.md -or -name package.json -or -name CHANGELOG.md \) -not -path '*/node_modules/*' -not -path './typedoc/*' -not -path '*/__tests__/*' -exec git add {} \;
# Run build & tests
pnpm run build:clean
pnpm run build
pnpm run lint
pnpm run ci:test
# Commit
git commit -m "chore: bump to version ${VERSION}" --no-verify
git tag "v${VERSION}"
# Publish docs
pnpm run docs
PWD_SV="${PWD}"
TEMP_DIR="$(mktemp -d)"
echo "Using docs temp dir ${TEMP_DIR}"
REMOTE_URL="$(git config --get remote.origin.url)"
cd "${TEMP_DIR}"
git clone --depth 1 --branch docs "${REMOTE_URL}" .
if [ -z "$ALPHA_FLAG" ]; then
	rsync -va --delete --exclude ".git" "${PWD_SV}/docs/" ./
else
	rsync -va --delete --exclude ".git" "${PWD_SV}/docs/" ./"v${VERSION}"
fi
git add .
git commit -m "docs: publish docs for v${VERSION}

[ci skip]"
cd "${PWD_SV}"
# Print publish script
# BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "All is OK so far. To finish publishing, enter the following command:"
if [ -z "$ALPHA_FLAG" ]; then
	echo "( cd ${TEMP_DIR} && git push ) && git checkout main && git merge --ff-only develop && git checkout develop && git push origin develop main --follow-tags && pnpm publish --access public --recursive"
else
	echo "( cd ${TEMP_DIR} && git push ) && git checkout $BASE_BRANCH && git push origin $BASE_BRANCH --follow-tags && pnpm publish --access public --recursive --tag next"
fi
