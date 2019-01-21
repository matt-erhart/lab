import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFJSStatic } from "pdfjs-dist";
const pdfjsLib: PDFJSStatic = pdfjs as any;
// const pdfPath = require("./Chunking-TICS.pdf");
// const pdfPath = require("./digitalVsPaper.pdf");
// const pdfPath = require("./Wobbrock-2015.pdf");
// const pdfPath = require("./checklist.pdf");
const pdfPath = require("./soylent-uist2010.pdf");
// const pdfPath = require("./poverty.pdf");
import PageCanvas from "./PageCanvas";
import PageText, { TextItem } from "./PageText";
import PageSvg from "./PageSvg";
import { flatten, midPoint, getRectCoords, dist, min,sortBy } from "./utils";
import {
  histogram,
  extent,
  mean,
  median,
  variance,
  deviation,
  rollup
} from "d3-array";
import { min } from 'rxjs/operators';

interface Page {
  pageNumber: number;
  viewport: pdfjs.PDFPageViewport;
  text: TextItem[];
  page: pdfjs.PDFPageProxy;
}

/**
 * @class **PdfViewer**
 * todo zoom, file name prop, layer props, keyboard shortcuts
 */
const PdfViewerDefaults = {
  props: { pageNumbersToLoad: [] as number[] },
  state: {
    scale: 1, // todo smooth zoom
    pages: [] as Page[],
    columnLefts: [] as number[]
  }
};

export default class PdfViewer extends React.Component<
  typeof PdfViewerDefaults.props,
  typeof PdfViewerDefaults.state
> {
  static defaultProps = PdfViewerDefaults.props;
  state = PdfViewerDefaults.state;

  loadPages = async (
    pdf: pdfjs.PDFDocumentProxy,
    pageNumbersToLoad: number[]
  ) => {
    const allPageNumbers = [...Array(pdf.numPages).keys()].map(x => x + 1);
    const willLoadAllPages = pageNumbersToLoad.length === 0;
    const pageNumPropsOk =
      !willLoadAllPages &&
      Math.min(...pageNumbersToLoad) >= 0 &&
      Math.max(...pageNumbersToLoad) <= Math.max(...allPageNumbers);

    let pageNumbers;
    if (willLoadAllPages) {
      pageNumbers = allPageNumbers;
    } else {
      pageNumbers = pageNumPropsOk ? pageNumbersToLoad : allPageNumbers;
    }

    for (const pageNumber of pageNumbers) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport(this.state.scale);
      const text = await page.getTextContent();
      const [xMin, yMin, xMax, yMax] = viewport.viewBox;
      
      const alignedTextContent = await Promise.all(
        text.items.map(async (tc, i) => {
          const fontData = await page.commonObjs.ensureObj(tc.fontName);
          const [_, __, offsetX, offsetY, x, y] = tc.transform;
          const top = yMax - (y + offsetY);
          const left = x - xMin;
          const fontHeight = tc.transform[0];
          const coords = getRectCoords(left, top, tc.width, fontHeight);
          const center = {
            left: midPoint(
              coords.lt[0],
              coords.lt[1],
              coords.lb[0],
              coords.lb[1]
            ),
            right: midPoint(
              coords.rt[0],
              coords.rt[1],
              coords.rb[0],
              coords.rb[1]
            )
          };

          return {
            ...tc,
            id: i,
            center,
            top,
            left,
            fallbackFontName: fontData.data
              ? fontData.data.fallbackName
              : "sans-serif",
            style: text.styles[tc.fontName]
          };
        })
      );

      this.setState(state => {
        return {
          pages: state.pages.concat({
            pageNumber,
            viewport,
            text: alignedTextContent,
            page
          })
        };
      });
    }
  };

  async componentDidMount() {
    const pdf = await pdfjsLib.getDocument({
      url: pdfPath,
      cMapUrl: "../node_modules/pdfjs-dist/cmaps/", // todo copy plugin
      cMapPacked: true
    });
    await this.loadPages(pdf, this.props.pageNumbersToLoad);

    // COLUMN LEFT EDGES
    const leftXs = flatten<TextItem>(this.state.pages.map(p => p.text)).map(
      t => t.left
    );
    const makeHistogram = histogram();
    const leftXHist = makeHistogram(leftXs);
    const leftXBinCounts = leftXHist.map(x => x.length);
    const leftXMean = mean(leftXBinCounts);
    const leftXStd = deviation(leftXBinCounts);
    const leftXZscore = leftXBinCounts.map(x => (x - leftXMean) / leftXStd);
    const zThresh = 1;
    const columnLefts = leftXBinCounts.reduce((all, val, ix) => {
      if (leftXZscore[ix] > zThresh) {
        // console.log(rollup(leftXHist[ix]))
        all.push(Math.round(median(leftXHist[ix])));
        return all;
      } else {
        return all;
      }
    }, []);
    this.setState({ columnLefts });

    // LINE LEFT EDGES
    // lines, min dist right edge to left edge. x1 < x2
    const flatText = flatten<TextItem>(this.state.pages.map(p => p.text));

      // for each y value in some column range
      // group elements by y top mid bottom
      // sort by x, and use it as start, last as end

    const nCols = columnLefts.length
    const textByColumn = columnLefts.map((left, i) => {
      const rightEdge = i < nCols-1 ? columnLefts[i+1]: Infinity
      return flatText.filter(t => left <= t.left && t.left < rightEdge)
    }) 
  console.log(textByColumn)
    const medianFontHeight = Math.round(median(flatText.map(t=>{return t.transform[0]})))
    
    
    for (var col of textByColumn){

      const uniqueTops = [...new Set(col.map(t=>Math.round(t.top)))].sort()
      let firstLine = col.find(x=>Math.round(x.top) === uniqueTops[0])
      let loopState = {count: 0, lines: [[firstLine]]}
      
      // combine tops within threshold
      const threshold = medianFontHeight/2
      for (let i = 1; i < uniqueTops.length; i++) {
        const prev  = uniqueTops[i-1]
        const current = uniqueTops[i]
        const textItems = col.filter(x=>Math.round(x.top) === current)
        if (Math.abs(prev-current) < threshold) {
          loopState.lines[loopState.count].push(...textItems)
        } else {
          loopState.lines[loopState.count].sort(sortBy('left'))
          loopState.count++
          loopState.lines.push([])
          loopState.lines[loopState.count].push(...textItems)
        }
      }
      
      

      
      // for (var text of col){
      //   const [x1, y1] = text.center.left

      // }
    }

    
    // for (var text of flatText){
    //   const [x1, y1] = text.center.right
      
    //   const maybeNextText = flatText.filter(t => {
    //     return x1 <= t.left // always to the right
    //   })
    //   let distances = []
    //   for (var innerText of maybeNextText) {
    //     const [x2,y2] = innerText.center.left
    //     distances.push(dist(x1, y1, x2, y2))
    //   }
    //   const minIx = min(distances).index
    
      
    // }
    
  }

  render() {
    const { pages } = this.state;
    const havePages = pages.length > 0;
    return (
      <>
        {havePages &&
          pages.map((page, pageNum) => {
            const { width, height } = page.viewport;
            return (
              <div style={{ position: "relative", width, height }}>
                <PageCanvas
                  key={"canvas-" + pageNum}
                  page={page.page}
                  viewport={page.viewport}
                />
                <PageText
                  key={"text-" + pageNum}
                  scale={this.state.scale}
                  text={page.text}
                  height={height}
                />
                <PageSvg
                  key={"svg-" + pageNum}
                  svgWidth={width}
                  svgHeight={height}
                  text={page.text}
                  columnLefts={this.state.columnLefts}
                />
              </div>
            );
          })}
      </>
    );
  }
}
