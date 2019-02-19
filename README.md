# npm graphs 
https://github.com/levelgraph/levelgraph 1200 # easy save to disk 3x slower than graphology for neighbors
https://github.com/graphology/graphology#readme 200 # 3x faster than levelgraph for neighbors
http://js.cytoscape.org/

https://github.com/cape-io/redux-graph
https://www.npmjs.com/package/hexadb 5 stars

# graph layouts
import ForceGraph2D from 'react-force-graph-2d';

https://ialab.it.monash.edu/webcola/index.html
http://sigmajs.org/ dedicated to graph drawing.

# electron perf notes
https://www.infoq.com/presentations/electron-pitfalls

# state management
https://github.com/CharlesStover/reactn
https://github.com/diegohaz/constate

# expert mode
https://github.com/ccampbell/mousetrap

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


# td
scale

# semantic layout
better columns & lines
reading order

# manual 
drag corners/edges
drag columns

# improve text overlay
see snippet bellow

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

ngrok http 3000 -host-header="localhost:3000"


# another way to render text: https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
```js
page.getTextContent({ normalizeWhitespace: true }).then(function (textContent) {
        textContent.items.forEach(function (textItem) {
          var tx = PDFJS.Util.transform(
            PDFJS.Util.transform(viewport.transform, textItem.transform),
            [1, 0, 0, -1, 0, 0]
          );
          var style = textContent.styles[textItem.fontName];
          
          // adjust for font ascent/descent
          var fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
          if (style.ascent) {
            tx[5] -= fontSize * style.ascent;
          } else if (style.descent) {
            tx[5] -= fontSize * (1 + style.descent);
          } else {
            tx[5] -= fontSize / 2;
          }
          
          // adjust for rendered width
          if (textItem.width > 0) {
            ctx.font = tx[0] + 'px ' + style.fontFamily;
            
            var width = ctx.measureText(textItem.str).width;
            if (width > 0) {
              //tx[0] *= (textItem.width * viewport.scale) / width;
              tx[0] = (textItem.width * viewport.scale) / width;
            }
          }
          // var item = document.createElementNS('http://www.w3.org/2000/svg', 'svg:text');
          // item.textContent = textItem.str;
          // item.setAttribute('font-family', style.fontFamily);
          // item.setAttribute('transform', 'matrix(' + tx.join(' ') + ')');
          var item = document.createElement('span');
          item.textContent = textItem.str;
          item.style.fontFamily = style.fontFamily;
          //item.style.transform = 'matrix(' + tx.join(',') + ')';
          item.style.fontSize = fontSize + 'px';
          item.style.transform = 'scaleX(' + tx[0] + ')';
          item.style.left = tx[4] + 'px';
          item.style.top = tx[5] + 'px';
          pageContainer.appendChild(item);
        });
      });
      ```

# DIY graph db
http://nodejsconfit.levelgraph.io/#17