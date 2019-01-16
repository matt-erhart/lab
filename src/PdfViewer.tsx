import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFJSStatic } from "pdfjs-dist";
const pdfjsLib: PDFJSStatic = pdfjs as any;
const pdfPath = require("./Wobbrock-2015.pdf");
import { TextLayerBuilder } from "pdfjs-dist/lib/web/text_layer_builder";
require("pdfjs-dist/web/pdf_viewer.css");
import styled from "styled-components";

const defaultProps = {
  scale: 3,
  page: undefined as pdfjs.PDFPageProxy,
  rotate: undefined,
  viewport: undefined as pdfjs.PDFPageViewport
};

class PageCanvas extends React.Component<typeof defaultProps> {
  private canvasLayer = React.createRef<HTMLCanvasElement>();
  static defaultProps = defaultProps;

  async componentDidMount() {
    const { scale, page, viewport } = this.props;
    this.canvasLayer.current.height = viewport.height;
    this.canvasLayer.current.width = viewport.width;
    const canvasContext = this.canvasLayer.current.getContext("2d");
    await page.render({ canvasContext, viewport });
    const canvasRect = this.canvasLayer.current.getBoundingClientRect();
    // const text = await page.getTextContent();
  }

  render() {
    const { viewport: {width, height} } = this.props;
    return (<canvas style={{position: 'absolute'}} ref={this.canvasLayer} />);
  }
}

type TextItem = pdfjs.TextContentItem & 
{ viewportAlignedTrans: number[]; fallbackFontName, style }
interface Page {
  pageNumber: number;
  viewport: pdfjs.PDFPageViewport;
  text: TextItem[];
  page: pdfjs.PDFPageProxy;
}

const PdfViewerDefaults = {
  props: { pageNumbersToLoad: [] as number[] },
  state: {
    scale: 2,
    pages: [] as Page[]
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
          
      const alignedTextContent = await Promise.all(
        text.items.map(async (tc, i) => {
          const fontData = await page.commonObjs.ensureObj(tc.fontName)
          // if (tc.str === 'State of the world') debugger //143.75w
          return {
            ...tc,
            viewportAlignedTrans: adjustTransMatForViewport(
              viewport.transform,
              tc.transform
            ),
            fallbackFontName : fontData.data ? fontData.data.fallbackName : 'sans-serif',
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
    const pdf = await pdfjsLib.getDocument(pdfPath);
    await this.loadPages(pdf, this.props.pageNumbersToLoad);
  }

  render() {
    const { pages } = this.state;
    const havePages = pages.length > 0;
    return (
      <>
        {havePages &&
          pages.map((page, pageNum) => {
          const {width, height} = page.viewport;
           return (<div style={{position: 'relative', width, height }}>
              <PageCanvas
                key={"canvas-" + pageNum}
                page={page.page}
                viewport={page.viewport}
              />
              <PageText 
              key={"text-" + pageNum} 
              scale={this.state.scale}
              text={page.text} 
              width={width} 
              height={height}/>
            </div>)
          }

          )}
      </>
    );
  }
}

const Layers = () => {

}

const adjustTransMatForViewport = (viewportTransform, textItemTransform) => {
  // we have to take in account viewport transform, which includes scale,
  // rotation and Y-axis flip, and not forgetting to flip text.
  return pdfjsLib.Util.transform(
    pdfjsLib.Util.transform(viewportTransform, textItemTransform),
    [1, 0, 0, -1, 0, 0]
  );
};

const PageTextContainer = styled("div")<{ height: number; width: number }>`
  position: absolute;
  height: ${props => props.height + 'px'};
  width: ${props => props.width + 'px'};
`;


class AutoScaledText extends React.Component <
{fontName: string, transformMatrix: number[], width: number, ascent: number}> {
  divRef = React.createRef<HTMLDivElement>()
  state = {
    scaleX: 1,
    offsetY: 0
  }

  componentDidMount(){
    
    const domWidth = this.divRef.current.getBoundingClientRect()['width']

    const scaleX = this.props.width / domWidth
    
    this.setState({scaleX})
  }

  render(){
    const {fontName, transformMatrix} = this.props
    console.log(transformMatrix)
    return (<div ref={this.divRef} 
      style={{
        fontFamily: `${fontName}, sans-serif`,
        fontSize: '1px',
        position: 'absolute',
        transform: `matrix(${transformMatrix.join(",")}) scaleX(${this.state.scaleX}) translateY(${(1 - this.props.ascent) * 100}%)`,
        transformOrigin: 'left bottom',
      }}>{this.props.children}</div>)
  }
  

}

const PageTextDefaults = {
  props: {
    text: undefined as TextItem[]
    width: 0,
    height: 0,
    scale: 0
  },
  state: {}
};

export class PageText extends React.PureComponent<
  typeof PageTextDefaults.props,
  typeof PageTextDefaults.state
> {
  static defaultProps = PageTextDefaults.props;
  state = PageTextDefaults.state;
  render() {
    console.log(this.props)
    return <PageTextContainer width={this.props.width} height={this.props.height}>
     {this.props.text.map((textItem,i) => {
     return (<AutoScaledText
     key={i}
     fontName={textItem.fontName}
     width={textItem.width * this.props.scale}
     transformMatrix={textItem.viewportAlignedTrans}
     ascent={textItem.style.ascent}
      >
        {
textItem.str
        }
      </AutoScaledText>)
    
    })}
    </PageTextContainer>;
  }
}
