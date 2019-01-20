import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFJSStatic } from "pdfjs-dist";
const pdfjsLib: PDFJSStatic = pdfjs as any;
const pdfPath = require("./Chunking-TICS.pdf");
// const pdfPath = require("./digitalVsPaper.pdf");
// const pdfPath = require("./Wobbrock-2015.pdf");
// const pdfPath = require("./checklist.pdf");
// const pdfPath = require("./soylent-uist2010.pdf");
// const pdfPath = require("./poverty.pdf");
import PageCanvas from "./PageCanvas";
import PageText, { TextItem } from "./PageText";
import PageSvg from "./PageSvg";
import { flatten } from "./utils";
import {histogram, extent, mean, median, variance, deviation, rollup} from 'd3-array'

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
          return {
            ...tc,
            top: yMax - (y + offsetY),
            left: x - xMin,
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
    const leftXs = flatten<TextItem>(this.state.pages.map(p => p.text)).map(
      t => t.left
    );
    const makeHistogram = histogram();
    const leftXHist = makeHistogram(leftXs)
    const leftXBinCounts = leftXHist.map(x=>x.length)
    const leftXMean = mean(leftXBinCounts)
    const leftXStd = deviation(leftXBinCounts)
    const leftXZscore = leftXBinCounts.map(x => (x-leftXMean)/leftXStd)
    const zThresh = 1
    const columnLefts = leftXBinCounts.reduce((all,val, ix) => {
      if (leftXZscore[ix] > zThresh) {
        // console.log(rollup(leftXHist[ix]))
        all.push(Math.round(median(leftXHist[ix])))
        return all
      } else {
        return all
      }
    },[])
    this.setState({columnLefts})
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
