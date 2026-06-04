#!/bin/bash
set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

sudo chown -R $(whoami) ~ # TODO - remove this

figlet common
cd "$script_dir/../common"
npm install
npm run build
npm run test

figlet GH Action
cd "$script_dir/../github-action"
npm install
npm run all

figlet GH Merge Action
cd "$script_dir/../merge"
npm install
npm run all

if [[ -z $IS_CI ]]; then
    echo "IS_CI not set, skipping git status check"
    exit 0
fi

figlet git status
cd "$script_dir/.."
# The GH action to generate the build number leaves a BUILD_NUMBER file behind
if [[ -f BUILD_NUMBER ]]; then
    rm BUILD_NUMBER
fi
if [[ -n $(git status --short) ]]; then
    echo "*** There are unexpected changes in the working directory (see git status output below)"
    echo "*** Ensure you have run scripts/build-local.sh"
    git status
    exit 1
fi
