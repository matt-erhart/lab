- select on mouse down
    - remove hack at 845
    - find it mouseselect
      















- lock links btw selection

    - move together
        - neighbors
        - selected
        - grouped 
    
    - render link thing
    - style
    - refactor link types
    - move together
    - select one, select others
    - on create live slice
    - listen to dispatch
    - middleware
    - on click link
    - move neighbors, 





- refactor creators/makeLink
- state.json converter
- mouse out but be able to type
    - add version numbers to datatypes
- right click menu w/ copy/paste

- code quality
    - dnd should use movementXY
    - slate editor
        - renderSlateNodes/marks reduce, move to new file
        - don't need data-graph-* in graph node
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