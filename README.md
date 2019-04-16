Electron-ActiveScienceReader
=========

Electron-ActiveScienceReader — is [definition here]

Table of contents
=================

<!--ts-->
   * [Electron-ActiveScienceReader](#Electron-ActiveScienceReader)
   * [Table of contents](#table-of-contents)
   * [Dictionary](#dictionary)
   * [Installation](#installation)
      * [Using Yarn](#using-yarn)
   * [Dev-Reference](#dev-reference)
<!--te-->

Dictionary
============

* **Auto-grab**: the feature that automatically grabs detailed information from the text content of the pdf. 

Installation
============

Using Yarn 
------------

`git clone [HTTP-project-url]`
`yarn` then `yarn dev`

Dev-Reference
============

just hide some stuff in graph container unless click
giant editor

text editor id can be undefined
auto-complete doesn't always work
graph viewbox  container resize
view states


cancel selection mid way

So if in graph view, just focus the text 
if you autocomplete and then go in front of it and delete text there.
then a text node dispears
right click does stuff it shouldn't

- Pdf Text
  - highlight
  - autocomplete comments

- Links
  - make two links
  - delete a link and a viewbox at the same time
  - edit link text
  - render link text at center
  - some links nodes should be immutable

- Nodes
  - move many

- Viewbox
  - delete segment in pdf viewer

- Zoom
  - html-to-image
  
- Slate
  - 'a' things
  - outline + link creation

- Perf
  - react spring + transform + opacity
  - prevent pdf renders
  - add in a pdf with 37 pages and it's more like 200ms per dispatch, so
    need to prevent rerender of other svg pages

- Refactor
  - use attributes like id/ data- to prevent overlay events



# Design 
- Predictive Interactions
  - easily dismissible, correctness, alternate possibilities, refinements
  - Read Eric Horvitz Principles of Mixed-Initiative User Interfaces

# CMD
ngrok http 3000 -host-header="localhost:3000"



# tours
https://reactour.js.org

# npm graphs 
https://github.com/levelgraph/levelgraph 1200 # easy save to disk 3x slower than graphology for neighbors
https://github.com/graphology/graphology#readme 200 # 3x faster than levelgraph for neighbors
http://js.cytoscape.org/

# graph layouts
https://ialab.it.monash.edu/webcola/index.html
http://sigmajs.org/ dedicated to graph drawing.
https://github.com/d3/d3-force

# electron perf notes
https://www.infoq.com/presentations/electron-pitfalls

# state management
https://github.com/CharlesStover/reactn
https://github.com/diegohaz/constate

# async validation
https://indicative.adonisjs.com/docs/syntax-guide

# hooks
https://github.com/neo/react-use-scroll-position
https://github.com/LeetCode-OpenSource/rxjs-hooks#apis

# node perf testing
https://github.com/bestiejs/platform.js#readme
https://benchmarkjs.com/

# async handling
https://github.com/staltz/callbag-basics # push and pull?
https://mostcore.readthedocs.io/en/latest/api.html # fastest
https://github.com/ReactiveX/rxjs


# formalism
level of detail/precision/specificity + attrs (esp. causality + utility)
broadcasting, static docs, cognitive tutors

# queries
what's the expected outcome of some scenario (what's y given x)
what scenario is optimal for creating some outcome (what predicts y)
what does the author mean by x (use expands to & same as )
how confident should I be in statement X

# fast static kdtree: not sorted by distance?
https://github.com/mourner/kdbush#readme


# DIY graph db
http://nodejsconfit.levelgraph.io/#17
