
'a' things
[c]
link types
multiple canvases 


disable comment in box mode
pan

scrollTo in  canvas on props


--- defer
refactor onchange pdf if box/full
refactor/rename viewboxdiv
undo/redo
refactor graph container
check all string + objects created in render methods
fix compile time
pull out our redux stuff from
pdf dp zoom
scale to redux
refactor pagecanvas: 
restrict to original page
transition for box hover menu -> fade in on move
snippet for type onChange = React.ComponentProps<typeof AdjustableBox>["onChange"];
  const onChange = useCallback<onChange>(
left/right hover menu + animation transistion
chain links in simple interface
maigc strings
load pdf pages in sequence
improve webpack compile times
uninstall unused packages
link types
scale in redux node
useSelector typescript
drag pan pdf




- ctrl-f
  - search all
    - giant string with id+offsets
    - load all text for pdf



  - pagetext toggle with cursor
  - cc selected text































---------------------------
- save main pdf zoom level + scroll
- named axises
- multli canvas
- L shaped pdf view with synced scroll
- focus green box portal -> settimout hack
- new min vbs should take the size of same pdfdir
- put min vbs just ow enough to see the link
- highlight links -> rel to neighbors
- add a 'fit to text' button
- create new text node under current like 'a'
- show/ hide links on mouse over / keycmd
- edit links
- keep links offscreen-ish
- scale vb in graph container
const inside = require('point-in-polygon-hao')

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
