- min/max frame
    - style: {max: {}, min: {}, modes: [min, max], modeIx: 0}
        - get style func
        - toggle through modes
        - button to toggle
            - where should the button go?
                - 

  
    - on cmd, what happens
        - change content
        - resize frame to size of content
    - 1106 where is frame size stored? -> node.style
    - 1110 how to store multiple styles? 
            - onmove?
                - mousemove + max & min left/top














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
    - pdfview minhw with flex chain