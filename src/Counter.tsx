// import * as React from "react";
// import * as pdfjs from "pdfjs-dist";
// import { PDFJSStatic } from "pdfjs-dist";
// const pdfjsLib: PDFJSStatic = pdfjs as any;
// import { Document, Page } from 'react-pdf';

// const pdfPath = require("./Wobbrock-2015.pdf");

// export default class Pdf extends React.Component {
//   state = {
//     numPages: null,
//     pageNumber: 1,
//   }

//   onDocumentLoadSuccess = ({ numPages }) => {
//     this.setState({ numPages });
//   }

//   render() {
//     const { pageNumber, numPages } = this.state;

//     return (
//       <div>
//         <Document
//           file={pdfPath}
//           onLoadSuccess={this.onDocumentLoadSuccess}
//         >
//           <Page pageNumber={pageNumber} />
//         </Document>
//         <p>Page {pageNumber} of {numPages}</p>
//       </div>
//     );
//   }
// }



// // var PAGE_NUMBER = 1;
// // var PAGE_SCALE = 1.5;
// // var SVG_NS = "http://www.w3.org/2000/svg";

// // export default class Pdf extends React.PureComponent<{}, {}> {
// //   canvasRef;
// //   state = {height: 500, width: 500}
// //   constructor(props) {
// //     super(props);
// //     this.canvasRef = React.createRef();
// //   }


// //   componentDidMount() {
// //     // Loading a document.
// //     // loadingTask.then(function(pdfDocument) {
// //     //   pdfDocument.getPage(PAGE_NUMBER).then(function (page) {
// //     //     // var viewport = page.getViewport({ scale: PAGE_SCALE, });
// //     //     page.getTextContent().then(function (textContent) {
// //     //       // building SVG and adding that to the DOM
// //     //    console.log(textContent)
// //     //     });
// //     //   });
// //     // });
// //     var canvas = this.canvasRef.current as HTMLCanvasElement;
    
// //     var loadingTask = pdfjsLib.getDocument(pdfPath);
// //     loadingTask.then(
// //       (pdf) => {
// //         // Fetch the first page
// //         var pageNumber = 1;
// //         pdf.getPage(pageNumber).then((page) => {
// //           console.log("Page loaded");
          
// //           var scale = 1.5;
// //           var viewport = page.getViewport({ scale }); //@ts-ignore

// //           // Prepare canvas using PDF page dimensions
// //           canvas.height = 1000; //viewport.height;
// //           canvas.width = 1000; //viewport.width;

// //           var context = canvas.getContext("2d");
// //           // Render PDF page into canvas context
// //           var renderContext = {
// //             canvasContext: context,
// //             viewport: viewport
// //           };
// //           var renderTask = page.render(renderContext);
// //           renderTask.then(() => {
// //             console.log("Page rendered", viewport);

// //           });
// //         });
// //       },
// //       function(reason) {
// //         // PDF loading error
// //         console.error(reason);
// //       }
// //     );
// //   }

// //   render() {
// //     return (
// //       <div>
// //         <canvas ref={this.canvasRef} />
// //       </div>
// //     );
// //   }
// // }

// // function getHightlightCoords() {
// //   var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1;
// //   var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
// //   var pageRect = page.canvas.getClientRects()[0];
// //   var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
// //   var viewport = page.viewport;
// //   var selected = selectionRects.map(function (r) {
// //     return viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
// //        viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y));
// //   });
// //   return {page: pageIndex, coords: selected};
// //   }

// //   function showHighlight(selected) {
// //   var pageIndex = selected.page;
// //   var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
// //   var pageElement = page.canvas.parentElement;
// //   var viewport = page.viewport;
// //   selected.coords.forEach(function (rect) {
// //     var bounds = viewport.convertToViewportRectangle(rect);
// //     var el = document.createElement('div');
// //     el.setAttribute('style', 'position: absolute; background-color: pink;' +
// //       'left:' + Math.min(bounds[0], bounds[2]) + 'px; top:' + Math.min(bounds[1], bounds[3]) + 'px;' +
// //       'width:' + Math.abs(bounds[0] - bounds[2]) + 'px; height:' + Math.abs(bounds[1] - bounds[3]) + 'px;');
// //     pageElement.appendChild(el);
// //   });
// //   }

// // Skip to content
 
// // Search or jump to…

// // Pull requests
// // Issues
// // Marketplace
// // Explore
// //  @matt-erhart Sign out
// // 34
// // 1,532 160 wojtekmaj/react-pdf
// //  Code  Issues 22  Pull requests 1  Projects 0  Wiki  Insights
// // react-pdf/src/Page/PageCanvas.jsx
// // 32343ce  on Jul 18, 2018
// // @wojtekmaj wojtekmaj Add isCancelException method to re-use
     
// // 152 lines (119 sloc)  3.29 KB
// // import React, { PureComponent } from 'react';
// // import PropTypes from 'prop-types';

// // import PageContext from '../PageContext';


// // export const makePageCallback = (page, scale) => {
// //   Object.defineProperty(page, 'width', { get() { return this.view[2] * scale; }, configurable: true });
// //   Object.defineProperty(page, 'height', { get() { return this.view[3] * scale; }, configurable: true });
// //   Object.defineProperty(page, 'originalWidth', { get() { return this.view[2]; }, configurable: true });
// //   Object.defineProperty(page, 'originalHeight', { get() { return this.view[3]; }, configurable: true });
// //   return page;
// // };

// // export class PageCanvasInternal extends PureComponent {
// //   renderer

// //   componentDidMount() {
// //     this.drawPageOnCanvas();
// //   }

// //   componentDidUpdate(prevProps) {

// //   }

// //   componentWillUnmount() {
// //     this.cancelRenderingTask();
// //   }

// //   onRenderSuccess = () => {
// //     this.renderer = null;

// //     const { onRenderSuccess, page, scale } = this.props;

// //     callIfDefined(
// //       onRenderSuccess,
// //       makePageCallback(page, scale),
// //     );
// //   }

// //   /**
// //    * Called when a page fails to render.
// //    */
// //   onRenderError = (error) => {
// //     if (isCancelException(error)) {
// //       return;
// //     }

// //     errorOnDev(error);

// //     const { onRenderError } = this.props;

// //     callIfDefined(
// //       onRenderError,
// //       error,
// //     );
// //   }

// //   get renderViewport() {
// //     const { page, rotate, scale } = this.props;

// //     const pixelRatio = getPixelRatio();

// //     return page.getViewport(scale * pixelRatio, rotate);
// //   }

// //   get viewport() {
// //     const { page, rotate, scale } = this.props;

// //     return page.getViewport(scale, rotate);
// //   }

// //   drawPageOnCanvas = () => {
// //     const { canvasLayer: canvas } = this;

// //     if (!canvas) {
// //       return null;
// //     }

// //     const { renderViewport, viewport } = this;
// //     const { page, renderInteractiveForms } = this.props;

// //     canvas.width = renderViewport.width;
// //     canvas.height = renderViewport.height;

// //     canvas.style.width = `${Math.floor(viewport.width)}px`;
// //     canvas.style.height = `${Math.floor(viewport.height)}px`;

// //     const renderContext = {
// //       get canvasContext() {
// //         return canvas.getContext('2d');
// //       },
// //       viewport: renderViewport,
// //       renderInteractiveForms,
// //     };

// //     this.renderer = page.render(renderContext);

// //     return this.renderer
// //       .then(this.onRenderSuccess)
// //       .catch(this.onRenderError);
// //   }

// //   render() {
// //     return (
// //       <canvas
// //         className="react-pdf__Page__canvas"
// //         style={{
// //           display: 'block',
// //           userSelect: 'none',
// //         }}
// //         ref={(ref) => { this.canvasLayer = ref; }}
// //       />
// //     );
// //   }
// // }

// // PageCanvasInternal.propTypes = {
// //   onRenderError: PropTypes.func,
// //   onRenderSuccess: PropTypes.func,
// //   page: isPage.isRequired,
// //   renderInteractiveForms: PropTypes.bool,
// //   rotate: isRotate,
// //   scale: PropTypes.number,
// // };

// // export default PageCanvasInternal;
