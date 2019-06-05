/**
 * SynthesisEditor.tsx is the Grammarly-styled augmented writing interface
 */
// libs
import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import convertBase64 from "slate-base64-serializer";

import { Display } from './CardSlider'
import { oc } from "ts-optchain";
import Lists from "@convertkit/slate-lists";
import Keymap from "@convertkit/slate-keymap";
import { Grommet, Grid, Box, Text, CheckBox } from 'grommet'
import { SlateRichTextEditor } from './SlateRichTextEditorNew'
import { grommet } from 'grommet/themes'
import { normalizeColor, deepMerge } from 'grommet/utils'
import {
  Transition,
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group'
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListNumbered,
  MdFormatListBulleted,
  MdDeleteForever,
  MdArrowUpward
} from "react-icons/md";
import { connect } from "react-redux";
import { Block } from 'slate'

// custom
import { getWordAtCursor, initKeySafeSlate } from "./EditorUtils";
import {
  getSelectionRange,
  inFirstNotSecondArray,
  get,
  getBoxEdges,
  getEdgeDiffs,
  moreSpaceIs,
  getClientBox,
  getElementBox,
  NestedPartial
} from "./utils";
import { iDispatch, iRootState } from "../store/createStore";
// import { htmlSerializer } from "./htmlSerializer";
import { NodeDataTypes, makeLink, UserDoc } from "../store/creators";
import { Portal } from "./Portal";

import { css } from 'styled-components'
const checkboxCheckStyle = css`
  background-color: #e03a3e;
  border-color: #e03a3e;
`

const customToggleTheme = {
  global: {
    colors: {
      'toggle-bg': '#6C6C6C',
      'toggle-knob': 'white',
    },
  },
  checkBox: {
    border: {
      color: {
        light: 'toggle-bg',
      },
    },
    color: {
      light: 'toggle-knob',
    },
    check: {
      radius: '2px',
    },
    hover: {
      border: {
        color: undefined,
      },
    },
    toggle: {
      background: 'toggle-bg',
      color: {
        light: 'toggle-knob',
      },
      size: '36px',
      knob: {
        extend: `
            top: -4px;
            box-shadow: 0px 0px 2px 0px rgba(0,0,0,0.12), 0px 2px 2px 0px rgba(0,0,0,0.24);
          `,
      },
      extend: ({ checked }) => `
          height: 14px;
          ${checked && checkboxCheckStyle}
        `,
    },
    gap: 'xsmall',
    size: '18px',
  },
}


/**
 * @class **DocEditor**
 */

const mapState = (state: iRootState) => ({
  pdfDir: state.app.panels.mainPdfReader.pdfDir,
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes,
  links: state.graph.links,
  patches: state.graph.patches
});

const mapDispatch = ({
  graph: { addBatch, toggleSelections, updateBatch, removeBatch },
  app: { setCurrent }
}: iDispatch) => ({
  addBatch,
  setCurrent,
  toggleSelections,
  updateBatch,
  removeBatch
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

const SynthesisEditorDefaults = { // TODO: understand these feature toggle
  props: {
    readOnly: false,
    id: "",
    nodesOrLinks: "nodes",
    autoCompThresh: 140 // n chars
  },
  state: {
    sidebar: false,
    editorSelectedValue: null,
    numOfX: 3,
    contextMapping: null,
    editorValue: null,
    infoCards: null,
    // numOfX: 3,
    // sidebar: true,
    // editorValue: initKeySafeSlate(),
    wordAtCursor: "",
    isActive: false,
    showMenu: false,
    showAutoComplete: false,
    fontSize: 26,
    useTextForAutocomplete: true,
    docFeatures: { hasList: false, nChars: 0 },
    autoCompDocs: [] as UserDoc[],
    selectionBbox: {
      // todo remove
      left: -1,
      top: -1,
      bottom: -1,
      right: -1,
      width: -1,
      height: -1
    },
    portalStyle: {
      transform: `translate(0px, 0px)`,
      width: "40ch",
      maxHeight: 400,
      padding: 5,
      opacity: 1
    },
    menuStyle: {
      transform: `translate(0px, 0px)`,
      maxHeight: 50
    }
  }
};


/**
 * 
 *  This is where SlateRichTextEditor definition starts
 */


// import { LinkPlugin, LinkButton } from '@slate-editor/link-plugin'

const initialValue = require('../store/value.json') // TODO: pre-load Joel's outline
import { isKeyHotkey } from 'is-hotkey'
import {Value} from 'slate'
const DEFAULT_NODE = 'paragraph'

const isBoldHotkey = isKeyHotkey('mod+b') // Mac users shall press cmd + b
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotkey = isKeyHotkey('mod+`')
const isRecontextualize = isKeyHotkey('mod+r')

// const plugins = [LinkPlugin()]

/**
 * The rich text example. from https://github.com/ianstormtaylor/slate/tree/master/examples/rich-text
 *
 * @type {Component}
 */


type SlateTypes =
  | "bold"
  | "italics"
  | "underline"
  | "ordered-list"
  | "unordered-list"
  | "list-item-child"
  | "list-item"
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "heading-three"
  | "block-quote"
  | "bulleted-list"
  | "numbered-list"

export const Icon = styled(({ className, ...rest }) => {
  return <span className={`material-icons ${className}`} {...rest} />
})`
  font-size: 30px;
  vertical-align: text-bottom;
`

export const Menu = styled('div')`
  & > * {
    display: inline-block;
  }
  & > * + * {
    margin-left: 15px;
  }
`

export const Toolbar = styled(Menu)`
  position: relative;
  padding: 1px 18px 17px;
  margin: 0 -20px;
  border-bottom: 2px solid #eee;
  margin-bottom: 20px;
`

export class RealisticEditor extends React.Component<
  typeof SynthesisEditorDefaults.props & connectedProps,
  typeof SynthesisEditorDefaults.state
  > {
  static defaultProps = SynthesisEditorDefaults.props;

  // TODO: understand the props and states logic (may + redux)
  state = SynthesisEditorDefaults.state;
  editor: Editor;
  editorRef = React.createRef<HTMLDivElement>(); //createRef() //createRef<HTMLDivElement>();
  outerContainer = React.createRef<HTMLDivElement>();
  portalDiv = React.createRef<HTMLDivElement>();
  menu = React.createRef<HTMLDivElement>();

  ref = editor => {
    this.editor = editor;
  };

  mapping = require('../store/mapping.json') //Fake data
  // infoCards:any = null

  graph = require('../store/state.json')
  claim2Context = null


  // TODO: 051419 by Xin get realistic state.json data to render/suggest.
  static getDerivedStateFromProps(props, state) {
    // todo perf patch
    // let autoCompDocs: UserDoc[];
    // const checkForAutoCompDocs =
    //   state.wordAtCursor.length > 1 && !props.readOnly && props.nodes;

    // if (checkForAutoCompDocs) {
    //   //@ts-ignore
    //   autoCompDocs = (Object.values(props.nodes) as aNode).filter(
    //     node =>
    //       node.data.type === ("userDoc" as NodeDataTypes) &&
    //       node.id !== props.id &&
    //       node.data.useTextForAutocomplete
    //   );
    //   if (state.wordAtCursor !== "") {
    //     // todo could do fuzzy matching here
    //     autoCompDocs = autoCompDocs.filter(t => {
    //       return (
    //         t.data.text.includes(state.wordAtCursor) &&
    //         t.data.text.trim() !== state.wordAtCursor.trim()
    //       );
    //     });
    //   } else {
    //     autoCompDocs = [];
    //   }
    // }

    // const showAutoComplete = checkForAutoCompDocs && autoCompDocs.length > 0;

    // if (showAutoComplete && !state.showAutoComplete) {
    //   return { autoCompDocs, showAutoComplete: true };
    // } else if (!showAutoComplete && state.showAutoComplete) {
    //   return { showAutoComplete: false };
    // } else {
    //   return null;
    // }
  }


  /*
    fromClaimToContext() associates claim to the context
  */

  fromClaimToContext() {
    // Claim is the target, context is the source
    const links = this.graph['graph']['links']
    let claimID2ContextID = Object()
    let claim2ClaimID = Object()
    let contextID2Context = Object()
    const flattenedClaims = [].concat.apply([], Object.values(this.mapping))

    for (const linkID in links) {
      let link = links[linkID]
      claimID2ContextID[link['target']] = link['source']
    }

    const nodes = this.graph['graph']['nodes']

    for (const nodeID in nodes) {
      let node = nodes[nodeID]

      if (node['data'] && node['data'].hasOwnProperty('text')) {
        if (flattenedClaims.includes(node['data']['text'])) {
          claim2ClaimID[node['data']['text']] = node['id']
        }
      } else if (
        node['style']['type'] === 'circle' &&
        node['style']['fill'] === 'blue'
      ) {
        contextID2Context[node['id']] = node
      }
    }

    let claim2Context = Object()
    for (const claim in claim2ClaimID) {
      const claimID = claim2ClaimID[claim]
      const contextID = claimID2ContextID[claimID]
      const context = contextID2Context[contextID]
      claim2Context[claim] = context
    }
    this.claim2Context = claim2Context
  }

  /*
  onHoverHighlightCurrentUserInput() is an example of 
  child to parent communication. 
  It changes infocard style (border color) when the child 
  SlateRichTextEditor passes value to it. 
*/

  onHoverHighlightCurrentUserInput = userInput => {
    // console.log('userInput is ' + userInput)
    const trimedUserInput = userInput.trim()

    if (
      this.refsCollection != null &&
      this.refsCollection.hasOwnProperty(trimedUserInput) &&
      this.refsCollection[trimedUserInput].current != null
    ) {
      // console.log(this.refsCollection[trimedUserInput])
      // console.log(this.refsCollection[trimedUserInput].current)
      this.refsCollection[trimedUserInput].current.setStyle()
    }
  }

  /*
      offHoverHighlightCurrentUserInput() is another example of 
      child to parent communication. 
      It resets infocard style (border color) when the child SlateRichTextEditor 
      passes signal to it. 
    */

  offHoverHighlightCurrentUserInput = userInput => {
    const trimedUserInput = userInput.trim()
    if (
      this.refsCollection != null &&
      this.refsCollection.hasOwnProperty(trimedUserInput) &&
      this.refsCollection[trimedUserInput].current != null
    ) {
      // console.log(this.refsCollection[trimedUserInput])
      this.refsCollection[trimedUserInput].current.resetStyle()
      // this.refsCollection[trimedUserInput].resetStyle()
    }
  }

  componentDidMount() {
    this.fromClaimToContext()
  }

  componentWillUnmount() {
    // this.save();
  }

  onUpdate(value, selected_or_whole) {
    // For sibling communication https://stackoverflow.com/questions/24147331/react-the-right-way-to-pass-form-element-state-to-sibling-parent-elements
    if (selected_or_whole === 1) {
      if (value.fragment.text.includes('[x]')) {
        this.setState({ editorSelectedValue: value.fragment.text })
      } else {
        this.setState({
          editorSelectedValue:
            ' o(╥﹏╥)o NO CONTEXT FOR THIS SELECTION (。_。)',
        })
      }
      this.setState({
        numOfX: (value.document.text.match(/\[x|x\]/g) || []).length,
      })
    }
    this.setState({ editorValue: value })
    // console.log("this.state.numOfX "+this.state.numOfX)
    this.getContextMapping(value)
  }

  updateContextMapping(currentContextMapping) {
    return (previousState, currentProps) => {
      return { ...previousState, contextMapping: currentContextMapping }
    }
  }

  getContextMapping(value: any) {
    let currentContextMapping: Object[] = []
    for (var i = 0; i < value.document.nodes.size; i++) {
      const node: Block = value.document.nodes.get(i)
      const toRecontextArray = node.text.match(/(.*?)(\[x\])+/g) //non-greedy match followed by [x] and its variant
      if (toRecontextArray != null && null != this.claim2Context) {
        for (var j = 0; j < toRecontextArray.length; j++) {
          const nodeText = toRecontextArray[j].replace(/\[x\]/g, '').trim()
          const mappingValue = this.mapping[nodeText]
          if (typeof mappingValue === 'string') {
            if (null != this.claim2Context[mappingValue]) {
              currentContextMapping.push({
                userInput: nodeText,
                similarClaim: [mappingValue],
                contextStruct: [this.claim2Context[mappingValue].data], //this.claim2Context[this.mapping[nodeText]].data.pdfDir.toString()
              })
            }
          } else if (Array.isArray(mappingValue)) {
            let similarClaims = []
            let contextStructs = []
            for (var k = 0; k < mappingValue.length; k++) {
              if (null != this.claim2Context[mappingValue[k]]) {
                similarClaims.push(mappingValue[k])
                contextStructs.push(this.claim2Context[mappingValue[k]].data)
              }
            }
            currentContextMapping.push({
              userInput: nodeText,
              similarClaim: similarClaims,
              contextStruct: contextStructs, //this.claim2Context[this.mapping[nodeText]].data.pdfDir.toString()
            })
          }
        }
      }
    }

    this.setState(this.updateContextMapping(currentContextMapping))

    // TODO: this is where to insert floating box hovering button
    if (null != this.editorRef && null != this.editorRef.current) {
      // this.editorRef.current.codeForFun() //This will be invoked whenever the code is on change!!
      // this.ref.current.codeForFun()
      // (this.editor as Editor).codeForFun()
    }

    // for (var i = 0; i < currentContextMapping.length; i++) {
    //   this.refsCollection[
    //     (currentContextMapping[i] as any).userInput
    //   ] = React.createRef()
    // }
  }

  refsCollection = {}

  render() {
    const { sidebar } = this.state
    //TODO: uncomment this!! 
    // this.refsCollection = {}

    const infoCardHeight = this.state.numOfX * 700 + 'px'

    // console.log(this.state.contextMapping)
    const listItems =
      this.state.contextMapping != null ? (
        this.state.contextMapping.map(
          (item, index) => {
            this.refsCollection[item.userInput.toString()] = React.createRef<HTMLDivElement>()
            // console.log(item.similarClaim)
            return (
              <CSSTransition
                in={true}
                appear={true}
                enter={true}
                timeout={2000}
                classNames="fade"
                // unmountOnExit
                key={'CSSTransition' + item.userInput.substring(0, 10)}
              >
                <div key={'Display' + item.userInput.substring(0, 10)}>
                  <Display
                    ref={this.refsCollection[item.userInput.toString()]}
                    // ref={display =>{
                    //   // console.log("Setting this display ref")
                    //   // console.log(typeof this.refsCollection[item.userInput.toString()])
                    //   this.refsCollection[item.userInput.toString()] = display
                    // }
                    // }
                    originalText={item.userInput}
                    contextStruct={item.contextStruct}
                    similarClaim={item.similarClaim}
                    displayKey={item.userInput}
                    key={item.userInput} //Must use a key value unique to the element from https://stackoverflow.com/questions/43642351/react-list-rendering-wrong-data-after-deleting-item.
                  />
                </div>
              </CSSTransition>
            )
          }
          // <div>{item.userInput}</div>
        )
      ) : (
        <div />
      )

    return (

      <Grommet full theme={deepMerge(grommet, customToggleTheme)}>
        Inside RealisticEditor
        <Grid
          fill
          rows={['auto', 'full']}
          //   columns={['auto', 'flex']}
          columns={['60%', '40%']} // how many layout each column occupies
          areas={[
            { name: 'header', start: [0, 0], end: [1, 0] },
            // { name: 'headertwo', start: [1, 0], end: [1, 0] },
            { name: 'main', start: [0, 1], end: [1, 1] },
            { name: 'sidebar', start: [1, 1], end: [1, 1] },
          ]}
        >
          <Box
            gridArea="header"
            direction="row"
            align="center"
            justify="between"
            pad={{ horizontal: 'medium', vertical: 'small' }}
            round="medium"
            height="xsmall"
          >
            <Text
              alignSelf="center"
              textAlign="center"
              weight="bold"
              color="#800020"
            >
              Synthesis interface
            </Text>
            <CheckBox
              toggle={true}
              label={
                <Text weight="bold" color="#800020">
                  Re-contextualize/De-contextualize
                </Text>
              }
              checked={this.state.sidebar}
              onChange={() => {
                this.setState({ sidebar: !this.state.sidebar })
              }}
            />
          </Box>

          <Box gridArea="main" pad="large" height="full">
            {/* TODO: change to another view  */}
            {/* To communicate btw siblings: https://stackoverflow.com/questions/24147331/react-the-right-way-to-pass-form-element-state-to-sibling-parent-elements */}
            <SlateRichTextEditor
              onUpdate={this.onUpdate.bind(this)}
              // ref={this.editorRef}

              // ref={this.ref as any}
              onHoverHighlightCurrentUserInput={
                this.onHoverHighlightCurrentUserInput
              }
              offHoverHighlightCurrentUserInput={
                this.offHoverHighlightCurrentUserInput
              }
            />
            {/* <Editor
              // id="editor"
              readOnly={this.props.readOnly}
              ref={this.ref as any}
              spellCheck={false}
              onChange={this.onChange}
              value={this.state.editorValue}
              plugins={plugins}
              style={{
                padding: 0,
                margin: 0,
                flex: 1,
                cursor: "text"
              }}
              renderMark={this.renderMark}
              renderNode={this.renderSlateNodes}
              // getInputProps makes arrow keys work for autocomp
              onKeyDown={this.onKeyDown(downshift.getInputProps)}
              schema={schema}
              // onBlur={this.save}
              /> */}
            {/* Somethin here */}
          </Box>

          {sidebar && (
            //   TODO: change the element css here and semantic too!!
            <Box gridArea="sidebar" pad="medium" height={infoCardHeight}>
              {/* Basically limitless height */}

              {listItems} 
              {/* Uncomment above line! */}

              {/* <InfoCards contextMapping={this.state.contextMapping} /> */}
              {/* <div>{this.state.contextMapping}</div> */}
            </Box>
          )}

        </Grid>
      </Grommet>
    );
  }
}

const PortalDiv = styled.div`
  left: 0px;
  top: 0px;
  position: absolute;
  background: #fafafa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  transition: box-shadow 100ms;
  &:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  }
  border-radius: 3px;
`;

import * as fuzzy from "fuzzy";
import console = require("console");

function fuzzyMatch(textToMatch, nodesWithText) {
  var results = fuzzy.filter(
    textToMatch.toLowerCase(),
    nodesWithText as any[],
    {
      pre: "<b>",
      post: "</b>",
      extract: function (el) {
        return el.data.text;
      }
    }
  );
  const toShow = results.map(el => ({
    html: el.string,
    ...el.original
  }));
  return toShow;
}

export default connect(
  mapState,
  mapDispatch
)(RealisticEditor);


// const _Button = styled.span<{ isActive: boolean; onMouseDown?}>``;
// export const Button = styled(_Button)`
//   cursor: pointer;
//   margin: 0px 5px;
//   padding: 0px;
//   color: ${props => (props.isActive ? "black" : "darkgrey")};
// `;

// export const Toolbar = styled(PortalDiv)`
//   flex: 0;
//   display: flex;
//   align-items: center;
//   position: absolute;
//   background: white;
//   padding: 8px;
// `;

