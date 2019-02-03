# some pdfs will fail because pdfjs thinks its node
      nodeIntegration: false
      preload... everything?

# electron perf notes
https://www.infoq.com/presentations/electron-pitfalls
- main

# scale
page coords image
fig bboxes, name, captions
map from textItems to lines and block and back


# qol
scale

# auto
paragraphs
section titles
gaps/boxes from whitespace
figures 
tables
ordered lists
super script
sub script
references
math

# manual 
drag corners/edges
drag columns
view histograms

# nav
keyboard by line
auto grab paragraphs + sections

# search by section


# improve text overlay
see snippet bellow



# formalism
x expands to [y,z] (for tooltips)
a same as A (synonyms)
x predicts y (possible causes)

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