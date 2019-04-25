/**
 * DocEditor.tsx is the larger, more complex version of TextEditor.tsx
 */
// libs
import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import convertBase64 from "slate-base64-serializer";

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
import { htmlSerializer } from "./htmlSerializer";
import { NodeDataTypes, makeLink, UserDoc } from "../store/creators";
import { Portal } from "./Portal";

// todo
/**
 * ?scenarios
 * --------
 *
 * * autocomplete + link
 *
 *
 * * links from heirarchy changes
 *  - capture list operations
 *
 *
 *  *make a new node from within the editor
 *  - select text, hit button or key cmd
 *  - create node and link to current editor node
 *  - each listen becomes a node if not already
 *
 * ?code quality
 * ------------
 * *one place for all this related slate stuff
 * wrap node functions + rendernodes + serialize + deserialize should go together
 *
 */
const schema = {
  inlines: {
    graph: {
      isVoid: true
    }
  }
};
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
    editorValue: initKeySafeSlate(),
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
export class DocEditor extends React.Component<
  typeof DocEditorDefaults.props & connectedProps,
  typeof DocEditorDefaults.state
> {
  static defaultProps = DocEditorDefaults.props;

  state = DocEditorDefaults.state;
  editor: Editor;
  outerContainer = React.createRef<HTMLDivElement>();
  portalDiv = React.createRef<HTMLDivElement>();
  menu = React.createRef<HTMLDivElement>();
  ref = editor => {
    this.editor = editor;
  };
  componentWillUnmount() {
    this.save();
  }

  static getDerivedStateFromProps(props, state) {
    // todo perf patch
    let autoCompDocs: UserDoc[];
    const checkForAutoCompDocs =
      state.wordAtCursor.length > 1 && !props.readOnly && props.nodes;

    if (checkForAutoCompDocs) {
      //@ts-ignore
      autoCompDocs = (Object.values(props.nodes) as aNode).filter(
        node =>
          node.data.type === ("userDoc" as NodeDataTypes) &&
          node.id !== props.id &&
          node.data.useTextForAutocomplete
      );
      if (state.wordAtCursor !== "") {
        // todo could do fuzzy matching here
        autoCompDocs = autoCompDocs.filter(t => {
          return (
            t.data.text.includes(state.wordAtCursor) &&
            t.data.text.trim() !== state.wordAtCursor.trim()
          );
        });
      } else {
        autoCompDocs = [];
      }
    }

    const showAutoComplete = checkForAutoCompDocs && autoCompDocs.length > 0;

    if (showAutoComplete && !state.showAutoComplete) {
      return { autoCompDocs, showAutoComplete: true };
    } else if (!showAutoComplete && state.showAutoComplete) {
      return { showAutoComplete: false };
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
        const editorValue = convertBase64.deserialize(base64);
        editorValue.document;
        this.setState({ editorValue, fontSize: this.getFontSize() });
      }
    }
  };

  componentDidMount() {
    setTimeout(() => {
      if (!!this.editor) {
        if (!this.state.isActive) {
          this.setState({ isActive: true });
        }
        this.editor.focus();
      }
    }, 100); // thanks random github user
    this.initBase64();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.nodes === this.props.nodes) {
      this.setAutoCompPosition();
      this.setMenuPosition();
    }

    // if there are two instances open, want the other to change
    const { id } = this.props;
    if (prevProps.patches !== this.props.patches) {
      const relevantPatch = this.props.patches.find(p => p.path.includes(id));
      if (!!relevantPatch) {
        const newDoc = get(relevantPatch, patch => patch.value.data.base64);
        const base64State = this.serialize(this.state.editorValue);

        if (base64State !== this.getCurrentBase64()) {
          this.initBase64();
        }
      }
    }
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

  calcPosition = (element: HTMLElement) => {
    const selectionEdges = getBoxEdges(this.getSelectionBbox());

    const clientBoxEdges = getBoxEdges(getClientBox());
    const diffs = getEdgeDiffs(clientBoxEdges)(selectionEdges);
    const moreSpaceDown = moreSpaceIs(diffs).down;
    const { width: portalWidth, height: portalHeight } = get(element, current =>
      current.getBoundingClientRect()
    ) || {
      width: 0,
      height: 0
    };

    const left =
      clientBoxEdges.maxX - selectionEdges.minX > portalWidth
        ? selectionEdges.minX
        : clientBoxEdges.maxX - portalWidth;

    const top = moreSpaceDown
      ? selectionEdges.maxY
      : selectionEdges.minY - portalHeight - 3;

    return { left, top };
  };

  setAutoCompPosition = () => {
    const { left, top } = this.calcPosition(this.portalDiv.current);
    this.setState(state => {
      const newTrans = `translate(${left}px,${top}px)`;
      if (newTrans === state.portalStyle.transform) {
        return null;
      } else {
        return { portalStyle: { ...state.portalStyle, transform: newTrans } };
      }
    });
  };

  setMenuPosition = () => {
    const { left, top } = this.calcPosition(this.menu.current);
    this.setState(state => {
      const newTrans = `translate(${left}px,${top}px)`;
      if (newTrans === state.menuStyle.transform) {
        return null;
      } else {
        return {
          menuStyle: { ...state.menuStyle, transform: newTrans }
        };
      }
    });
  };

  // todo move to utils
  getSelectionBbox = () => {
    const { left, top, bottom, width, height, right } =
      get(window, win =>
        win
          .getSelection()
          .getRangeAt(0)
          .cloneRange()
          .getBoundingClientRect()
      ) || DocEditorDefaults.state.selectionBbox;
    return { left, top, bottom, width, height, right };
  };

  onChange = change => {
    const docFeatures = this.getDocFeatures(change);
    const useTextForAutocomplete =
      docFeatures.nChars > 0 &&
      docFeatures.nChars <= this.props.autoCompThresh &&
      !docFeatures.hasList;

    const { text, isAfterSpace, isEndOfWord } = this.getCurrentWord(change);

    this.setState(state => ({
      editorValue: change.value,
      useTextForAutocomplete,
      docFeatures,
      wordAtCursor: isEndOfWord && state.isActive ? text : ""
    }));
  };

  getCurrentWord = editor => {
    const anchorOffset = editor.value.selection.getIn(["anchor", "offset"]);
    //@ts-ignore
    const anchorText = oc(editor.value.anchorText).text("");
    // console.log('anchorText', anchorText, this.state.isActive)

    const { text, isAfterSpace, isEndOfWord } = getWordAtCursor(
      anchorText,
      anchorOffset
    );

    return { text, isAfterSpace, isEndOfWord };
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
  };

  cleanLinks = () => {
    // todo remove magic strings, "graph" is a node autocompleted
    const graphInlines = this.editor.value.document.getInlinesByType("graph");
    const idsToLink = graphInlines.toJS().map(n => get(n, n => n.data.id));

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
  iconProps = {
    size: "25px",
    style: { verticalAlign: "middle" }
  };

  AutocompleteButton = () => {
    // not a button but maybe it should be?
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
      this.AutocompleteButton(),
      <Button
        key={"Delete: Double Click"}
        title={"Delete: Double Click"}
        isActive={false}
        onDoubleClick={this.deleteNode}
      >
        <MdDeleteForever {...this.iconProps} />
      </Button>
    ];
  };

  deleteNode = () => {
    this.props.removeBatch({ nodes: [this.props.id] });
  };

  // changeFontSize = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newSize = parseInt(e.target.value);
  //   if (newSize > 9) {
  //     this.props.updateBatch({
  //       nodes: [
  //         {
  //           id: this.props.id,
  //           style: {
  //             fontSize: parseInt(e.target.value)
  //           }
  //         }
  //       ]
  //     });
  //   }
  //   // this.setState({ fontSize: parseInt(e.target.value) });
  // };

  onKeyDown = getInputProps => (event, editor, next) => {
    const isCrtlEnter =
      event.key !== "Control" && event.ctrlKey && event.key === "Enter";

    const isAutoCompleteCmd = ["ArrowUp", "ArrowDown", "Enter"].includes(
      event.key
    );

    if (event.key === "Tab") {
      event.preventDefault();
      // editor.insertText("\t");
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.setState({ wordAtCursor: "", showMenu: false });
    }

    if (isAutoCompleteCmd && this.state.showAutoComplete) {
      // todo maybe use this to portal
      const { onKeyDown } = getInputProps();
      event.preventDefault(); //inter-tab can do weird things
      onKeyDown(event);
      return null; // prevents return/tab happening. other keys dont need
    }

    return next();
  };

  save = (e?) => {
    !!e && e.stopPropagation();
    // this.setState({ isFocused: false });
    this.setState({
      wordAtCursor: "",
      showAutoComplete: false,
      isActive: false
    });
    // if (e.target.id !== "EditorContainer") return null;
    const serialized = this.serialize(this.state.editorValue);
    if (serialized.base64 === this.getCurrentBase64()) return null;
    this.cleanLinks();
    this.props.updateBatch({
      nodes: [
        {
          id: this.props.id,
          data: {
            ...serialized,
            //@ts-ignore
            useTextForAutocomplete: this.state.useTextForAutocomplete
          }
        }
      ]
    });
  };

  onFocus = e => {
    console.log("set active");

    if (!this.state.isActive) {
      this.setState({ isActive: true });
    }
  };
  closeMenu = e => {
    if (this.state.showMenu) {
      this.setState({ showMenu: false });
    }
  };
  getFontSize = () => {
    const { id, nodesOrLinks } = this.props;
    const fontSize = get(this.props, p => p[nodesOrLinks][id].style.fontSize);
    return fontSize;
  };

  onWheel = e => {
    const wheelDefault = 120;

    e.persist();
    if (e.ctrlKey) {
      e.preventDefault();
      const inc = e.nativeEvent.wheelDelta / wheelDefault;
      //@ts-ignore
      this.props.updateBatch({
        nodes: [
          {
            id: this.props.id,
            style: {
              fontSize: this.getFontSize() + inc
            },
            data: {
              ...this.serialize(this.state.editorValue)
            }
          } as NestedPartial<UserDoc>
        ]
      });
    }
  };

  render() {
    const { wordAtCursor, showAutoComplete } = this.state;
    console.log(
      "word:",
      wordAtCursor,
      this.state.autoCompDocs,
      this.state.isActive
    );

    return (
      <OuterContainer
        id="outer-doc"
        ref={this.outerContainer}
        onMouseLeave={this.save}
        onMouseDown={this.onFocus}
        onContextMenu={e => {
          e.preventDefault();
          this.setState({ showMenu: true });
        }}
        onWheel={this.onWheel}
      >
        <Downshift
          key="downshift"
          itemToString={item => (item ? item.data.text : "")}
          isOpen={this.state.showAutoComplete}
          onStateChange={(
            { selectedItem, highlightedIndex },
            { setState, clearSelection }
          ) => {
            const id = get(
              this.state.autoCompDocs,
              docs => docs[highlightedIndex].id
            );

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
        >
          {downshift => {
            return (
              <div id="downshift-div" style={{ display: "flex", flex: 1 }}>
                <EditorContainer
                  id="EditorContainer"
                  fontSize={this.getFontSize()} //todo save
                  // onKeyUp={this.onKeyUp}
                  // onMouseUp={this.onMouseUp}
                >
                  <Editor
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
                  />
                  {showAutoComplete && (
                    <Portal id="portal-outer">
                      <PortalDiv
                        id="autocomplete-div"
                        ref={this.portalDiv}
                        style={{ ...this.state.portalStyle, zIndex: 2 }}
                      >
                        {this.state.autoCompDocs.map((doc, index) => {
                          return (
                            <AutoCompItem
                              key={doc.id}
                              style={{ fontSize: 20 }}
                              {...downshift.getItemProps({
                                key: doc.id,
                                index,
                                item: doc,
                                style: {
                                  backgroundColor:
                                    downshift.highlightedIndex === index
                                      ? "#e0e0e0"
                                      : "white",
                                  fontWeight:
                                    downshift.selectedItem === doc
                                      ? "bold"
                                      : "normal"
                                }
                              })}
                            >
                              {doc.data.text}
                            </AutoCompItem>
                          );
                        })}
                      </PortalDiv>
                    </Portal>
                  )}
                  {this.state.showMenu && (
                    <Portal id="portal-menu">
                      <Toolbar
                        style={this.state.menuStyle}
                        ref={this.menu}
                        onMouseLeave={this.closeMenu}
                      >
                        {" "}
                        {this.MakeButtons()}{" "}
                        {/* <FontSizeInput
                          type="number"
                          min={10}
                          max={60}
                          value={this.state.fontSize}
                          onChange={this.changeFontSize}
                          title="Base Font Size"
                        /> */}
                      </Toolbar>
                    </Portal>
                  )}
                </EditorContainer>
              </div>
            );
          }}
        </Downshift>
      </OuterContainer>
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
import deepEqual from "fast-deep-equal";

function fuzzyMatch(textToMatch, nodesWithText) {
  var results = fuzzy.filter(
    textToMatch.toLowerCase(),
    nodesWithText as any[],
    {
      pre: "<b>",
      post: "</b>",
      extract: function(el) {
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
)(DocEditor);

const _AutoCompItem = styled.div``;
const AutoCompItem = styled(_AutoCompItem)`
  margin: 2px;
  border-radius: 2px;
  border: #eee;
  padding: 3px;
  cursor: pointer;
`;

const _Button = styled.span<{ isActive: boolean; onMouseDown? }>``;
export const Button = styled(_Button)`
  cursor: pointer;
  margin: 0px 5px;
  padding: 0px;
  color: ${props => (props.isActive ? "black" : "darkgrey")};
`;

export const Toolbar = styled(PortalDiv)`
  flex: 0;
  display: flex;
  align-items: center;
  position: absolute;
  background: white;
  padding: 8px;
`;

const OuterContainer = styled.div`
  margin: 0px 0px;
  flex: 1;
  height: auto;
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
  border-top: 1px solid lightgrey;
  padding: 5px;
  font-size: ${p => p.fontSize}px;
  overflow: auto;
  display: flex;
  flex: 1;
`;
