- works after dbl click canvas 11:45
    - 1133 



- works after click liveslice



- refactor creators/makeLink














- state.json converter
- updates in all editor instances with same id
- mouse out but be able to type
    - add version numbers to datatypes
    - good time to rename things
    - make a state.json converter
- right click menu w/ copy/paste
- code quality
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