import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import Downshift from "downshift";
import { getSelectionRange } from "./utils";
import { getWordAtCursor, onSlash } from "./TextEditorUtils";
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
    readOnly: false
  },
  state: {
    editorValue: Plain.deserialize("") as Editor["value"],
    wordAtCursor: "",
    hasError: false
  }
};
const mapState = (state: iRootState) => ({
  pdfDir: state.app.current.pdfDir,
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes,
  links: state.graph.links
});

const mapDispatch = ({
  graph: { addBatch, toggleSelections, updateBatch },
  app: { setCurrent }
}: iDispatch) => ({ addBatch, setCurrent, toggleSelections, updateBatch });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

export class TextEditor extends React.Component<
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
      const html = oc(this.props[nodesOrLinks][id]).data.html("<p></p>");
      const editorValue = htmlSerializer.deserialize(html);
      console.log(editorValue.toJS());
      this.setState({ editorValue });
    }
  };

  componentDidMount() {
    this.initHtml();
  }

  componentWillUnmount() {
      this.save();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.initHtml();
      if (this.props.id === "")
        this.setState({ editorValue: Plain.deserialize("") });
    }
  }

  getCurrentWord = editor => {
    const anchorOffset = editor.value.selection.getIn(["anchor", "offset"]);
    const anchorText = oc(editor.value.anchorText).text("");
    const { text, isAfterSpace, isEndOfWord } = getWordAtCursor(
      anchorText,
      anchorOffset
    );
    if (isAfterSpace) {
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
    const idsToLink = graphInlines.toJS().map(n => oc(n).data.id());
    const serialized = this.serialize(this.state.editorValue);
    if (serialized.text.length === 0) return;
    let currentNode;

    if (this.props.id.length === 0) {
      currentNode = makeUserHtml(serialized, {
        // todo use scroll position in boxmap
        x: 200 + Math.random() * 200,
        y: 200 + Math.random() * 200
      });
    } else {
      currentNode = this.props.nodes[this.props.id];
    }

    // have the links been created?
    let newLinks = [];
    for (let sourceId of idsToLink.filter(x => x !== currentNode.id)) {
      const ix = Object.values(this.props.links).findIndex(link => {
        return (
          link.source === sourceId &&
          link.target === currentNode.id &&
          link.data.type === "partOf"
        );
      });

      if (ix === -1) {
        const newLink = makeLink(this.props.nodes[sourceId], currentNode, {
          type: "partOf"
        });
        newLinks.push(newLink);
      }
    }

    if (this.props.id.length === 0) {
      this.props.addBatch({ nodes: [currentNode], links: newLinks });
      this.editor
        .moveToRangeOfDocument()
        .insertBlock("")
        .deleteBackward(1);
      this.setState({ editorValue: this.editor.value });
    } else {
      this.props.updateBatch({
        nodes: [{ id: currentNode.id, data: { ...serialized } }]
      });
    }
  };

  onKeyDown = getInputProps => (event, editor, next) => {
    event.ctrlKey, event.key;
    if (event.key !== "Control" && event.ctrlKey && event.key === "Enter") {
      this.save();
      // console.log("make a new node");
      // const graphInlines = this.editor.value.document.getInlinesByType("graph");
      // const idsToLink = graphInlines.toJS().map(n => oc(n).data.id());
      // const serialized = this.serialize(this.state.editorValue);
      // let currentNode;

      // if (this.props.id.length === 0) {
      //   currentNode = makeUserHtml(serialized, {
      //     // todo use scroll position in boxmap
      //     x: 200 + Math.random() * 200,
      //     y: 200 + Math.random() * 200
      //   });
      // } else {
      //   currentNode = this.props.nodes[this.props.id];
      // }

      // // have the links been created?
      // let newLinks = [];
      // for (let sourceId of idsToLink.filter(x => x !== currentNode.id)) {
      //   const ix = Object.values(this.props.links).findIndex(link => {
      //     return (
      //       link.source === sourceId &&
      //       link.target === currentNode.id &&
      //       link.data.type === "partOf"
      //     );
      //   });

      //   if (ix === -1) {
      //     const newLink = makeLink(this.props.nodes[sourceId], currentNode, {
      //       type: "partOf"
      //     });
      //     newLinks.push(newLink);
      //   }
      // }

      // if (this.props.id.length === 0) {
      //   this.props.addBatch({ nodes: [currentNode], links: newLinks });
      //   this.editor
      //     .moveToRangeOfDocument()
      //     .insertBlock("")
      //     .deleteBackward(1);
      //   this.setState({ editorValue: this.editor.value });
      // } else {
      //   this.props.updateBatch({
      //     nodes: [{ id: currentNode.id, data: { ...serialized } }]
      //   });
      // }
    }

    const isAutoCompleteCmd = ["ArrowUp", "ArrowDown", "Enter"].includes(
      event.key
    );

    if (isAutoCompleteCmd) {
      const { onKeyDown } = getInputProps();
      event.preventDefault();
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
      case "return":
        console.log("enter");

      default:
        return next();
    }

    return next();
  };

  getTextNodes = (inputText = "") => {
    const userHtml: UserHtml[] = Object.values(this.props.nodes).filter(
      node => node.data.type === ("userHtml" as NodeDataTypes)
    );
    return userHtml.filter(t => t.data.text.includes(inputText));
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
        this.setState({ editorValue: this.editor.value });
      }
    } catch (err) {
      debugger;
    }
  };

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.error(error, info);
  }

  // saveOnMouseLeave = (id) => {
  //   this.props.updateBatch({
  //     nodes: [{ id: currentNode.id, data: { ...serialized } }]
  //   });

  // }

  render() {
    if (this.state.hasError) debugger;
    const { wordAtCursor } = this.state;
    const autocompleteList = this.getTextNodes(this.state.wordAtCursor);

    // todo redux -> nodes text+titles -> filter + scroll to
    // todo autocomplete for segment text
    return (
      <EditorContainer
        ref={this.containerRef}
        onMouseLeave={e => this.save()}

        // onScroll={this.setRange}
      >
        <Downshift
          itemToString={item => (item ? item.data.text : "")}
          isOpen={wordAtCursor.length > 1 && !this.props.readOnly}
          onStateChange={({ selectedItem, highlightedIndex }, { setState }) => {
            const { id } = autocompleteList[highlightedIndex] || { id: false };
            if (id) {
              this.props.toggleSelections({
                selectedNodes: [id],
                clearFirst: true
              });
            }

            if (!!selectedItem) {
              this.wrapWithGraphNode(selectedItem);
            }
          }}
          inputValue={wordAtCursor}
          onSelect={() => {
            if (autocompleteList.length === 1) {
              this.wrapWithGraphNode(autocompleteList[0]);
            }
          }}
        >
          {downshift => {
            return (
              <div>
                <div style={{ border: "1px solid lightgrey", margin: 10 }}>
                  <Editor
                    readOnly={this.props.readOnly}
                    ref={this.ref as any}
                    spellCheck={false}
                    onChange={this.onChange}
                    value={this.state.editorValue}
                    //   renderNode={renderNode({ userId, pubId })}
                    onKeyDown={this.onKeyDown(downshift.getInputProps)}
                    //   onFocus={this.hideAutocomplete}
                    //   onBlur={this.hideAutocomplete}
                    style={{ padding: 5 }}
                    renderNode={renderSlateNodes}
                    schema={schema}
                  />
                </div>
                <div
                  style={{
                    height: this.props.id.length === 0 ? "8vh" : "100%",
                    overflowY: "scroll",
                    marginTop: 2,
                    marginBottom: 2,
                    hidden: this.props.readOnly
                  }}
                >
                  {downshift.isOpen &&
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
                              downshift.selectedItem === item
                                ? "bold"
                                : "normal"
                          }
                        })}
                      >
                        {item.data.text}
                      </Button1>
                    ))}
                </div>
              </div>
            );
          }}
        </Downshift>
      </EditorContainer>
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
  width: "auto";
  height: "auto";
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
