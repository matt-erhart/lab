import * as React from "react";

import * as _pdfjs from "pdfjs-dist";
var PdfjsWorker = require("pdfjs-dist/lib/pdf.worker.js");
if (typeof window !== "undefined" && "Worker" in window) {
  (_pdfjs as any).GlobalWorkerOptions.workerPort = new PdfjsWorker();
}
import { PDFJSStatic, PDFDocumentProxy } from "pdfjs-dist";
const pdfjs: PDFJSStatic = _pdfjs as any;

import PageCanvas from "./PageCanvas";
import PageText, { TextItem } from "./PageText";
import PageSvg from "./PageSvg";

import {
  flatten,
  midPoint,
  getRectCoords,
  sortBy,
  unique,
  brewer12
} from "./utils";
import { histogram, mean, median, deviation } from "d3-array";
import produce from "immer";

export interface LineOfText {
  id: string;
  // pageId: number;
  lineIndex: number;
  columnIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  text: string;
  textIds: string[];
}

export interface Image {
  x: string;
  y: string;
  width: string;
  height: string;
  "xlink:href": string;
  transform: string;
  gTransform: string;
}

interface Page {
  pageNumber: number;
  viewport: any; // pdfjs.PDFPageViewport;
  text: TextItem[];
  page: any; // pdfjs.PDFPageProxy;
  linesOfText: LineOfText[];
  images: Image[];
}

/**
 * @class **PdfViewer**
 * todo zoom, file name prop, layer props, keyboard shortcuts
 */
const PdfViewerDefaults = {
  props: { pageNumbersToLoad: [] as number[], pdfPath: "" as any },
  state: {
    scale: 1, // todo smooth zoom
    pages: [] as Page[],
    columnLefts: [] as number[],
    height2color: {} as any,
    fontNames2color: {} as any
  }
};

export default class PdfViewer extends React.Component<
  typeof PdfViewerDefaults.props,
  typeof PdfViewerDefaults.state
> {
  static defaultProps = PdfViewerDefaults.props;
  state = PdfViewerDefaults.state;
  loadPages = async (pdf: PDFDocumentProxy, pageNumbersToLoad: number[]) => {
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

      // // get images
      const opList = await page.getOperatorList();
      let svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
      svgGfx.embedFonts = true;
      const svg = await svgGfx.getSVG(opList, viewport); //in svg:img elements
      console.log(svg);

      const imgs = svg.querySelectorAll("svg image");
      // document.body.append(svg)
      let images = [] as Image[];
      for (let img of imgs) {
        images.push({
          x: img.getAttribute("x"),
          y: img.getAttribute("y"),
          width: img.getAttribute("width"),
          height: img.getAttribute("height"),
          "xlink:href": img.getAttribute("xlink:href"),
          transform: img.getAttribute("transform"),
          gTransform: img.parentNode.getAttribute("transform")
        });
      }

      const [xMin, yMin, xMax, yMax] = (viewport as any).viewBox;

      const alignedTextContent = await Promise.all(
        text.items.map(async (tc, i) => {
          const fontData = await (page as any).commonObjs.ensureObj(
            tc.fontName
          );

          const [, , , offsetY, x, y] = tc.transform;
          const top = yMax - (y + offsetY);
          const left = x - xMin;
          const fontHeight = tc.transform[0];

          return {
            ...tc,
            id: i,
            top: top * this.state.scale,
            left: left * this.state.scale,
            width: tc.width * this.state.scale,
            height: tc.height * this.state.scale,
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
            page,
            linesOfText: [],
            images
          })
        };
      });
    }
  };
  componentDidMount() {
    this.loadPdf();
  }

  componentDidUpdate(prevProps: typeof PdfViewerDefaults.props) {
    if (prevProps.pdfPath !== this.props.pdfPath) {
      this.setState({pages: []})
      this.loadPdf();
    }
  }

  loadPdf = async () => {
    const pdf = await pdfjs.getDocument({
      url: this.props.pdfPath,
      // @ts-ignore
      cMapUrl: "../node_modules/pdfjs-dist/cmaps/",
      cMapPacked: true,
      stopAtErrors: false
    });

    await this.loadPages(pdf, this.props.pageNumbersToLoad);

    const makeHistogram = histogram();
    let _fontHeights = flatten<TextItem>(this.state.pages.map(p => p.text)).map(
      t => t.transform[0]
    );
    let fontHeights = unique(_fontHeights).sort();
    let height2color = fontHeights.reduce((res, height, ix) => {
      return { ...res, [height + ""]: brewer12[ix % 12] };
    }, {});

    let _fontNames = flatten<TextItem>(this.state.pages.map(p => p.text)).map(
      t => t.style.fontFamily
    );

    let fontNames = unique(_fontNames).sort();
    let fontNames2color = fontNames.reduce((res, name, ix) => {
      return { ...res, [name + ""]: brewer12[ix % 12] };
    }, {});

    // COLUMN LEFT EDGES
    const leftXs = flatten<TextItem>(this.state.pages.map(p => p.text)).map(
      t => t.left
    );

    const leftXHist = makeHistogram(leftXs);
    const leftXBinCounts = leftXHist.map(x => x.length);
    const leftXMean = mean(leftXBinCounts);
    const leftXStd = deviation(leftXBinCounts);
    const leftXZscore = leftXBinCounts.map(x => (x - leftXMean) / leftXStd);
    const zThresh = 1;
    const columnLefts = leftXBinCounts.reduce((all, _val, ix) => {
      if (leftXZscore[ix] > zThresh) {
        // console.log(rollup(leftXHist[ix]))
        all.push(Math.round(median(leftXHist[ix])));
        return all;
      } else {
        return all;
      }
    }, []);
    this.setState({ columnLefts, height2color, fontNames2color });
    this.setState(
      state => {
        return produce(state, draft => {
          draft.pages.forEach((page, i) => {
            const lines = getLines(columnLefts, page.text, i);
            page.linesOfText = lines;
          });
        });
      },
      () => console.log(this.state.pages[0])
    );
  };

  render() {
    const { pages } = this.state;
    const havePages = pages.length > 0;
    // console.log("todo ctx.getImageData(sx, sy, sw, sh); on rect select");

    return (
      <>
        {havePages &&
          pages.map((page, pageNum) => {
            const { width, height } = page.viewport;
            return (
              <div
                draggable={false}
                key={pageNum}
                style={{ position: "relative", width, height }}
              >
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
                  scale={this.state.scale}
                  key={"svg-" + pageNum}
                  svgWidth={width}
                  svgHeight={height}
                  text={page.text}
                  columnLefts={this.state.columnLefts}
                  linesOfText={page.linesOfText}
                  images={page.images}
                  height2color={this.state.height2color}
                  fontNames2color={this.state.fontNames2color}
                />
              </div>
            );
          })}
        {/* <div>
          hey
          {flatten<Image>(pages.map(p => p.images)).map(img => {
            const { src, ...style } = img;
            return (
              <img
                src={src}
                style={
                  {
                    // ...style,
                    maxWidth: pages[0].viewport.width
                  }
                }
              />
            );
          })}
        </div> */}
      </>
    );
  }
}

const getLines = (
  columnLefts: number[],
  textItems: TextItem[],
  pageNumber: number
) => {
  // FIND LINE LEFT EDGES
  // so we've got the left side of columns
  // in a column we get all y values of text items
  // then sort the y vals, and combine y vals within some dist of eachother
  // then sort by x coord to get text order for items in a line

  const nCols = columnLefts.length;
  const textByColumn = columnLefts.map((left, i) => {
    const rightEdge = i < nCols - 1 ? columnLefts[i + 1] : Infinity;
    return textItems.filter(t => {
      const textLeft = Math.round(t.left);
      return left <= textLeft && textLeft < rightEdge && t.str !== " ";
    }); // removing spaces here, may need these for later formating
  });

  const medianFontHeight = Math.round(
    median(
      textItems.map(t => {
        return t.transform[0]; //todo rename transform[0] to font height
      })
    )
  );

  let columnsLinesTextItems = [];
  for (var col of textByColumn) {
    const uniqueTops = [...new Set(col.map(t => Math.round(t.top)))].sort();
    let firstLine = col.find(x => Math.round(x.top) === uniqueTops[0]);
    let loopState = { count: 0, lines: [[firstLine]] };

    // combine tops within threshold
    const threshold = medianFontHeight / 2;
    for (let i = 1; i < uniqueTops.length; i++) {
      const prev = uniqueTops[i - 1];
      const current = uniqueTops[i];
      const textItems = col.filter(x => Math.round(x.top) === current);
      if (Math.abs(prev - current) < threshold) {
        loopState.lines[loopState.count].push(...textItems);
      } else {
        loopState.lines[loopState.count].sort(sortBy("left"));
        // if need performance, combine textitems here
        loopState.count++;
        loopState.lines.push([]);
        loopState.lines[loopState.count].push(...textItems);
      }
    }
    columnsLinesTextItems.push(loopState.lines);
  }

  // combine text items into a line with bounding box
  const linesInColumns: LineOfText[][] = columnsLinesTextItems.map(
    (col, colIx) => {
      return col.map((line, lineIndex) => {
        const nTextItems = line.length;
        return line.reduce((all, text, i) => {
          if (i === 0) {
            // first
            return {
              id: `line${lineIndex}-col${colIx}`,
              pageNumber: pageNumber,
              columnIndex: colIx,
              lineIndex: lineIndex,
              left: text.left,
              top: text.top,
              height: text.transform[0],
              width: text.width,
              text: text.str,
              textIds: [text.id]
            };
          } else if (i === nTextItems - 1 && nTextItems > 1) {
            return {
              ...all,
              width: text.left + text.width - all.left,
              text: all.text + text.str,
              textIds: all.textIds.concat(text.id)
            };
          } else {
            // middle
            return {
              ...all,
              top: Math.min(text.top, all.top),
              height: Math.max(text.transform[0], all.height),
              text: all.text + text.str,
              textIds: all.textIds.concat(text.id)
            };
          }
        }, {}) as any;
      });
    }
  );

  linesInColumns.forEach(col => {
    col.sort(sortBy("top"));
  });

  return flatten<LineOfText>(linesInColumns);
};
