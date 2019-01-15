// import React, { PureComponent } from 'react';
// import PropTypes from 'prop-types';

// import PageContext from '../PageContext';

// import { isPage, isRotate } from '../shared/propTypes';
// import React, { PureComponent } from 'react';
// import PropTypes from 'prop-types';

// import PageContext from '../PageContext';

// import TextLayerItem from './TextLayerItem';

// import {
//   callIfDefined,
//   cancelRunningTask,
//   errorOnDev,
//   isCancelException,
//   makeCancellable,
// } from '../shared/utils';

// import { isPage, isRotate } from '../shared/propTypes';

// export class TextLayerInternal extends PureComponent {
//   state = {
//     textItems: null,
//   }

//   componentDidMount() {
//     const { page } = this.props;

//     if (!page) {
//       throw new Error('Attempted to load page text content, but no page was specified.');
//     }

//     this.loadTextItems();
//   }

//   componentDidUpdate(prevProps) {
//     const { page } = this.props;

//     if (prevProps.page && (page !== prevProps.page)) {
//       this.loadTextItems();
//     }
//   }

//   componentWillUnmount() {
//     cancelRunningTask(this.runningTask);
//   }

//   loadTextItems = async () => {
//     const { page } = this.props;

//     try {
//       const cancellable = makeCancellable(page.getTextContent());
//       this.runningTask = cancellable;
//       const { items: textItems } = await cancellable.promise;
//       this.setState({ textItems }, this.onLoadSuccess);
//     } catch (error) {
//       this.onLoadError(error);
//     }
//   }

//   onLoadSuccess = () => {
//     const { onGetTextSuccess } = this.props;
//     const { textItems } = this.state;

//     callIfDefined(
//       onGetTextSuccess,
//       textItems,
//     );
//   }

//   onLoadError = (error) => {
//     if (isCancelException(error)) {
//       return;
//     }

//     this.setState({ textItems: false });

//     errorOnDev(error);

//     const { onGetTextError } = this.props;

//     callIfDefined(
//       onGetTextError,
//       error,
//     );
//   }

//   get unrotatedViewport() {
//     const { page, scale } = this.props;

//     return page.getViewport(scale);
//   }

//   /**
//    * It might happen that the page is rotated by default. In such cases, we shouldn't rotate
//    * text content.
//    */
//   get rotate() {
//     const { page, rotate } = this.props;
//     return rotate - page.rotate;
//   }

//   renderTextItems() {
//     const { textItems } = this.state;

//     if (!textItems) {
//       return null;
//     }

//     return textItems.map((textItem, itemIndex) => (
//       <TextLayerItem
//         // eslint-disable-next-line react/no-array-index-key
//         key={itemIndex}
//         itemIndex={itemIndex}
//         {...textItem}
//       />
//     ));
//   }

//   render() {
//     const { unrotatedViewport: viewport, rotate } = this;

//     return (
//       <div
//         className="react-pdf__Page__textContent"
//         style={{
//           position: 'absolute',
//           top: '50%',
//           left: '50%',
//           width: `${viewport.width}px`,
//           height: `${viewport.height}px`,
//           color: 'transparent',
//           transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
//           pointerEvents: 'none',
//         }}
//       >
//         {this.renderTextItems()}
//       </div>
//     );
//   }
// }

// TextLayerInternal.propTypes = {
//   onGetTextError: PropTypes.func,
//   onGetTextSuccess: PropTypes.func,
//   page: isPage.isRequired,
//   rotate: isRotate,
//   scale: PropTypes.number,
// };

// const TextLayer = props => (
//   <PageContext.Consumer>
//     {context => <TextLayerInternal {...context} {...props} />}
//   </PageContext.Consumer>
// );
// export default TextLayer;

// export class TextLayerItemInternal extends PureComponent {
//   componentDidMount() {
//     this.alignTextItem();
//   }

//   componentDidUpdate() {
//     this.alignTextItem();
//   }

//   get unrotatedViewport() {
//     const { page, scale } = this.props;

//     return page.getViewport(scale);
//   }

//   /**
//    * It might happen that the page is rotated by default. In such cases, we shouldn't rotate
//    * text content.
//    */
//   get rotate() {
//     const { page, rotate } = this.props;
//     return rotate - page.rotate;
//   }

//   get sideways() {
//     const { rotate } = this;
//     return rotate % 180 !== 0;
//   }

//   get defaultSideways() {
//     const { rotation } = this.unrotatedViewport;
//     return rotation % 180 !== 0;
//   }

//   get fontSize() {
//     const { transform } = this.props;
//     const { defaultSideways } = this;
//     const [fontHeightPx, fontWidthPx] = transform;
//     return defaultSideways ? fontWidthPx : fontHeightPx;
//   }

//   get top() {
//     const { transform } = this.props;
//     const { unrotatedViewport: viewport, defaultSideways } = this;
//     const [/* fontHeightPx */, /* fontWidthPx */, offsetX, offsetY, x, y] = transform;
//     const [/* xMin */, yMin, /* xMax */, yMax] = viewport.viewBox;
//     return defaultSideways ? x + offsetX + yMin : yMax - (y + offsetY);
//   }

//   get left() {
//     const { transform } = this.props;
//     const { unrotatedViewport: viewport, defaultSideways } = this;
//     const [/* fontHeightPx */, /* fontWidthPx */, /* offsetX */, /* offsetY */, x, y] = transform;
//     const [xMin] = viewport.viewBox;
//     return defaultSideways ? y - xMin : x - xMin;
//   }

//   async getFontData(fontName) {
//     const { page } = this.props;

//     const font = await page.commonObjs.ensureObj(fontName);

//     return font.data;
//   }

//   async alignTextItem() {
//     const element = this.item;

//     if (!element) {
//       return;
//     }

//     element.style.transform = '';

//     const { fontName, scale, width } = this.props;

//     const fontData = await this.getFontData(fontName);

//     const fallbackFontName = fontData ? fontData.fallbackName : 'sans-serif';
//     element.style.fontFamily = `${fontName}, ${fallbackFontName}`;

//     const targetWidth = width * scale;
//     const actualWidth = this.getElementWidth(element);

//     const ascent = fontData ? fontData.ascent : 1;

//     element.style.transform = `scaleX(${targetWidth / actualWidth}) translateY(${(1 - ascent) * 100}%)`;
//   }

//   getElementWidth = (element) => {
//     const { sideways } = this;
//     return element.getBoundingClientRect()[sideways ? 'height' : 'width'];
//   };

//   render() {
//     const { fontSize, top, left } = this;
//     const { customTextRenderer, scale, str: text } = this.props;

//     return (
//       <div
//         style={{
//           height: '1em',
//           fontFamily: 'sans-serif',
//           fontSize: `${fontSize * scale}px`,
//           position: 'absolute',
//           top: `${top * scale}px`,
//           left: `${left * scale}px`,
//           transformOrigin: 'left bottom',
//           whiteSpace: 'pre',
//           pointerEvents: 'all',
//         }}
//         ref={(ref) => { this.item = ref; }}
//       >
//         {
//           customTextRenderer
//             ? customTextRenderer(this.props)
//             : text
//         }
//       </div>
//     );
//   }
// }

// TextLayerItemInternal.propTypes = {
//   customTextRenderer: PropTypes.func,
//   fontName: PropTypes.string.isRequired,
//   itemIndex: PropTypes.number.isRequired, // eslint-disable-line react/no-unused-prop-types
//   page: isPage.isRequired,
//   rotate: isRotate,
//   scale: PropTypes.number,
//   str: PropTypes.string.isRequired,
//   transform: PropTypes.arrayOf(PropTypes.number).isRequired,
//   width: PropTypes.number.isRequired,
// };

// const TextLayerItem = props => (
//   <PageContext.Consumer>
//     {context => <TextLayerItemInternal {...context} {...props} />}
//   </PageContext.Consumer>
// );
// export default TextLayerItem;