// import { AppContainer } from 'react-hot-loader';
// import * as React from 'react';
// import * as ReactDOM from 'react-dom';
// import App from './App';

// const rootEl = document.getElementById('root');
// const render = (Component: typeof App) =>
//   ReactDOM.render(
//     <AppContainer>
//       <Component />
//     </AppContainer>,
//     rootEl
//   );
// render(App);
// if ((module as any).hot) (module as any).hot.accept('./App', () => render(App));

/* 
   react svg dnd - resize rect + zoom
    snap to closest edge
   multi page
   keyboard shortcut annotations for columns 
   select doi for meta

  */
import * as pdfjs from "pdfjs-dist";
import { PDFJSStatic } from "pdfjs-dist";
const pdfjsLib: PDFJSStatic = pdfjs as any;
const pdfPath = require("./Wobbrock-2015.pdf");
import { TextLayerBuilder } from "pdfjs-dist/lib/web/text_layer_builder";
require("pdfjs-dist/web/pdf_viewer.css");

const SVG_NS = "http://www.w3.org/2000/svg";
function buildSVG(viewport, textContent) {
  // Building SVG with size of the viewport (for simplicity)
  var svg = document.createElementNS(SVG_NS, "svg:svg");
  svg.setAttribute("width", viewport.width + "px");
  svg.setAttribute("height", viewport.height + "px");
  // items are transformed to have 1px font size
  svg.setAttribute("font-size", 1);

  // processing all items
  textContent.items.forEach(function(textItem) {
    // we have to take in account viewport transform, which includes scale,
    // rotation and Y-axis flip, and not forgetting to flip text.
    var tx = pdfjsLib.Util.transform(
      pdfjsLib.Util.transform(viewport.transform, textItem.transform),
      [1, 0, 0, -1, 0, 0]
    );
    var style = textContent.styles[textItem.fontName];
    // adding text element
    var text = document.createElementNS(SVG_NS, "svg:text");
    text.setAttribute("transform", "matrix(" + tx.join(" ") + ")");
    text.setAttribute("font-family", style.fontFamily);
    text.textContent = textItem.str;
    svg.appendChild(text);
  });
  return svg;
}

const adjustTransMatForViewport = (viewportTransform, textItemTransform) => {
  // we have to take in account viewport transform, which includes scale,
  // rotation and Y-axis flip, and not forgetting to flip text.
  return pdfjsLib.Util.transform(
    pdfjsLib.Util.transform(viewportTransform, textItemTransform),
    [1, 0, 0, -1, 0, 0]
  );
};

const getTextFromRect = (viewport, textContent) => (
  topLeft = [67, 217],
  bottomRight = [169, 230]
) => {
  /**
  * dir: "ltr"
fontName: "Helvetica"
height: 81
str: "ACKNOWLEDGEMENTS"
transform: (6) [9, 0, 0, 9, 54, 693.6]
viewportAdjustedTrans: (6) [9, 0, 0, 9, 54, 98.39999999999998] <- bottom left
width: 103.90499999999999 / 9 for 


  */
};

var loadingTask = pdfjsLib.getDocument(pdfPath);
loadingTask.then(function(pdf) {
  // Get div#container and cache it for later use
  var container = document.getElementById("root");

  // Loop from 1 to total_number_of_pages in PDF document
  for (var i = pdf.numPages; i <= pdf.numPages; i++) {
    // Get desired page
    pdf.getPage(i).then(function(page) {
      var scale = 1;
      var viewport = page.getViewport(scale);
      var div = document.createElement("div");
      div.setAttribute("id", "page-" + (page.pageIndex + 1));
      div.setAttribute("style", "position: relative");
      var svg = document.createElementNS(SVG_NS, "svg:svg");
      svg.setAttribute("width", viewport.width + "px");
      svg.setAttribute("height", viewport.height + "px");
      svg.setAttribute("style", "position: absolute");

      div.appendChild(svg)
      container.appendChild(div);
      var rect = document.createElementNS(SVG_NS, 'rect');
      svg.appendChild(rect)

      var canvas = document.createElement("canvas");

      var context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      svg.addEventListener("click", e => {
        const canvasRect = canvas.getBoundingClientRect();
        const coords = {
          x: e.clientX - canvasRect.left,
          y: e.clientY - canvasRect.top
        };

        rect.setAttributeNS(null, 'x', coords.x);
        rect.setAttributeNS(null, 'y', coords.y);
        rect.setAttributeNS(null, 'height', '50');
        rect.setAttributeNS(null, 'width', '50');
        rect.setAttributeNS(null, 'fill', 'none');
        rect.setAttributeNS(null, 'stroke', 'black');
      });
      div.appendChild(canvas);

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Render PDF page
      page
        .render(renderContext)
        .then(function() {
          // Get text-fragments
          return page.getTextContent();
        })
        .then(function(textContent) {

          const adjustedTextContent = textContent.items.map(tc => {
            return {
              ...tc,
              viewportAdjustedTrans: adjustTransMatForViewport(
                viewport.transform,
                tc.transform
              )
            };
          });
          
          // some example mouse coordinates
          const TL = {x: 313, y: 148.3333282470703}
          const BR = {x: 557, y: 200.3333282470703}

          const text = adjustedTextContent.filter(tc => {
            const textX = tc.viewportAdjustedTrans[4]
            const textY = tc.viewportAdjustedTrans[5]
            const yInRange = textY > TL.y && textY < BR.y
            const xInRange = textX > TL.x && textX < BR.x
            return yInRange && xInRange
          })

          console.log(text.reduce((acc,val)=>{ return acc + val.str.replace(/\s+/g, ' ')}, ''))
          // Create new instance of TextLayerBuilder class
          var textLayer = new TextLayerBuilder({
            textLayerDiv: svg,
            pageIndex: page.pageIndex,
            viewport: viewport,
            enhanceTextSelection: 2,

          });

          // Set text-fragments
          textLayer.setTextContent(textContent);

          // Render text-fragments
          textLayer.render();
        });
    });
  }
});

// loadingTask.then(
//   (pdf) => {
//     // Fetch the first page
//     var pageNumber = 1;
//     pdf.getPage(pageNumber).then((page) => {
//       console.log("Page loaded");

//       var scale = 2;
//       var viewport = page.getViewport(scale);

//       var canvas = document.getElementById('theCanvas') as HTMLCanvasElement

//       // Prepare canvas using PDF page dimensions
//       canvas.height = viewport.height;
//       canvas.width = viewport.width;

//       var context = canvas.getContext("2d");
//       // Render PDF page into canvas context
//       var renderContext = {
//         canvasContext: context,
//         viewport: viewport
//       };
//       var renderTask = page.render(renderContext);
//       renderTask.then(() => {
//         console.log("Page rendered", viewport);

//       });
//     });
//   },
//   function(reason) {
//     // PDF loading error
//     console.error(reason);
//   }
// );
