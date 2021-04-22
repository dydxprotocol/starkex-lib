To build to single JS file

Modification: Added to tsconfig.json
    "moduleResolution": "node"

Tool
    npm install -g @vercel/ncc

Build
    ncc build ./src/index.ts -w -o dist

Destination
    ./dist/index.js