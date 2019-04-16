/**
 * DocEditor.tsx is the larger, more complex version of TextEditor.tsx
 */
// libs
import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import { oc } from "ts-optchain";
import Lists from "@convertkit/slate-lists";
import Keymap from "@convertkit/slate-keymap";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdLooksOne,
  MdLooksTwo,
  MdLooks3,
  MdFormatListNumbered,
  MdFormatListBulleted,
  MdSave,
  MdNoteAdd,
  MdDeleteForever,
  MdSettings,
  MdArrowUpward
} from "react-icons/md";
import Downshift from "downshift";
import { connect } from "react-redux";
import convertBase64 from "slate-base64-serializer";
// custom
import { getWordAtCursor } from "./EditorUtils";
import { getSelectionRange, inFirstNotSecondArray } from "./utils";
import { iDispatch, iRootState } from "../store/createStore";
import { UserDoc } from "../store/creators";
import { htmlSerializer } from "./htmlSerializer";
import { NodeDataTypes, makeLink, UserDoc } from "../store/creators";

// todo
/**
 * ?scenarios
 * --------
 *
 *
 *  * insert simple html (serve as thumbnails)
 *    - no lists
 *    - 40 char width (like vscode)
 *    - sentences of 8 words (~40 char) or less very easy to read; 11 words,
 *      easy; 14 words fairly easy; 17 words standard; 21 words fairly difficult; 25 words difficult and 29 words or more, very difficult.”
 *    - average tweet checked in below 50 characters.
 *
 *  * insert complex html
 *     - if any white space after 40 char # could link to alias
 *
 *
 *  *make a new node from within the editor
 *  - select text, hit button or key cmd
 *  - create node and link to current editor node
 *  - each listen becomes a node if not already
 *
 *  *typing quickly and maybe want autocomplete
 *  - show a subtle badge with auto complete summary, e.g. number of matches
 *  - ctrl-space to show matches
 *  - button to always show / show on cmd
 *
 * *autocomplete a node into an outline, and edit it's text for the first time:
 *  - create a copy that's a paraphrase
 *  - edit original and propagate changes, i.e. transpilation
 * edit again:
 *  - if copied edit the copy, else original. propagate.
 *
 * *edit outline heirarches quickly
 *  -  heirarchy aware updates with tab/tab-shift
 *
 * ?code quality
 * ------------
 * *one place for all this related slate stuff
 * wrap node functions + rendernodes + serialize + deserialize should go together
 *
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
  | "heading-three";
const defaultNode = "paragraph" as SlateTypes;

const marks = {
  bold: { type: "bold" as SlateTypes, cmd: "ctrl+b" },
  italic: { type: "italics" as SlateTypes, cmd: "ctrl+i" },
  underline: { type: "underline" as SlateTypes, cmd: "ctrl+u" }
};

// todo util
type listTypes = "ordered-list" | "unordered-list";
const checkListType = (editor, type: listTypes) => {
  if (!editor) return { isList: false, isType: false };
  const isList = editor.value.blocks.some(
    node => node.type === ("list-item-child" as SlateTypes)
  );

  const isType = editor.value.blocks.some(block => {
    return !!editor.value.document.getClosest(
      block.key,
      parent => parent.type === type
    );
  });
  return { isList, isType };
};

const toggleList = (editor, type: listTypes) => {
  const { isList, isType } = checkListType(editor, type);
  if (!isList) {
    editor.wrapList({ type });
  } else {
    editor.unwrapList();
    if (!isType) {
      editor.wrapList({
        type: type === "ordered-list" ? "ordered-list" : "unordered-list"
      });
    }
  }
};

const toggleBlock = (editor, type: SlateTypes): void => {
  const isActive = editor.value.blocks.some(node => node.type === type);
  const isType = editor.value.blocks.some(block => {
    return !!editor.value.document.getClosest(
      block.key,
      parent => parent.type === type
    );
  });
  const outerType = editor.value.blocks.map(block => {
    const closest = editor.value.document.getClosest(block.key, parent => true);
    return !!closest ? closest.toJS().type : "";
  });

  const isList = editor.value.blocks.some(
    node => node.type === ("list-item-child" as SlateTypes)
  );

  if (isList) return null;
  if (isType) {
    editor.unwrapBlock(type);
  } else {
    editor.wrapBlock(type);
  }
};

const plugins = [
  Lists({
    blocks: {
      ordered_list: "ordered-list" as SlateTypes,
      unordered_list: "unordered-list" as SlateTypes,
      list_item: "list-item" as SlateTypes
    },
    classNames: {
      ordered_list: "ordered-list",
      unordered_list: "unordered-list",
      list_item: "list-item"
    }
  }),
  Keymap({
    [marks.bold.cmd]: (event, editor) => editor.toggleMark(marks.bold.type),
    [marks.italic.cmd]: (event, editor) => editor.toggleMark(marks.italic.type),
    [marks.underline.cmd]: (event, editor) =>
      editor.toggleMark(marks.underline.type),
    // You can also pass a string and it will call the command with that name
    "shift+enter": "softBreak",
    "mod+l": (event, editor: Editor) => toggleList(editor, "unordered-list"),
    "mod+o": (event, editor: Editor) => toggleList(editor, "ordered-list"),
    "mod+1": (event, editor: Editor) => toggleBlock(editor, "heading-one"),
    "mod+2": (event, editor: Editor) => toggleBlock(editor, "heading-two"),
    "mod+3": (event, editor: Editor) => toggleBlock(editor, "heading-three"),
    "mod+/": (event, editor: Editor) => {
      console.log(
        editor.value.blocks.toJS().map(x => x.type),
        editor.value.inlines.toJS().map(x => x.type)
      );
    }
  })
];

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

const DocEditorDefaults = {
  props: {
    readOnly: false,
    id: "",
    nodesOrLinks: "nodes",
    autoCompThresh: 140 // n chars
  },
  state: {
    editorValue: Plain.deserialize("") as Editor["value"],
    wordAtCursor: "",
    fontSize: 16,
    useTextForAutocomplete: true,
    docFeatures: { hasList: false, nChars: 0 },
    autoCompDoc: [] as UserDoc[]
  }
};
export class DocEditor extends React.Component<
  typeof DocEditorDefaults.props & connectedProps,
  typeof DocEditorDefaults.state
> {
  static defaultProps = DocEditorDefaults.props;
  state = DocEditorDefaults.state;
  editor: Editor;
  ref = editor => {
    this.editor = editor;
  };

  static getDerivedStateFromProps(props, state) {
    // todo perf patch
    let autoCompDocs: UserDoc[];
    if (props.nodes) {
      //@ts-ignore
      autoCompDocs = (Object.values(props.nodes) as aNode).filter(
        node =>
          node.data.type === ("userDoc" as NodeDataTypes) &&
          node.id !== props.id &&
          node.data.useTextForAutocomplete
      );
      autoCompDocs = autoCompDocs.filter(t =>
        t.data.text.includes(state.wordAtCursor)
      );
    }

    const showAutoComplete =
      state.wordAtCursor.length > 1 &&
      !props.readOnly &&
      autoCompDocs.length > 0;
    if (
      autoCompDocs.length !== state.autoCompDoc.length ||
      showAutoComplete !== state.showAutoComplete
    ) {
      return { autoCompDocs, showAutoComplete };
    } else {
      return null;
    }
  }

  getCurrentBase64 = () => {
    const { id, nodesOrLinks } = this.props;
    return oc(this.props)[nodesOrLinks][id].data.base64();
  };

  initBase64 = () => {
    if (this.props.id.length > 0) {
      //@ts-ignore
      const base64 = this.getCurrentBase64();
      if (!!base64) {
        console.log("init----------");
        const editorValue = convertBase64.deserialize(base64);
        this.setState({ editorValue });
      }
    }
  };

  componentDidMount() {
    // setTimeout(() => {
    //   this.editor.focus();
    // }, 50); // thanks random github user
    this.initBase64();
  }

  serialize = editorValue => {
    const base64 = convertBase64.serialize(editorValue);
    const text = Plain.serialize(editorValue);
    return { base64, text };
  };

  getDocFeatures = (editor): { nChars; hasList } => {
    return editor.value.document.getBlocks().reduce(
      (all, b) => {
        all.nChars += b.text.trim().length;
        if (!all.hasList) all.hasList = b.type === "list-item-child";
        return all;
      },
      { nChars: 0, hasList: false }
    );
  };

  onChange = change => {
    const docFeatures = this.getDocFeatures(change);
    const useTextForAutocomplete =
      docFeatures.nChars > 0 &&
      docFeatures.nChars <= this.props.autoCompThresh &&
      !docFeatures.hasList;

    this.setState({
      editorValue: change.value,
      useTextForAutocomplete,
      docFeatures
    });
    this.getCurrentWord(change);
  };

  getCurrentWord = editor => {
    console.log('get word')

    const anchorOffset = editor.value.selection.getIn(["anchor", "offset"]);
    //@ts-ignore
    const anchorText = oc(editor.value.anchorText).text("");
    const { text, isAfterSpace, isEndOfWord } = getWordAtCursor(
      anchorText,
      anchorOffset
    );     
      console.log('end', isEndOfWord, 'after space', isAfterSpace, 'text', text)
      
    if (!isEndOfWord) {
      
      this.setState({ wordAtCursor: "" });
    } else {
      this.setState({ wordAtCursor: text });
    }
  };

  wrapWithGraphNode = (node: UserDoc) => {
    const text = oc(node).data.text();
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
  };

  hasMark = type => {
    const { editorValue } = this.state;
    return editorValue.activeMarks.some(mark => mark.type === type);
  };

  hasBlock = type => {
    const { editorValue } = this.state;
    return editorValue.blocks.some(node => node.type === type);
  };

  onClickMark = (event, type) => {
    event.preventDefault();
    this.editor.toggleMark(type);
  };

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case marks.bold.type:
        return <strong {...attributes}>{children}</strong>;
      case marks.italic.type:
        return <em {...attributes}>{children}</em>;
      case marks.underline.type:
        return <u {...attributes}>{children}</u>;
      default:
        return next();
    }
  };

  renderSlateNodes = (props, editor, next) => {
    const { attributes, children, node, isFocused } = props;
    let data = node.data.toJS();

    switch (node.type) {
      case "block-quote":
        return <blockquote {...attributes}>{children}</blockquote>;
      case "bulleted-list":
        return <ul {...attributes}>{children}</ul>;
      case "heading-one":
        return <h1 {...attributes}>{children}</h1>;
      case "heading-two":
        return <h2 {...attributes}>{children}</h2>;
      case "heading-three":
        return <h3 {...attributes}>{children}</h3>;
      case "list-item":
        return <li {...attributes}>{children}</li>;
      case "ordered-list":
        return <ol {...attributes}>{children}</ol>;
      case "unordered-list":
        return <ul {...attributes}>{children}</ul>;
      case "paragraph":
        return <div {...attributes}>{children}</div>;
      case "graph":
        return (
          <span
            {...attributes}
            // todo better names
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
        );
      default:
        return next();
    }
  };

  renderMarkButton = (type: SlateTypes, Icon: React.ReactNode, title = "") => {
    const isActive = this.state.editorValue.activeMarks.some(
      mark => mark.type === type
    );

    return (
      <Button
        key={title}
        title={title}
        isActive={isActive}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        {Icon}
      </Button>
    );
  };

  onClickBlock = (event, type) => {
    event.preventDefault();

    const { editor } = this;
    const { value } = editor;
    const { document } = value;
    editor.wrapBlock("heading-one");
  };

  renderListButton = (type: listTypes, Icon: React.ReactNode, title = "") => {
    const { isList, isType } = checkListType(this.editor, type);
    return (
      <Button
        key={title}
        title={title}
        isActive={isType}
        onMouseDown={event => toggleList(this.editor, type)}
      >
        {Icon}
      </Button>
    );
  };
  iconProps = { size: "25px", style: { verticalAlign: "middle" } };

  AutocompleteButton = () => {
    const { useTextForAutocomplete, docFeatures } = this.state;
    const thresh = this.props.autoCompThresh;
    const chars = docFeatures.nChars > thresh ? `> ${thresh} characters.` : "";
    const list = docFeatures.hasList ? "Has list." : "";

    const title = `${
      useTextForAutocomplete
        ? `Under ${thresh} chars. No lists. Will`
        : "Will not"
    } be used for autocomplete. ${chars} ${list}`;

    return (
      <Button key={"Will Auto"} title={title} isActive={useTextForAutocomplete}>
        <MdArrowUpward
          size={"25px"}
          style={{ verticalAlign: "middle", cursor: "help" }}
        />
      </Button>
    );
  };

  MakeButtons = () => {
    return [
      this.renderMarkButton(
        "bold",
        <MdFormatBold {...this.iconProps} />,
        marks.bold.cmd
      ),
      this.renderMarkButton(
        "italics",
        <MdFormatItalic {...this.iconProps} />,
        marks.italic.cmd
      ),
      this.renderMarkButton(
        "underline",
        <MdFormatUnderlined {...this.iconProps} />,
        marks.underline.cmd
      ),
      this.renderListButton(
        "ordered-list",
        <MdFormatListNumbered {...this.iconProps} />,
        "ctrl-o"
      ),
      this.renderListButton(
        "unordered-list",
        <MdFormatListBulleted {...this.iconProps} />,
        "ctrl-l"
      ),
      this.AutocompleteButton()
    ];
  };

  changeFontSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ fontSize: parseInt(e.target.value) });
  };

  onKeyDown = (event, editor, next) => {
    if (event.key === "Tab") {
      event.preventDefault();
      // editor.insertText("\t");
    }
    return next();
  };

  save = e => {
    if (e.target.id !== "EditorContainer") return null;

    const serialized = this.serialize(this.state.editorValue);
    if (serialized.base64 === this.getCurrentBase64()) return null;

    this.props.updateBatch({
      nodes: [
        {
          id: this.props.id,
          data: {
            ...serialized,
            useTextForAutocomplete: this.state.useTextForAutocomplete
          }
        }
      ]
    });
  };

  render() {
    const { wordAtCursor } = this.state;

    return (
      <OuterContainer>
        <Toolbar>
          {" "}
          {this.MakeButtons()}{" "}
          <FontSizeInput
            type="number"
            min={2}
            max={48}
            value={this.state.fontSize}
            onChange={this.changeFontSize}
            title="Base Font Size"
          />
        </Toolbar>
        <EditorContainer
          id="EditorContainer"
          fontSize={this.state.fontSize} //todo save
          onMouseOut={this.save}
        >
          <Editor
            readOnly={this.props.readOnly}
            ref={this.ref as any}
            spellCheck={false}
            onChange={this.onChange}
            value={this.state.editorValue}
            plugins={plugins}
            style={{ padding: 0, margin: 0, width: "100%", height: "100%" }}
            renderMark={this.renderMark}
            renderNode={this.renderSlateNodes}
            onKeyDown={this.onKeyDown}
          />
        </EditorContainer>
        {this.state.wordAtCursor}
        {/* {this.state.autoCompDocs.map(doc => {
          return (
            <span key={doc.id} style={{ fontSize: 16 }}>
              {doc.data.text}
            </span>
          );
        })} */}
      </OuterContainer>
    );
  }
}
import * as fuzzy from 'fuzzy';

function fuzzyMatch(textToMatch, nodesWithText) {
  var results = fuzzy.filter(textToMatch.toLowerCase(), nodesWithText as any[], {
    pre: '<b>',
    post: '</b>',
    extract: function(el) {
      return el.data.text;
    }
  });
  const toShow = results.map((el) => ({
    html: el.string,
    ...el.original
  }));
  return toShow;
}

export default connect(
  mapState,
  mapDispatch
)(DocEditor);

const _Button = styled.span<{ isActive: boolean; onMouseDown? }>``;
export const Button = styled(_Button)`
  cursor: pointer;
  margin: 0px 5px;
  padding: 0px;
  color: ${props => (props.isActive ? "black" : "darkgrey")};
`;

export const Toolbar = styled.div`
  flex: 0;
  border: 1px solid lightgrey;
  display: flex;
  align-items: center;
  border-bottom: none;
  padding: 10px;
  min-height: 50px;
`;

const OuterContainer = styled.div`
  margin: 0px 0px;
  flex: 1;
  border: 4px solid darkgrey;
  height: auto;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
`;

const FontSizeInput = styled.input`
  width: 1.8em;
  height: 1.8em;
  font-size: 20px;
  appearance: textfield;
  text-align: center;
  font-weight: bold;
  color: darkgrey;
  border: none;
  transform: translateY(2px);
`;

const _EditorContainer = styled.div<{ fontSize: number }>``;
const EditorContainer = styled(_EditorContainer)`
  border: 1px solid lightgrey;
  padding: 5px;
  font-size: ${p => p.fontSize}px;
  height: 100%;
  overflow: scroll;
  flex: 1;
`;
