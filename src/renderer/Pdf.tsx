// Replaces PdfViewer
// libs
import * as React from "react";
import * as _pdfjs from "pdfjs-dist";
var PdfjsWorker = require("pdfjs-dist/lib/pdf.worker.js");
if (typeof window !== "undefined" && "Worker" in window) {
  (_pdfjs as any).GlobalWorkerOptions.workerPort = new PdfjsWorker();
}
import { PDFJSStatic } from "pdfjs-dist";

import jsonfile = require("jsonfile");
import path = require("path");
import styled from "styled-components";
import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback
} from "react";
// custom
import { PageBoxes } from "./PageBoxes";
import { loadPdfPages, checkGetPageNumsToLoad } from "./io";
import PageCanvas from "./PageCanvas";
import { iRootState, dispatch } from "../store/createStore";
import { Box } from "./geometry";
import { useSelector } from "react-redux";
import {
  makePdfSegmentViewbox,
  makeLink,
  PdfSegmentViewbox
} from "../store/creators";

export type LoadFile = { rootDir: string; dir: string };
export type LoadUrl = string;

const defaultProps = {
  scale: 1,
  width: undefined as number | string,
  height: undefined as number | string,
  scrollToLeft: 0,
  scrollToTop: 0,
  scrollToPage: 0,
  scrollToElement: undefined as HTMLElement,
  loadPageNumbers: [] as number[]
};

type OptionalProps = Partial<typeof defaultProps>;

interface RequiredProps {
  load: LoadFile; // todo | LoadUrl;
}

export const Pdf = (_props: OptionalProps & RequiredProps) => {
  const [scale, setScale] = useState(_props.scale);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    setPages(pages => {
      return pages.map(page => {
        return { ...page, viewport: page.page.getViewport(scale) };
      });
    });
  }, [scale]);

  const props = { ...defaultProps, ..._props };
  const boxes: PdfSegmentViewbox[] = useSelector((state: iRootState) => {
    return Object.values(state.graph.nodes).filter(n => {
      return (
        n.data.type === "pdf.segment.viewbox" &&
        n.data.pdfDir === props.load.dir &&
        props.loadPageNumbers.includes(n.data.pageNumber)
      );
    });
  });

  const loadPdf = async () => {
    const { dir, rootDir } = props.load;
    const pages = await loadFiles({
      pageNumbersToLoad: props.loadPageNumbers,
      pdfDir: dir,
      pdfRootDir: rootDir,
      scale: props.scale
    }); // todo load in order
    setPages(pages);
  };

  useEffect(() => {
    loadPdf();
  }, []);

  const renderPages = pages => {
    if (pages.length < 1) return null;
    const Pages = pages.map(page => {
      const { width, height } = page.viewport;

      return (
        <div
          draggable={false}
          id={"pdf-page" + page.pageNumber}
          key={"pdf-page" + page.pageNumber}
          style={{
            width: width*scale,
            minWidth: width*scale,
            height: height*scale,
            position: "relative",
            borderBottom: "1px solid lightgrey"
          }}
          onWheel={onWheel(setScale)}
        >
          <PageBoxes
            id="PageBoxes"
            boxes={scaledBoxesForPage(boxes, page.pageNumber, scale)}
            pageHeight={height / scale}
            pageWidth={width / scale}
            onChange={boxEventsToRedux({
              pdfDir: props.load.dir,
              pageNumber: page.pageNumber,
              scale: scale
            })}
            scale={scale}
          />
          <PageCanvas
            id={"canvas-" + page.pageNumber}
            key={"canvas-" + page.pageNumber}
            page={page.page}
            viewport={page.viewport}
            scale={scale}

          />
        </div>
      );
    });
    return Pages;
  };

  return (
    <div draggable={false} style={{ overflow: "scroll", height: "100vh" }}>
      {renderPages(pages)}
    </div>
  );
};

const scalePages = (pages: any[], scale: number) => {
  // todo css transform scale and then when rendered swap it
  let scaledPages = [];
  for (let [ix, page] of pages.entries()) {
    const viewport = page.page.getViewport(scale);
    scaledPages.push({ ...page, viewport });
  }
  return scaledPages;
};

const scaledBoxesForPage = (boxes, pageNumber, scale) => {
  // so now we scale with css so scale at capture is 1
  return boxes
    .filter(b => b.data.pageNumber === pageNumber)
    .map(b => {
      const { left, top, width, height, scale: scaleAtCapture } = b.data;
      return {
        ...b,
        data: {
          ...b.data,
          id: b.id,
          left: left / scaleAtCapture,
          top: top / scaleAtCapture,
          width: width / scaleAtCapture,
          height: height / scaleAtCapture,
          scale: scaleAtCapture
        }
      };
    });
};

const loadFiles = async (props: {
  pageNumbersToLoad: number[];
  pdfDir: string;
  pdfRootDir: string;
  scale: number;
}) => {
  const { pageNumbersToLoad, pdfDir, pdfRootDir, scale } = props;
  const fullDirPath = path.join(pdfRootDir, pdfDir);
  const pdfPath = path.join(fullDirPath, pdfDir + ".pdf");
  const seg = await jsonfile.readFile(
    path.join(fullDirPath, "userSegments.json")
  ); // todo userSegments only used for nPages currently

  const pageNumbersToLoadFixed = checkGetPageNumsToLoad(
    seg.numberOfPages,
    pageNumbersToLoad
  );

  const [pdfPages] = await Promise.all([
    loadPdfPages(pdfPath, pageNumbersToLoadFixed)
  ]);

  let pages = [];
  for (let i in pdfPages) {
    pages.push({
      page: pdfPages[i],
      pageNumber: pageNumbersToLoadFixed[i],
      viewport: pdfPages[i].getViewport(scale)
    });
  }
  return pages;
};

type onChange = React.ComponentProps<typeof PageBoxes>["onChange"];

//
const boxEventsToRedux = (pdfInfo: {
  scale: number;
  pageNumber: number;
  pdfDir: string;
}): onChange => event => {
  if (event.type === "added") {
    const { left, top, width, height } = event.payload;
    const { scale, pageNumber, pdfDir } = pdfInfo;
    // note we save with scale = 1
    const boxNode = makePdfSegmentViewbox({
      left,
      top,
      width,
      height,
      scale: 1,
      pageNumber,
      pdfDir,
      scalePreview: scale
    });
    const linkFromPdf = makeLink(pdfDir, boxNode.id, { type: "more" });
    // style, todo place with nextNodeLoc
    dispatch.graph.addBatch({ nodes: [boxNode], links: [linkFromPdf] });
    dispatch.graph.toggleSelections({
      selectedNodes: [boxNode.id],
      clearFirst: true
    });
  }

  if (event.type === "updated") {
    const { id, box } = event.payload;
    console.log("event.payload: ", event.payload);
    dispatch.graph.updateBatch({ nodes: [{ id, data: { ...box } }] });
  }

  if (event.type === "delete") {
    dispatch.graph.removeBatch({ nodes: [event.payload.id] });
  }
};

const onWheel = (setScale: React.Dispatch<React.SetStateAction<number>>) => (
  e: React.WheelEvent<HTMLDivElement>
) => {
  e.persist();
  if (e.ctrlKey) {
    e.preventDefault();
    setScale(prevScale => prevScale - e.deltaY / 1000);
  }
};
