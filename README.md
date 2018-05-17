# DotScap

DotScap is a proofing format for Twine 1 and 2 that generates a Scapple file of your story nodes.  

To add DotScap to Twine 2, use this URL (under Formats > Add a New Format): [https://mcdemarco.net/tools/scree/dotscap/format.js](https://mcdemarco.net/tools/scree/dotscap/format.js).

To add DotScap to Twine 1, create a new folder called `dotscap` inside your targets folder, then download this file [https://mcdemarco.net/tools/scree/dotscap/header.html](https://mcdemarco.net/tools/scree/dotscap/header.html) and place it inside the `dotscap` folder.  (See the Twine wiki for more information about installing and using story formats in Twine 1.)

The DotScap web page is [here](http://mcdemarco.net/tools/scree/dotscap/).  You can download a demo Scapple file [here](http://mcdemarco.net/tools/scree/test-dotscap.scap).


DotScap is named after [DotGraph](https://mcdemarco.net/tools/scree/dotgraph/), because it does something vaguely similar using a lot of the same code.

## What it does

DotScap converts the passage titles and links of your story to into a Scapple file.  (Scapple is a commercial mind mapping program for writers.)  DotScap will attempt to automatically save this file, giving it a name like `dotscap123456789.scap`; if all has gone well, you can open this file in Scapple.

## Troubleshooting

Your Scapple file should be laid out in exactly the same order as it is in the Twine UI.  If for some reason your story has never been in Twine (e.g., if you use TweeGo or entwine exclusively), DotScap may be unable to lay out your passages.

## Versions

### 1.0.1

Implement more lingering DotGraph functionality.

### 1.0.0

Initial version.

## Building From Source

Run `npm install` to install dependencies.  Run `grunt package` to create the release versions for Twine under `dist/`.  Run `grunt --help` to list other grunt targets.

