- id rxjs get 12
    - 1147 open rx.ts
    - 1157 newselect undefined or infinit
    - 1200 click again
    - 1206 if greenbox open and delete node
        - ondelete redux, close all portals
            - needs to be effect
            - could be useful for next tasks?
        - 1212 list to patches?
- 1219 learn middleware
    - 1226 (max 1245)



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