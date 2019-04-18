<!--ts-->

- [Roadmap](#Roadmap)
- [Dictionary](#dictionary)
- [Installation](#installation)
  - [Using Yarn](#using-yarn)
- [Dev-Reference](#dev-reference)
- [Slate-TroubleShooting](#Slate-TroubleShooting)
  <!--te-->

# Roadmap
- auto complete + put editor everywhere
- pack/dock + move neighbors

---
big editor + side bar


-------
- document editor
   - more reliable autocomplete without giant stuff in it
   - insert one doc in another
   - transpilation
   - paraphrasing something imported
   - create node from selected text
   - create nodes/links from outline heirarchy
   - insert viewbox into doc
   - change font size of any character
   - change font color
   - drag lines to create links between items in the editor

- queries -> search for anything, traverse the graph, large UI
   - query builder
      - a modal that take up entire window
      - autocomplete for search parameters
         - consider neo4j queries

- autocomplete -> limit to 40 chars ~plain text, small UI
   - text matching algorithm
   - could be ghost text instead of popup 

- multi-instance customizable layouts
   - takes a query as input
   - canvas
   - list view
      - drag order
      - drag increase height
      - show links in margin?
      - add/remove/edit any node
      - drag links between
   - grid view
      - drag increase col/row size
      - show links in gutters?

- pdf viewer
   - manually fix autograb
   - good ole' fashion text highlighting
   - text highlighting from auto-grab
   - delete segment in pdf viewer
   - autocomplete for phrases in selected area
   - perf
      - zoom
      - prevent rerender
      - virtualize
   
- graph viewer
   - select all left/right/up/down
   - move many with mouse / arrows
   - force directed
   - collision
   - alignment tools
   - html-to-image?
   - perf: react spring + transform + opacity

- Bug reports
   - text editor id can be undefined
   - auto-complete doesn't always work
   - graph viewbox container should resize -> see multi-instance customizable layouts


# Slate-TroubleShooting
** Can't focus multiple instances of slate editors, e.g. in a list: **
Cause: conflicting keys uses to find editor in the dom
Solution: 
editorUtils/initKeySafeSlate()


# Dictionary

- **Auto-grab**: the feature that automatically grabs detailed information from the text content of the pdf.

# Installation

## Using Yarn

`git clone [HTTP-project-url]`
`yarn` then `yarn dev`

# Dev-Reference


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
