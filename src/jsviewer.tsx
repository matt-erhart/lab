// todo copy react-pdf bit by bit

var CMAP_URL = '../node_modules/pdfjs-dist/cmaps/';
var CMAP_PACKED = true;

var DEFAULT_URL = require("./Wobbrock-2015.pdf");
var PAGE_TO_VIEW = 1;
var SCALE = 1.0;
import "pdfjs-dist/web/pdf_viewer.css"

import * as pdfjs from "pdfjs-dist";
import { PDFJSStatic } from "pdfjs-dist";
const pdfjsLib: PDFJSStatic = pdfjs as any;
const pdfjsViewer = require("pdfjs-dist/web/pdf_viewer")
var container = document.getElementById('root');
console.log(pdfjsViewer)
// Loading document.
var loadingTask = pdfjsLib.getDocument({
  url: DEFAULT_URL,
  cMapUrl: CMAP_URL,
  cMapPacked: CMAP_PACKED,
});
loadingTask.promise.then(function(pdfDocument) {
  // Document loaded, retrieving the page.
  return pdfDocument.getPage(PAGE_TO_VIEW).then(function (pdfPage) {
    // Creating the page view with default parameters.
    var pdfPageView = new pdfjsViewer.PDFPageView({
      container: container,
      id: PAGE_TO_VIEW,
      scale: SCALE,
      defaultViewport: pdfPage.getViewport({ scale: SCALE, }),
      // We can enable text/annotations layers, if needed
      textLayerFactory: new pdfjsViewer.DefaultTextLayerFactory({enhancedTextSelection: true}),
      annotationLayerFactory: new pdfjsViewer.DefaultAnnotationLayerFactory(),
    });
    // Associates the actual page with the view, and drawing it
    pdfPageView.setPdfPage(pdfPage);
    return pdfPageView.draw();
  });
});

