// lib
import * as React from "react";
import { connect } from "react-redux";
import { oc } from "ts-optchain";
import styled from "styled-components";
import { KeyUtils } from "slate";


// custom
import DocEditor from "./DocEditor";
import { iDispatch, iRootState } from "../store/createStore";
import { makeUserDoc, UserDoc, NodeDataTypes } from "../store/creators";

/**
 * @class **DocList**
 */
const mapState = (state: iRootState) => ({
  //   pdfDir: state.app.panels.mainPdfReader.pdfDir,
  //   pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes
  //   links: state.graph.links,
  //   patches: state.graph.patches
});

const mapDispatch = ({
  graph: { addBatch, toggleSelections, updateBatch, removeBatch },
  app: { setCurrent }
}: iDispatch) => ({
  addBatch
  //   setCurrent,
  //   toggleSelections,
  //   updateBatch,
  //   removeBatch
});

//todo list userdocs, show ids
type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

const DocListDefaults = {
  props: {},
  state: { userDocs: [] as UserDoc[] }
};
export class DocList extends React.Component<
  typeof DocListDefaults.props & connectedProps,
  typeof DocListDefaults.state
> {
  static defaultProps = DocListDefaults.props;
  state = DocListDefaults.state;

  static getDerivedStateFromProps(props, state) {
    let userDocs: UserDoc[];
    if (props.nodes) {
      //@ts-ignore
      userDocs = (Object.values(props.nodes) as aNode).filter(
        node => node.data.type === ("userDoc" as NodeDataTypes)
      );
      if (userDocs.length !== state.userDocs.length) {
        return { userDocs };
      }
    }
    return null;
  }
  componentDidMount() {
    // KeyUtils.resetGenerator()
  }

  makeUserDoc = () => {
    const newDoc = makeUserDoc();
    
    this.props.addBatch({ nodes: [newDoc] });
  };

  render() {
    return (
      <OuterContainer>
        <button onClick={this.makeUserDoc}>make</button>
        {this.state.userDocs.length > 0 && (
          <div>
            {this.state.userDocs.map(doc => {
              return <DocEditor key={doc.id} id={doc.id} />;
            })}
          </div>
        )}
      </OuterContainer>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(DocList);

const OuterContainer = styled.div`
  margin: 0px 0px;
  flex: 1;
  border: 4px solid darkgrey;
  height: auto;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
`;
