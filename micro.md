- min/max frame
    - style: {max: {}, min: {}, modes: [min, max], modeIx: 0}
        - get style func
        - toggle through modes
        - button to toggle
            - where should the button go?
    - 1134 add style modes 2pm  
        - if min and move and then max
            - max/min width/height
            - min and move
                - update its left/top
                - update other left/top on toggle mode
        - filter to viewboxes 
        - change make viewboxes
        - on save to redux box
        - switch modes
            - where does it matter
                - redux
        - onclick dragbar
        - onClick bar button
        - call props.togg
        - modeix not changing , just not in dev tool
        - why not changing size, bubbling
        - why not rendering on switch

follow types        
            
        













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