import * as React from "react";

import * as _pdfjs from "pdfjs-dist";
var PdfjsWorker = require("pdfjs-dist/lib/pdf.worker.js");
if (typeof window !== "undefined" && "Worker" in window) {
  (_pdfjs as any).GlobalWorkerOptions.workerPort = new PdfjsWorker();
}
import {
  PDFJSStatic,
  PDFDocumentProxy,
  PDFInfo,
  PDFMetadata,
  PDFTreeNode
} from "pdfjs-dist";
const pdfjs: PDFJSStatic = _pdfjs as any;
import jsonfile = require("jsonfile");
import path = require("path");

import PageCanvas from "./PageCanvas";
import PageText from "./PageText";
import PageSvg from "./PageSvg";
import memoizeOne from "memoize-one";
import { oc } from "ts-optchain";
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
import {
  loadPdfPages,
  loadPageJson,
  PageOfText,
  checkGetPageNumsToLoad
} from "./io";

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
  text: PageOfText;
  page: any; // pdfjs.PDFPageProxy;
  linesOfText: LineOfText[];
  // images: Image[];
}

import styled from "styled-components";

/**
 * @class **PdfViewer**
 * todo zoom + viewbox adjust
 */

const PdfViewerDefaults = {
  props: {
    pageNumbersToLoad: [] as number[],
    pathInfo: { pdfDir: "", pdfRootDir: "" },
    viewBox: {
      top: 110,
      left: 110,
      width: "100%" as number | string | undefined,
      height: "100%" as number | string | undefined,
      scale: 1
    },
    showLineBoxes: false
  },
  state: {
    scale: 2, // todo scale
    pages: [] as Page[],
    columnLefts: [] as number[],
    height2color: {} as any,
    fontNames2color: {} as any,
    meta: {} as {
      info: PDFInfo;
      metadata: PDFMetadata;
    },
    outline: [] as PDFTreeNode[],
    viewboxes: [] as PdfSegmentViewbox[],
    patches: []
  }
};

import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import {
  NodeBase,
  PdfSegmentViewbox,
  makePdfSegmentViewbox,
  makeLink,
  aNode
} from "../store/creators";
const mapState = (state: iRootState, props: typeof PdfViewerDefaults) => {
  return {
    nodes: state.graph.nodes,
    links: state.graph.links,
    selectedNodes: state.graph.selectedNodes,
    selectedLinks: state.graph.selectedLinks,
    patches: state.graph.patches
  };
};

const mapDispatch = ({
  graph: { addBatch, removeBatch, toggleSelections, updateBatch }
}: iDispatch) => ({
  addBatch,
  removeBatch,
  toggleSelections,
  updateBatch
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

class PdfViewer extends React.Component<
  typeof PdfViewerDefaults.props & connectedProps,
  typeof PdfViewerDefaults.state
> {
  static defaultProps = PdfViewerDefaults.props;
  state = {
    ...PdfViewerDefaults.state,
    scale: oc(this.props.viewBox).scale(1)
  };
  scrollRef = React.createRef<HTMLDivElement>();

  static getDerivedStateFromProps(
    props: typeof PdfViewerDefaults.props & connectedProps,
    state: typeof PdfViewerDefaults.state
  ) {
    //todo use memoize-one as in react docs
    //todo useGraph hook
    if (state.viewboxes.length === 0) {
      console.time("derived state");

      // todo conditional autocomplete
      const viewboxes = (Object.values(
        props.nodes as any
      ) as PdfSegmentViewbox[]).filter(n => {
        return (
          n.data.type === "pdf.segment.viewbox" &&
          n.data.pdfDir === props.pathInfo.pdfDir
        );
      });
      console.timeEnd("derived state");

      return { viewboxes, patches: props.patches };
    } else if (props.patches !== state.patches) {
      console.time("derived state");

      const viewboxes = produce(state.viewboxes, draft => {
        props.patches.forEach(patch => {
          const id = patch.value.id;
          if (patch.op === "add") draft.push(patch.value);
          if (patch.op === "remove") draft.filter(vb => vb.id !== id);
          if (patch.op === "replace") draft[id] = patch.value;
        });
        return draft;
      });
      console.timeEnd("derived state");

      return { viewboxes, patches: props.patches };
    }
    return null;
  }

  async componentDidMount() {
    await this.loadFiles();
    const { left, top } = this.props.viewBox;
    this.scrollRef.current.scrollTo(left, top);
  }

  loadFiles = async () => {
    this.setState({ pages: [] });
    const {
      pageNumbersToLoad,
      pathInfo: { pdfDir, pdfRootDir }
    } = this.props;
    const fullDirPath = path.join(pdfRootDir, pdfDir);
    const pdfPath = path.join(fullDirPath, pdfDir + ".pdf");
    const seg = await jsonfile.readFile(
      path.join(fullDirPath, "userSegments.json")
    );

    const pageNumbersToLoadFixed = checkGetPageNumsToLoad(
      seg.numberOfPages,
      pageNumbersToLoad
    );

    const [
      pdfPages,
      linesOfText,
      textToDisplay,
      columnLefts,
      userSegments
    ] = await Promise.all([
      loadPdfPages(pdfPath, pageNumbersToLoad),
      loadPageJson(fullDirPath, "linesOfText", pageNumbersToLoad),
      loadPageJson(fullDirPath, "textToDisplay", pageNumbersToLoad),
      jsonfile.readFile(path.join(fullDirPath, "columnLefts.json")),
      loadPageJson(fullDirPath, "userSegments", pageNumbersToLoad)
    ]);

    let pages = [] as Page[];
    for (let i in pdfPages) {
      pages.push({
        linesOfText: linesOfText[i],
        page: pdfPages[i],
        pageNumber: pageNumbersToLoadFixed[i],
        text: textToDisplay[i],
        viewport: pdfPages[i].getViewport(this.state.scale)
      });
    }
    if (this.state.scale !== 1) {
      const scaledPages = this.scalePages(pages, 1, this.state.scale);
      this.setState({ pages: scaledPages, columnLefts });
    } else {
      this.setState({ pages, columnLefts });
    }
  };

  scale = (obj, keyNames: string[], prevScale, scale) => {
    const scaled = keyNames.reduce((all, keyName, ix) => {
      if (!obj.hasOwnProperty(keyName)) return all;
      return { ...all, [keyName]: (obj[keyName] / prevScale) * scale };
    }, {});

    return scaled;
  };

  scalePages = (pages: Page[], prevScale: number = 1, scale: number = 1) => {
    let keysToScale = ["height", "left", "top", "width"];

    let scaledPages = [] as Page[];
    for (let [ix, page] of pages.entries()) {
      const linesOfText = page.linesOfText.map(lot => {
        return {
          ...lot,
          ...this.scale(lot, keysToScale, prevScale, scale)
        };
      });
      const text = page.text.text.map(t => {
        return {
          ...t,
          ...this.scale(t, keysToScale, prevScale, scale)
        };
      });
      const viewport = page.page.getViewport(scale);
      scaledPages.push({ ...page, linesOfText, viewport });
    }
    return scaledPages;
  };

  async componentDidUpdate(prevProps: typeof PdfViewerDefaults.props) {
    if (prevProps.pathInfo.pdfDir !== this.props.pathInfo.pdfDir) {
      await this.loadFiles();
      this.setState({ viewboxes: [] });
    }
  }

  zoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      const deltaY = e.deltaY;
      this.setState(state => {
        const prevScale = this.state.scale;
        const newScale = prevScale - deltaY / 1000;
        const scaledPages = this.scalePages(state.pages, prevScale, newScale);
        return { pages: scaledPages, scale: newScale };
      });
    }
  };

  onAddViewbox = (pageNumber: number, scale) => (viewboxCoords: {
    left;
    top;
    width;
    height;
  }) => {
    // each svg page gets this func with pagenum/scale
    // each page calls it on mouseup with the coords
    // this adds the node to redux, which gets passed in as props to svg
    const { left, top, width, height } = viewboxCoords;
    const source = this.props.nodes[this.props.pathInfo.pdfDir];
    let { x, y } = source.style as any;
    const shiftedX = x + Math.random() * 60 - 40;
    const style = {
      x: shiftedX < 20 ? x + 20 + Math.random() * 60 : shiftedX,
      y: y + Math.random() * 60 + 40
    };
    // note we save with scale = 1
    const vb = makePdfSegmentViewbox(
      {
        left: left,
        top: top,
        width: width,
        height: height,
        scale,
        pageNumber,
        pdfDir: this.props.pathInfo.pdfDir
      },
      style
    );

    const linkToPdf = makeLink(source, vb, { type: "more" });

    //10ms update with just a div
    this.props.addBatch({ nodes: [vb], links: [linkToPdf] });
    this.props.toggleSelections({ selectedNodes: [vb.id], clearFirst: true });
  };

  viewboxesForPage = (pageNumber, scale) => {
    return this.state.viewboxes
      .filter(v => v.data.pageNumber === pageNumber)
      .map(vb => {
        const { left, top, width, height, scale: scaleAtCapture } = vb.data;
        // const { scale } = this.state;
        // todo update on scale
        return {
          ...vb,
          data: {
            left: (left / scaleAtCapture) * this.state.scale,
            top: (top / scaleAtCapture) * this.state.scale,
            width: (width / scaleAtCapture) * this.state.scale,
            height: (height / scaleAtCapture) * this.state.scale,
            scale: scaleAtCapture
          }
        };
      });
  };

  renderPages = () => {
    const { pages } = this.state;
    const havePages = pages.length > 0;
    if (!havePages) return null;
    return pages.map((page, pageIx) => {
      const { width, height } = page.viewport;
      return (
        <div
          key={page.pageNumber}
          onWheel={this.zoom}
          style={{ width, height, position: "relative" }}
        >
          <PageCanvas
            key={"canvas-" + page.pageNumber}
            page={page.page}
            viewport={page.viewport}
          />
          {/* <PageText
                  key={"text-" + pageNum}
                  scale={this.state.scale}
                  pageOfText={page.text}
                  // height={height}
                /> */}

          <PageSvg
            // scale={this.state.scale}
            key={"svg-" + page.pageNumber}
            svgWidth={width}
            svgHeight={height}
            pageOfText={page.text}
            columnLefts={this.state.columnLefts.map(x => x * this.state.scale)}
            linesOfText={page.linesOfText}
            // images={page.images}
            // height2color={this.state.height2color}
            // fontNames2color={this.state.fontNames2color}
            pdfPathInfo={this.props.pathInfo}
            onAddViewbox={this.onAddViewbox(page.pageNumber, this.state.scale)}
            viewboxes={this.viewboxesForPage(page.pageNumber, this.state.scale)}
          />
        </div>
      );
    });
  };

  render() {
    const { width, height } = this.props.viewBox;
    // todo: set height and width and then scrollto
    return (
      <div
        ref={this.scrollRef}
        style={{
          maxWidth: width,
          maxHeight: height,
          boxSizing: "border-box",
          overflow: "scroll"
        }}
      >
        {this.renderPages()}
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(PdfViewer);
