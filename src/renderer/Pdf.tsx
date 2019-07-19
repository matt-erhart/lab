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
import { Observable, combineLatest } from "rxjs";
import { useEventCallback } from "rxjs-hooks";
import { map, debounceTime, tap } from "rxjs/operators";
// custom
import { getNeighborhood } from "./graphUtils";
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
import equal from "fast-deep-equal";
export type LoadFile = { rootDir: string; dir: string };
export type LoadUrl = string;

export const logPdfEvent = (pdfEvent: { type: string; payload: any }) => {
  const timeStamp = performance.now();
  console.log(
    "pdfEvent: ",
    pdfEvent.payload,
    timeStamp / 1000 / 60,
    performance.timing.navigationStart
  );
};

const defaultProps = {
  scale: 1,
  width: undefined as number | string,
  height: undefined as number | string,
  scrollToLeft: 0,
  scrollToTop: 0,
  scrollToPageNumber: 0,
  loadPageNumbers: [] as number[],
  displayMode: "full" as "full" | "box"
};

type PdfZoomEvent = { type: "zoomed"; payload: { scale: number } };
type PdfScrollEvent = {
  type: "scrolled";
  payload: { scrollToLeft: number; scrollToTop: number };
};

type OptionalProps = Partial<
  typeof defaultProps & {
    onChange: (props: PdfZoomEvent | PdfScrollEvent) => void;
  }
>;

interface RequiredProps {
  load: LoadFile; // todo | LoadUrl;
}

const shouldMemoPdf = (prevProps, nextProps) => {
  return equal(prevProps, nextProps);
};

export const Pdf = React.memo((_props: OptionalProps & RequiredProps) => {
  const props = { ...defaultProps, ..._props };

  const [scale, setScale] = useState(props.scale);
  const [pages, setPages] = useState([]);
  const [pageNumbersInView, setPageNumbersInView] = useState([]);
  const scrollRef = useRef(null);
  const track = useRef({ scale, pages }); // need in hooks, but don't want to rerun effect
  useEffect(() => {
    track.current = { pages, scale };
  }, [pages, scale]);

  const scrollChange = (scale, scrollRef) => {
    if (!scrollRef.current) return undefined;
    const { scrollTop, scrollLeft } = scrollRef.current;
    const newEvent = {
      type: "scrolled",
      payload: {
        scrollToTop: scrollTop / scale,
        scrollToLeft: scrollLeft / scale
      }
    };
    props.onChange(newEvent);
  };

  const [onDebouncedScroll, scrollEvent] = useEventCallback(
    (
      event$: Observable<React.SyntheticEvent<HTMLDivElement>>,
      input: Observable<any>
    ) =>
      combineLatest(event$, input).pipe(
        debounceTime(1000),
        // wait 500ms after last scroll to
        tap(([event, input]) => {
          if (scrollRef) {
            if (!!props.onChange && props.displayMode === "box") {
              // to make this work for 'full' add pagenumber
              scrollChange(input[0], scrollRef);
            }
          }
        })
      ),
    null,
    [scale]
  );

  const [onDebouncedScale] = useEventCallback(
    (e, input) =>
      input.pipe(
        debounceTime(500),
        // wait 500ms after last
        tap(input => {
          if (!!props.onChange && props.displayMode === "box") {
            props.onChange({
              type: "zoomed",
              payload: { scale: input[0] }
            });
            scrollChange(input[0], scrollRef);
          }
        })
      ),
    [scale, props.onChange, scrollRef],
    [scale, props.onChange, scrollRef]
  );

  const scrollRefCallback = useCallback(
    node => {
      // called when react assigns the ref to the html node which is after pages.length > 0
      if (node !== null && !scrollRef.current) {
        const pagesOffset = getPageOffset(pages, props.scrollToPageNumber);
        node.scrollTo(props.scrollToLeft, props.scrollToTop + pagesOffset);
        scrollRef.current = node;
      }
    },
    [pages, scale]
  );

  useEffect(() => {
    // if we pass in new scroll
    if (!scrollRef.current || !track.current || props.displayMode === "box")
      return undefined;
    const pagesOffset = getPageOffset(pages, props.scrollToPageNumber);
    scrollRef.current.scrollTo(
      props.scrollToLeft * track.current.scale,
      props.scrollToTop * track.current.scale + pagesOffset
    );
  }, [track, props.scrollToLeft, props.scrollToTop, props.loadPageNumbers]);

  useEffect(() => {
    setPages(pages => {
      return pages.map(page => {
        return { ...page, viewport: page.page.getViewport(scale) };
      });
    });
  }, [scale]);

  const { boxes } = useSelector((state: iRootState) => {
    const segments = Object.values(state.graph.nodes).filter(n => {
      return (
        n.data.type === "pdf.segment.viewbox" &&
        n.data.pdfDir === props.load.dir &&
        (props.loadPageNumbers.includes(n.data.pageNumber) ||
          props.loadPageNumbers.length === 0)
      );
    });
    // const { nodes: neighborNodes, links: neighborLinks } = getNeighborhood(
    //   segments.map(x => x.id),
    //   state.graph.nodes,
    //   state.graph.links
    // );

    // let linkedUserDocs = neighborNodes.filter(
    //   node => node.data.type === "userDoc"
    // );

    return {
      boxes: [...segments] as PdfSegmentViewbox[]
    };
  });

  const loadPdf = async () => {
    const { dir, rootDir } = props.load;
    const pages = await loadFiles({
      pageNumbersToLoad: props.loadPageNumbers,
      pdfDir: dir,
      pdfRootDir: rootDir,
      scale: scale
    }); // todo load in order
    setPages(pages);
    onScrollVirtualize(
      scrollRef,
      pages,
      pageNumbersInView,
      setPageNumbersInView
    )(null);
  };

  useEffect(() => {
    loadPdf();
  }, [props.load.dir]);

  const renderPages = pages => {
    if (pages.length < 1) return null;
    const Pages = pages.map(page => {
      let { width, height } = page.viewport;
      const shouldRenderPage =
        pageNumbersInView.includes(page.pageNumber) ||
        props.loadPageNumbers.length === 1;

      return (
        <div
          draggable={false}
          id={"pdf-page" + page.pageNumber}
          key={"pdf-page" + page.pageNumber}
          style={{
            width: width,
            minWidth: width,
            height: height,
            position: "relative",
            borderBottom: "1px solid lightgrey"
          }}
        >
          {shouldRenderPage && (
            <PageBoxes
              id="PageBoxes"
              boxes={scaledBoxesForPage(boxes, page.pageNumber, scale)}
              pageHeight={height / scale}
              pageWidth={width / scale}
              onChange={boxEventsToRedux({
                scale,
                pageNumber: page.pageNumber,
                pdfDir: props.load.dir
              })}
              scale={scale}
            />
          )}

          {shouldRenderPage && (
            <PageCanvas
              id={"canvas-" + page.pageNumber}
              key={"canvas-" + page.pageNumber}
              page={page.page}
              viewport={page.viewport}
              scale={scale}
            />
          )}
        </div>
      );
    });
    return Pages;
  };

  if (pages.length < 1) return null; // required for scrollTo on mount to work
  return (
    <div
      id="pdf-scroll"
      ref={scrollRefCallback}
      draggable={false}
      style={{
        overflow: "scroll",
        height: props.height ? props.height : "auto",
        width: props.width ? props.width : "auto"
      }}
      onWheel={onWheel(setScale)}
      onScroll={e => {
        onScrollVirtualize(
          scrollRef,
          pages,
          pageNumbersInView,
          setPageNumbersInView
        )(e);
        onDebouncedScroll(e);
      }}
    >
      {renderPages(pages)}
    </div>
  );
}, shouldMemoPdf);

const onScrollVirtualize = (
  scrollRef,
  pages,
  pageNumbersInView,
  setPageNumbersInView
) => e => {
  if (!scrollRef || !pages || !setPageNumbersInView) return undefined;
  !!e && e.stopPropagation();

  const newPageNumbersInView = getPageNumbersInView(scrollRef, pages);

  if (JSON.stringify(pageNumbersInView) === JSON.stringify(pageNumbersInView)) {
    setPageNumbersInView(newPageNumbersInView);
  }
};

const getPageNumbersInView = (scrollRef, pages) => {
  // todo all refs can be undefined
  const { height, width } = scrollRef.current.getBoundingClientRect();
  const scrollTop = scrollRef.current.scrollTop;
  const scrollLeft = scrollRef.current.scrollLeft;

  let pageTop = 0;
  let pageIxsInView = [];
  for (let pix in pages) {
    const p = pages[pix];
    const pageBottom = pageTop + p.viewport.height;
    const pageIsBellowView = pageTop > scrollTop + height;
    const pageIsAboveView = pageBottom < scrollTop;
    const pageNotInView = pageIsBellowView || pageIsAboveView;
    if (!pageNotInView) pageIxsInView.push(parseInt(pix) + 1);
    pageTop = pageBottom;
  }
  const minPage = Math.min(...pageIxsInView);
  const maxPage = Math.max(...pageIxsInView);
  if (minPage > 1) pageIxsInView.push(minPage - 1);
  if (maxPage < pages.length + 1) pageIxsInView.push(maxPage + 1);
  logPdfEvent({
    type: "scrolled",
    payload: {
      scrollTop,
      scrollLeft,
      scrollHeight: height,
      scrollWidth: width,
      visablePageRange: [minPage, maxPage],
      nPages: pages.length,
      page0Width: pages[0].viewport.width,
      page0Height: pages[0].viewport.height
    }
  });
  return pageIxsInView;
};

const getPageOffset = (pages, pageNumber) => {
  return pages.reduce((sum, page) => {
    if (page.pageNumber < pageNumber) {
      sum += page.viewport.height;
    }
    return sum;
  }, 0);
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
import { Nodes, Links, makeUserDoc } from "../store/creators";
import { getState } from "../store/createStore";
const boxEventsToRedux = (context: {
  scale: number;
  pageNumber: number;
  pdfDir: string;
}): onChange => event => {
  if (event.type === "added") {
    const { left, top, width, height } = event.payload.box;
    const { scale, pageNumber, pdfDir } = context;
    // note we save with scale = 1
    const nextNodeLoc = getState().app.nextNodeLocation;
    const boxNode = makePdfSegmentViewbox(
      {
        left,
        top,
        width,
        height,
        scale: 1,
        pageNumber,
        pdfDir,
        scalePreview: scale
      },
      {
        left: nextNodeLoc.left,
        top: nextNodeLoc.top + nextNodeLoc.height - 100
      }
    );
    const linkFromPdf = makeLink(pdfDir, boxNode.id, { type: "more" });
    // style, todo place with nextNodeLoc
    dispatch.graph.addBatch({ nodes: [boxNode], links: [linkFromPdf] });
    dispatch.graph.toggleSelections({
      selectedNodes: [boxNode.id],
      clearFirst: true
    });

    if (event.payload.ctrlKey) {
      comment({
        type: "comment",
        payload: {
          id: boxNode.id,
          left: event.payload.clientX,
          top: event.payload.clientY,
          side: "bottom"
        }
      });
    }
  }

  if (event.type === "updated") {
    const { id, box } = event.payload;
    dispatch.graph.updateBatch({ nodes: [{ id, data: { ...box } }] });
  }

  if (event.type === "delete") {
    dispatch.graph.removeBatch({ nodes: [event.payload.id] });
  }

  if (event.type === "scrollTo") {
    const boxNode = getState().graph.nodes[event.payload.id];
    dispatch.app.setMainPdfReader({
      scrollToPageNumber: boxNode.data.pageNumber,
      left: boxNode.data.left,
      top: boxNode.data.top + Math.random(), // update everytime
      pdfDir: boxNode.data.pdfDir,
      scale: boxNode.data.scalePreview
    });

    // else {
    //   this.props.setGraphContainer({
    //     left: vb.style.min.left,
    //     top: vb.style.min.top
    //   });
    // }
  }

  if (event.type === "comment") {
    comment(event);
  }
};

import { CommentAction } from "./ViewboxDiv";
const comment = (event: CommentAction) => {
  const { nodes, links } = getState().graph;
  const { id: segmentId } = event.payload;

  const { nodes: neighborNodes, links: neighborLinks } = getNeighborhood(
    [segmentId],
    nodes,
    links
  );

  let linkedUserDocs = neighborNodes.filter(
    node => node.data.type === "userDoc"
  );

  if (linkedUserDocs.length > 0) {
    const _height = 100;

    dispatch.app.setPortals([
      {
        id: linkedUserDocs[0].id,
        left: event.payload.left,
        top:
          event.payload.side === "top"
            ? event.payload.top - _height
            : event.payload.top,
        width: 300,
        height: _height
      }
    ]);
  }

  if (linkedUserDocs.length === 0) {
    const segStyle = (nodes[segmentId] as PdfSegmentViewbox).style.min;

    const _height = 120;
    const newTextStyleForCanvas = {
      left: segStyle.left,
      top: segStyle.top - _height,
      height: _height,
      width: segStyle.width
    };

    const newDoc = makeUserDoc({
      data: { useTextForAutocomplete: false },
      style: {
        min: newTextStyleForCanvas,
        max: newTextStyleForCanvas
      }
    });

    const newLink = makeLink(segmentId, newDoc.id, {
      text: "compress",
      html: "<p>compress</p>"
    });

    dispatch.graph.addBatch({ nodes: [newDoc], links: [newLink] });
    setTimeout(() => {
      dispatch.app.setPortals([
        {
          id: newDoc.id,
          left: event.payload.left,
          top: event.payload.top,
          width: 300,
          height: 100
        }
      ]);
    }, 100);
  }
};

const onWheel = (setScale: React.Dispatch<React.SetStateAction<number>>) => (
  e: React.WheelEvent<HTMLDivElement>
) => {
  e.persist();
  if (e.ctrlKey) {
    e.preventDefault();
    setScale(prevScale => {
      const newScale = prevScale - e.deltaY / 1000;
      const res = newScale >= 0.5 ? newScale : 0.5;
      logPdfEvent({
        type: "ScaleChanged",
        payload: { from: prevScale, to: res }
      });
      return res;
    });
  }
};
