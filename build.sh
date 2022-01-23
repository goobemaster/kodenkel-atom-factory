#!/bin/bash

#npm install
#npm i --save-dev @types/snapsvg
yarn build-all
yarn esbuild-browser:dev
