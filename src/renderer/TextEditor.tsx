import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import Downshift from "downshift";
import { getSelectionRange, inFirstNotSecondArray } from "./utils";
import { getWordAtCursor, onSlash } from "./EditorUtils";
import { oc } from "ts-optchain";
import { iDispatch, iRootState } from "../store/createStore";
import { connect } from "react-redux";
import { htmlSerializer } from "./htmlSerializer";
import {
  NodeDataTypes,
  UserHtml,
  makeUserHtml,
  makeLink
} from "../store/creators";

import { Portal } from "./Portal";
const schema = {
  inlines: {
    graph: {
      isVoid: true
    }
  }
};
/**
 * @class **TextEditor**
 * todo: currectly ONLY ONE INSTANCE WITH ID="" ALLOWED
 */
const TextEditorDefaults = {
  props: {
    nodesOrLinks: "nodes" as "nodes" | "links",
    id: "",
    readOnly: false,
    width: 500,
    height: 500
  },
  state: {
    editorValue: Plain.deserialize("") as Editor["value"],
    wordAtCursor: "",
    hasError: false,
    portalStyle: { left: -1, top: -1, width: -1, height: -1 },
    showAutoComplete: false,
    htmlNodes: []
  }
};
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

class TextEditor extends React.Component<
  typeof TextEditorDefaults.props & Partial<connectedProps>,
  typeof TextEditorDefaults.state
> {
  static defaultProps = TextEditorDefaults.props;
  state = TextEditorDefaults.state;
  containerRef = React.createRef<HTMLDivElement>();

  editor: Editor;
  ref = editor => {
    this.editor = editor;
  };

  initHtml = () => {
    const { id, nodesOrLinks } = this.props;
    if (this.props.id.length > 0) {
      //@ts-ignore
      const html = oc(this.props)[nodesOrLinks][id].data.html("<p></p>");
      const editorValue = htmlSerializer.deserialize(html);
      this.setState({ editorValue });
    }
  };

  componentDidMount() {
    setTimeout(()=> {this.editor.focus()}, 50) // thanks random github user
    this.initHtml();
  }

  static getDerivedStateFromProps(props, state) {
    // todo perf patch
    let userHtml: UserHtml[];
    if (props.nodes) {
      //@ts-ignore
      userHtml = (Object.values(props.nodes) as aNode).filter(
        node =>
          node.data.type === ("userHtml" as NodeDataTypes) &&
          node.id !== props.id
      );
      userHtml = userHtml.filter(t => t.data.text.includes(state.wordAtCursor));
    }

    const showAutoComplete =
      state.wordAtCursor.length > 1 && !props.readOnly && userHtml.length > 0;
    return { htmlNodes: userHtml, showAutoComplete };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.initHtml();
      if (this.props.id === "")
        this.setState({ editorValue: Plain.deserialize("") });
    }
    const { id } = this.props;
    if (prevProps.patches !== this.props.patches) {
      const relevantPatch = this.props.patches.find(p => p.path.includes(id));
      if (!!relevantPatch) {
        // @ts-ignore
        const newHtml = oc(relevantPatch).value.data.html("");
        const { html } = this.serialize(this.state.editorValue);

        if (newHtml !== html) {
          const editorValue = htmlSerializer.deserialize(newHtml);
          this.setState({ editorValue });
        }
      }
    }
  }

  getCurrentWord = editor => {
    const anchorOffset = editor.value.selection.getIn(["anchor", "offset"]);
    //@ts-ignore
    const anchorText = oc(editor.value.anchorText).text("");
    const { text, isAfterSpace, isEndOfWord } = getWordAtCursor(
      anchorText,
      anchorOffset
    );
    if (!isEndOfWord) {
      this.setState({ wordAtCursor: "" });
    } else {
      this.setState({ wordAtCursor: text });
    }
  };

  serialize = editorValue => {
    const html = htmlSerializer.serialize(editorValue);
    // const jsFromHtml = htmlSerializer.deserialize(html);
    // const andBack = htmlSerializer.serialize(jsFromHtml);
    // const js = this.state.editorValue.toJS();
    const text = Plain.serialize(editorValue);
    return { html, text };
  };

  save = () => {
    const graphInlines = this.editor.value.document.getInlinesByType("graph");
    //@ts-ignore
    const idsToLink = graphInlines.toJS().map(n => oc(n).data.id());

    //
    const linksBetween = Object.values(this.props.links).filter(link => {
      return (
        link.target === this.props.id && link.data.html === "<p>usedIn</p>"
      );
    });

    const staleNodeIds = inFirstNotSecondArray([
      linksBetween.map(link => link.source),
      // so source should be a node id
      idsToLink
    ]);

    const linksToDel = linksBetween
      .filter(link => staleNodeIds.includes(link.source))
      .map(link => link.id);

    if (linksToDel.length > 0) this.props.removeBatch({ links: linksToDel });

    const serialized = this.serialize(this.state.editorValue);

    // if (serialized.text.length === 0) return;
    let currentNode;

    if (this.props.id.length === 0) {
      currentNode = makeUserHtml({
        data: serialized,
        style: {
          // todo use scroll position in boxmap
          left: 200 + Math.random() * 200,
          top: 200 + Math.random() * 200
        }
      });
    } else {
      currentNode = this.props.nodes[this.props.id];
    }

    if (this.props.id.length === 0) {
      this.props.addBatch({ nodes: [currentNode] });
      this.editor
        .moveToRangeOfDocument()
        .insertBlock("")
        .deleteBackward(1);
      this.setState({ editorValue: this.editor.value });
    } else if (
      !!currentNode && !!currentNode.id &&
      (this.props.nodes[currentNode.id] as UserHtml).data.html !==
      serialized.html
    ) {
      this.props.updateBatch({
        nodes: [{ id: currentNode.id, data: { ...serialized } }]
      });
      // this.props.addBatch({ links: newLinks });
    }
  };

  // Double function / curryin
  onKeyDown = getInputProps => (event, editor, next) => {
    event.ctrlKey, event.key;
    const isCrtlEnter =
      event.key !== "Control" && event.ctrlKey && event.key === "Enter";

    const isAutoCompleteCmd = ["ArrowUp", "ArrowDown", "Enter"].includes(
      event.key
    );

    // if (event.key === "Backspace" || event.key === "Delete") {
    //   console.log("delete links");
    // }

    if (event.key === "Tab") {
      event.preventDefault();
      editor.insertText("\t");
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.setState({ wordAtCursor: "" });
    }

    if (isAutoCompleteCmd && this.state.showAutoComplete) {
      // todo maybe use this to portal
      const { onKeyDown } = getInputProps();
      event.preventDefault();  //inter-tab can do weird things 
      onKeyDown(event);
      return null; // prevents return/tab happening. other keys dont need
    }

    if (event.key === "a") {
      const { selection } = getSelectionRange();
      const text = selection.toString().trim();
    }

    switch (event.key) {
      case "/":
        const isSlashCmd = onSlash(event, editor, next);
        console.log("is slash cmd", isSlashCmd);
        return next();

      default:
        return next();
    }

    return next();
  };

  getTextNodes = (inputText = "") => {
    if (this.props.nodes) {
      //@ts-ignore
      const userHtml: UserHtml[] = Object.values(this.props.nodes).filter(
        node => node.data.type === ("userHtml" as NodeDataTypes)
      );
      return userHtml.filter(t => t.data.text.includes(inputText));
    }
    return [];
  };

  onChange = change => {
    this.setState({ editorValue: change.value });
    this.getCurrentWord(change);
  };

  wrapWithGraphNode = (node: UserHtml) => {
    try {
      const text = oc(node).data.text();
      if (text) {
        const { id } = node;

        this.editor
          .moveAnchorBackward(this.state.wordAtCursor.length)
          .insertText(text)
          .moveAnchorBackward(text.length)
          .wrapInline({
            type: "graph",
            data: {
              id,
              isNode: true
            }
          })
          .moveAnchorForward(text.length)
          .focus();

        const ix = Object.values(this.props.links).findIndex(link => {
          return link.source === id && link.target === this.props.id;
        });

        if (ix === -1) {
          const newLink = makeLink(id, this.props.id, {
            // todo put "<p>usedIn</p>" in creators
            html: "<p>usedIn</p>"
          });

          this.props.addBatch({ links: [newLink] });
        }

        this.setState({ editorValue: this.editor.value });
      }
    } catch (err) {
      debugger;
    }
  };

  onMouseOut = e => {
    this.save();
    this.setState({
      portalStyle: TextEditorDefaults.state.portalStyle,
      wordAtCursor: "",
      showAutoComplete: false
    });
  };

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.error(error, info);
  }

  // saveOnMouseLeave = (e) => {
  //   this.save();
  // }

  getPortalStyle = e => {
    const {
      left,
      top,
      width,
      height
    } = e.currentTarget.getBoundingClientRect();

    const {
      // doesn't include scroll bars
      clientHeight,
      clientWidth
    } = document.documentElement;
    const spaceAbove = top;
    const spaceBellow = clientHeight - (top + height);

    const moreSpaceDown = spaceBellow > spaceAbove;
    const portalHeight = 150;
    let portalStyle;
    if (moreSpaceDown) {
      portalStyle = {
        left: left - 12,
        top: top + this.props.height - 4,
        height: portalHeight,
        width: this.props.width + 26
      };
    } else {
      portalStyle = {
        left: left - 12,
        top: top - portalHeight - 2,
        height: portalHeight,
        width: this.props.width + 26
      };
    }

    this.setState({ portalStyle });
  };

  onFocus = e => {
    //@ts-ignore
    const allowId = oc(e).currentTarget.id("") === "slate-container"; //todo unmagic string
    if (allowId) {
      this.getPortalStyle(e);
    }
  };

  componentWillUnmount(){
    this.save()
  }
  render() {
    if (this.state.hasError) debugger;
    const { wordAtCursor } = this.state;

    // todo redux -> nodes text+titles -> filter + scroll to
    // todo autocomplete for segment text
    return (
      <Downshift  // "React render prop" - pattern  https://github.com/downshift-js/downshift
      // manages the pop-up, that comes up for auto-complete 
        key="downshift"
        itemToString={item => (item ? item.data.text : "")}
        isOpen={this.state.showAutoComplete}
        onStateChange={(
          { selectedItem, highlightedIndex },
          { setState, clearSelection }
        ) => {
          const { id } = this.state.htmlNodes[highlightedIndex] || {
            id: false
          };
          if (id) {
            this.props.toggleSelections({
              selectedNodes: [id],
              clearFirst: true
            });
          }

          if (!!selectedItem) {
            this.wrapWithGraphNode(selectedItem);
            clearSelection();
          }
        }}
        inputValue={wordAtCursor}
        // todo insert same option multiple times
        // onSelect={() => {
        // this will call wrapWithGraphNode twice
        //   if (autocompleteList.length === 1) {
        //     this.wrapWithGraphNode(autocompleteList[0]);
        //   }
        // }}
      >
        {downshift => {  // a variable to toggle. A child of a component Downshift managing variables, 
          // if (!downshift.isOpen) return null
          return (
            // <div>
            <div
              id={"slate-container"}
              ref={this.containerRef}
              onScroll={e => e.stopPropagation()}
              style={{
                maring: 3,
                height: this.props.height,
                width: this.props.width,
                overflowY: "auto",
                border: "1px solid lightgrey",
                position: "relative"
              }}
              onMouseLeave={this.onMouseOut}
              onMouseDown={this.onFocus}
            >
              <Editor
                autoFocus
                // id={"slate-" + this.props.id}
                readOnly={this.props.readOnly}
                ref={this.ref as any}
                spellCheck={false}
                onChange={this.onChange}
                value={this.state.editorValue}
                //   renderNode={renderNode({ userId, pubId })}
                onKeyDown={this.onKeyDown(downshift.getInputProps)}
                // onFocus={this.onFocus}
                // onBlur={e => this.save()}
                style={{
                  margin: 5,
                  height: "95%",
                  cursor: "text"
                }}
                renderNode={renderSlateNodes}
                schema={schema}
              />
              {this.state.showAutoComplete &&
                this.state.portalStyle.width > -1 && (
                  <Portal>
                    <div
                      style={{
                        ...this.state.portalStyle,
                        overflowY: "scroll",
                        marginTop: 2,
                        marginBottom: 2,
                        hidden: this.props.readOnly,
                        // display: 'inline-block',
                        position: "absolute",
                        backgroundColor: "white",
                        boxSizing: "border-box",
                        //   outline: "1px solid black",
                        boxShadow:
                          "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
                        zIndex: 2
                      }}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      {" "}
                      {this.state.htmlNodes.map((item, index) => (
                        <Button1
                          {...downshift.getItemProps({
                            key: item.id,
                            index,
                            item,
                            style: {
                              backgroundColor:
                                downshift.highlightedIndex === index
                                  ? "lightgreen"
                                  : null,
                              fontWeight:
                                downshift.selectedItem === item
                                  ? "bold"
                                  : "normal"
                            }
                          })}
                        >
                          {item.data.text}
                        </Button1>
                      ))}{" "}
                    </div>
                  </Portal>
                )}
              {/* <div
                style={{
                  height: 300,
                  width: this.props.width,
                  overflowY: "scroll",
                  marginTop: 2,
                  marginBottom: 2,
                  hidden: this.props.readOnly,
                  // display: 'inline-block',
                  top: "-150%",
                  left: "50%",
                  position: 'absolute',
                  backgroundColor: "blue",
                  zIndex: 2
                }}
              >
                {false &&
                  downshift.isOpen &&
                  autocompleteList.map((item, index) => (
                    <Button1
                      {...downshift.getItemProps({
                        key: item.id,
                        index,
                        item,
                        style: {
                          backgroundColor:
                            downshift.highlightedIndex === index
                              ? "lightgreen"
                              : null,
                          fontWeight:
                            downshift.selectedItem === item ? "bold" : "normal"
                        }
                      })}
                    >
                      {item.data.text}
                    </Button1>
                  ))}
              </div> */}
            </div>
          );
        }}
      </Downshift>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(TextEditor);

export const renderSlateNodes = (props, _, next) => {
  // const { attributes, children, node, isFocused, editor, ...restProps } = props;
  const { attributes, children, node, isFocused } = props;

  let data = node.data.toJS();
  switch (node.type) {
    case "graph":
      return (
        <span
          {...attributes}
          data-graph-path={node.data.get("type")}
          data-graph-id={node.data.get("id")}
          style={{
            border: isFocused ? "1px solid blue" : "none",
            fontStyle: "italic"
          }}
          contentEditable={false}
        >
          {node.text}
        </span>
      ); //made with wrapinline in slateutils
    default:
      return next();
  }
};

const EditorContainer = styled.div`
  border: 1px solid black;
  border-radius: 5px;
  margin-top: 10px;
`;

const Button1 = styled.span`
  cursor: pointer;
  margin: 5px;
  padding: 5px;
  border: 2px solid black;
  border-radius: 5px;
  box-shadow: 0 2px 2px -2px rgba(0, 0, 0, 0.52);
  display: inline-flex;
`;
