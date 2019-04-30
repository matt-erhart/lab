

- named axises
- multli canvas
- L shaped pdf view with synced scroll
- focus green box portal -> settimout hack
- pdf rerenders on scroll
- new min vbs should take the size of same pdfdir
- put min vbs just ow enough to see the link
- highlight links -> rel to neighbors
- add a 'fit to text' button
- create new text node under current like 'a'
- show/ hide links on mouse over / keycmd
- edit links
- keep links offscreen-ish
- scale vb in graph container

- move together
  - neighbors
- style
- refactor link types
- move together
- select one, select others
- on create live slice
- listen to dispatch
- middleware
- on click link

* refactor creators/makeLink
* state.json converter
* mouse out but be able to type
  - add version numbers to datatypes
* right click menu w/ copy/paste

* code quality
  - dnd should use movementXY
  - slate editor
    - renderSlateNodes/marks reduce, move to new file
    - don't need data-graph-\* in graph node
    - rename graph node
  - colors
    - collect colors into store
  - rename
    - viewbox -> liveslice
  - to utils
    - doceditor/calcPosition
    - onzoom / onfont size in graphcont, doceditor
  - data types
    - link types
      - put "<p>usedIn</p>" in creators
    - node types
      - refactor with state.json converter
  - search for "" for magic strings
  - replace oc with get
  - typescript for rx->ontransforming in graphcontainer
  - pdfview minhw with flex chain
