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
import { NodeDataTypes, UserMediaText } from "../store/creators";
const schema = {
  inlines: {
    graph: {
      isVoid: true
    }
  }
};
/**
 * @class **TextEditor**
 */
const TextEditorDefaults = {
  props: {},
  state: {
    editorValue: Plain.deserialize("") as Editor["value"],
    wordAtCursor: ""
  }
};
const mapState = (state: iRootState) => ({
  pdfDir: state.app.current.pdfDir,
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes
});

const mapDispatch = ({
  graph: { addBatch, toggleSelections },
  app: { setCurrent }
}: iDispatch) => ({ addBatch, setCurrent, toggleSelections });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

export class TextEditor extends React.Component<
  typeof TextEditorDefaults.props & connectedProps,
  typeof TextEditorDefaults.state
> {
  static defaultProps = TextEditorDefaults.props;
  state = TextEditorDefaults.state;
  containerRef = React.createRef<HTMLDivElement>();

  editor: Editor;
  ref = editor => {
    this.editor = editor;
  };

  componentDidMount() {
    // this.edito;
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

  onKeyDown = getInputProps => (event, editor, next) => {
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
      default:
        return next();
    }

    return next();
  };

  getTextNodes = (inputText = "") => {
    const userMediaText: UserMediaText[] = Object.values(
      this.props.nodes
    ).filter(node => node.data.type === ("userMedia.text" as NodeDataTypes));
    return userMediaText.filter(t => t.data.text.includes(inputText));
  };

  onChange = change => {
    this.setState({ editorValue: change.value });
    this.getCurrentWord(change);
  };

  wrapWithGraphNode = (node: UserMediaText) => {
    try {
      const text = oc(node).data.text();
      if (text) {
        console.log(text, this.state.wordAtCursor);

        const { id } = node;

        this.editor
          .moveAnchorBackward(this.state.wordAtCursor.length)
          .insertText(text)
          .moveAnchorBackward(text.length)
          .wrapInline({
            type: "graph",
            data: {
              text,
              id,
              isNode: true,
              style: { fontWeight: "bold" }
            } //access with props.node.data.get('text')
          })
          .moveAnchorForward(text.length)
          .focus();
        this.setState({ editorValue: this.editor.value });
      }
    } catch (err) {
      debugger;
    }
  };

  render() {
    const { wordAtCursor } = this.state;
    const autocompleteList = this.getTextNodes(this.state.wordAtCursor);
    console.log(this.state.editorValue.toJS());

    // todo redux -> nodes text+titles -> filter + scroll to
    // todo autocomplete for segment text
    return (
      <EditorContainer
        ref={this.containerRef}
        // onScroll={this.setRange}
      >
        <Downshift
          itemToString={item => (item ? item.data.text : "")}
          isOpen={true}
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
        >
          {downshift => {
            return (
              <div>
                <div style={{ border: "1px solid lightgrey", margin: 10 }}>
                  <Editor
                    autoFocus
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
                    height: "8vh",
                    overflowY: "scroll",
                    marginTop: 2,
                    marginBottom: 2
                  }}
                >
                  {autocompleteList.map((item, index) => (
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
            ...node.data.get("style"),
            border: isFocused ? "1px solid blue" : "none"
          }}
          contentEditable={false}
        > {node.data.get('text')} </span>
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
