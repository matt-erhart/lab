// css
import "./global.css";

// libs
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from "react-redux";
import styled from "styled-components";
import path = require("path");
import { hot } from "react-hot-loader/root";
import Select from "react-select";
import GoogleScholar from "./codeExperiments/GoogleScholar";
import { Pdf } from "./Pdf";
// custom
import store, { iRootState, iDispatch, defaultApp } from "../store/createStore";
import { setupDirFromPdfs, processAutoGrab, processGROBID } from "./io";
import { createAutograbJSON, createGROBIDJSON, listDirs } from "./io";
// import fs = require("fs-extra");
import ListView from "./ListView";
import {
  makePdfPublication,
  NodeBase,
  PdfPublication,
  makeLink
} from "../store/creators";
import {
  createAutoGrabNodesAndLinkToPublicationNodes,
  createGROBIDNodesAndLinkToPublicationNodes,
  createAutoGrabNodesAndLinkToPublicationNodesSingle,
  createGROBIDNodesAndLinkToPublicationNodesSingle
} from "./AutoGrab";
import GraphContainer from "./GraphContainer";
import { ResizeDivider } from "./ResizeDivider";
import PortalContainer from "./PortalContainer";
import { mData } from "./rx";
import DocEditor from "./DocEditor";
import WOZEditor from "./WOZEditor";
import RealisticEditor from "./RealisticEditor";
import DocList from "./DocList";
import { featureToggles } from "../store/featureToggle";
import { List } from "grommet-icons";

const NavBar = styled.div`
  font-size: 30px;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-flow: row;
  flex: 0;
  margin: 1px;
  z-index: 4;
`;

const ViewPortContainer = styled.div`
  --border-size: 1;
  max-height: 100vh;
  border: var(--border-size) solid lightgrey;
  border-radius: 5px;
  font-size: 30px;
  overflow: none;
  flex-flow: column;
  display: flex;
`;

const MainContainer = styled.div`
  flex: 1 2;
  background-color: white;
  overflow: none;
  position: relative;
  display: flex;
  margin: 15px;
`;

const AppDefaults = {
  props: {},
  state: { pdfNodes: [] as PdfPublication[] }
};
//mapState is a convention in Redux
const mapState = (state: iRootState) => ({
  pdfDir: state.app.panels.mainPdfReader.pdfDir, //more or less an alias
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes,
  mainPdfReader: state.app.panels.mainPdfReader,
  rightPanel: state.app.panels.rightPanel
});

// set component event/function as shortcut alias, affiliated to this.props
const mapDispatch = ({
  graph: { addBatch, updateBatch },
  app: { setMainPdfReader, setRightPanel }
}: iDispatch) => ({ addBatch, updateBatch, setMainPdfReader, setRightPanel });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

const processNewPdfs = async (pdfRootDir, nodes) => {
  const pdfDirs = await setupDirFromPdfs(pdfRootDir);
  // 

  const pdfNodes = pdfDirs.map((dir, ix) => {
    const normDir = path.normalize(dir);
    const pathParts = normDir.split(path.sep);
    const fileName = pathParts[pathParts.length - 1];
    const pdfDir = fileName === "" ? pathParts[pathParts.length - 2] : fileName;

    return makePdfPublication(
      pdfDir,
      { pdfDir },
      { x: 50 + ix + Math.random() * 100, y: 50 + ix * Math.random() * 100 }
    );
  });

  const allNodeIds = Object.keys(nodes);

  const newPubs = pdfNodes.filter(pdfNode => !allNodeIds.includes(pdfNode.id)); //filter out nodes that exists

  return { newPubs: newPubs };
};

// const processAutoGrabs = async (pdfRootDir, nodes, newPubs) => {
//   // Put AutoGrab info in a metaToHighlight.json file
//   var pdfDirs = await processAutoGrab(pdfRootDir)().then(result => {
//     return result;
//   });
//   const allNodeIds = Object.keys(nodes);

//   // Move AutoGrab info from metaToHighlight.json file to state.json
//   return createAutoGrabNodesAndLinkToPublicationNodes(
//     pdfDirs,
//     allNodeIds,
//     newPubs
//   );
// };

// const processAutoGrabs = async (pdfRootDir, nodes, newPubs) => {
//   const pdfDirs = await listDirs(pdfRootDir);
//   const allNodeIds = Object.keys(nodes);
//   for (let dir of pdfDirs) {
//     await createAutograbJSON(dir)
//     const { newNodes, newLinks } = createAutoGrabNodesAndLinkToPublicationNodes(
//       pdfDirs,
//       allNodeIds,
//       newPubs
//     );

//     if (newNodes.length > 0) {
//       this.props.addBatch({ nodes: newNodes, links: newLinks });
//       this.props.updateBatch({ nodes: newNodes, links: newLinks });
//     }

//   }

//   // Move AutoGrab info from metaToHighlight.json file to state.json
//   // return createAutoGrabNodesAndLinkToPublicationNodes(
//   //   pdfDirs,
//   //   allNodeIds,
//   //   newPubs
//   // );
// };

const processGROBIDs = async (pdfRootDir, nodes, newPubs) => {
  // Put AutoGrab info in a metaToHighlight.json file
  var pdfDirs = await processGROBID(pdfRootDir)().then(result => {
    return result;
  });
  const allNodeIds = Object.keys(nodes);

  // Move GROBID info from metadataFromGROBID.json file to state.json
  // return "data's been written!"

  return createGROBIDNodesAndLinkToPublicationNodes(
    pdfDirs,
    allNodeIds,
    newPubs
  );
};

type rightPanelName = typeof defaultApp.panels.rightPanel;
// todo rename _App
class _App extends React.Component<connectedProps, typeof AppDefaults.state> {
  state = AppDefaults.state;
  keyback = (e: KeyboardEvent) => {
    
    const altAndKeyToCmd = {
      "1": "graphContainer" as rightPanelName,
      "2": "listview" as rightPanelName,
      "3": "synthesisOutlineEditor" as rightPanelName,
      // "3": "docEditor" as rightPanelName
      "4": "synthesisOutlineWOZEditor" as rightPanelName,
      "5": "synthesisOutlineRealEditor" as rightPanelName
    };
    if (e.altKey && Object.keys(altAndKeyToCmd).includes(e.key)) {
      this.props.setRightPanel(altAndKeyToCmd[e.key]);
    }
  };
  async componentDidMount() {

    const { newPubs } = await processNewPdfs(
      // Destructuring assignment
      this.props.pdfRootDir,
      this.props.nodes
    );
    const nodesBeforePubs = this.props.nodes;
    if (newPubs.length > 0) {
      this.props.addBatch({ nodes: newPubs });
      if (this.props.pdfDir === "")
        this.props.setMainPdfReader({ pdfDir: newPubs[0].id });
    }

    // adding key listener before the autograb task (which is time-consuming and may block key listening)
    window.addEventListener("keyup", this.keyback);

    if (featureToggles.showAutoGrab) {
      // show autograb and GROBID extracted metadata
      
      {
        // This 1st block: making participant info nodes
        // const { newNodes, newLinks } = await processAutoGrabs(
        //   // Destructuring assignment
        //   this.props.pdfRootDir,
        //   nodesBeforePubs,
        //   newPubs
        // );

        // if (newNodes.length > 0) {
        //   this.props.addBatch({ nodes: newNodes, links: newLinks });
        //   this.props.updateBatch({ nodes: newNodes, links: newLinks });
        // }
        // processAutoGrabs(this.props.pdfRootDir,
        //   nodesBeforePubs,
        //   newPubs
        // );

        let pdfDirs = await listDirs(this.props.pdfRootDir);
        pdfDirs = pdfDirs.sort((dirA, dirB) =>
          dirA.toString() < dirB.toString() ? 1 : 0
        );
        // 
        const allNodeIds = Object.keys(nodesBeforePubs);
        // let excessiveNodes:any[]
        // let excessiveLinks=any[]
        for (let dir of pdfDirs) {
          {
            var success = await createAutograbJSON(dir)().then(result => {
              return result;
            });

            var {
              newNodes,
              newLinks
            } = await createAutoGrabNodesAndLinkToPublicationNodesSingle(
              dir,
              allNodeIds,
              newPubs
            );
            // excessiveNodes+=[newNodes]
            // excessiveLinks+=[newLinks]

            if (newNodes.length > 0) {
              this.props.addBatch({ nodes: newNodes, links: newLinks });
              this.props.updateBatch({ nodes: newNodes, links: newLinks });
              // this.props.addBatch({ nodes: excessiveNodes, links: excessiveLinks });
              // this.props.updateBatch({ nodes: excessiveNodes, links: excessiveLinks });
            }
          }
          {
            var success = await createGROBIDJSON(dir)().then(result => {
              return result;
            });

            var {
              newNodes,
              newLinks
            } = await createGROBIDNodesAndLinkToPublicationNodesSingle(
              dir,
              allNodeIds,
              newPubs
            );

            if (newNodes.length > 0) {
              this.props.addBatch({ nodes: newNodes, links: newLinks });
              this.props.updateBatch({ nodes: newNodes, links: newLinks });
            }
          }

          // 
          //   this.props.setRightPanel(("graphContainer" as any))
          // this.props.setRightPanel(("listview" as any))
          var random = Math.floor(Math.random() * (5 - 0));
          
          if (random == 3) {
            await this.props.setRightPanel("graphContainer" as any);
            await this.props.setRightPanel("listview" as any);
          }
        }

        await this.props.setRightPanel("graphContainer" as any);
        await this.props.setRightPanel("listview" as any);
      }

      {
        // This 2nd block: Making GROBID extracted metadata nodes
        // const { newNodes, newLinks } = await processGROBIDs(
        //   // Destructuring assignment
        //   this.props.pdfRootDir,
        //   nodesBeforePubs,
        //   newPubs
        // );
        // if (newNodes.length > 0) {
        //   this.props.addBatch({ nodes: newNodes, links: newLinks });
        //   this.props.updateBatch({ nodes: newNodes, links: newLinks });
        // }
        // 
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.keyback);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // todo switch to patches
    const pdfNodes = (Object.values(nextProps.nodes) as NodeBase[]).filter(
      n => n.data.type === "pdf.publication"
    );
    let wasUpdated = false;
    if (pdfNodes.length !== prevState.pdfNodes.length) {
      wasUpdated = true;
    } else {
      pdfNodes.forEach((node, ix) => {
        if (node.meta.timeUpdated !== prevState.pdfNodes[ix].meta.timeUpdated) {
          wasUpdated = true;
        }
      });
    }
    if (wasUpdated) {
      return { pdfNodes };
    } else {
      return null;
    }
  }

  styleFn(provided, state) {
    return { ...provided, minWidth: "5%", height: 5 };
  }

  setPathInfo = opt => {
    
    this.props.setMainPdfReader({
      pdfDir: opt.label,
      scrollToPageNumber: 0,
      left: 0,
      top: 0
    });
  };

  //todo mdata
  onResizeDivider = (mouseData: mData) => {
    const { width } = this.props.mainPdfReader;
    // todo use bounding box on ref instead of '15'
    this.props.setMainPdfReader({ width: mouseData.clientX - 15 });
  };

  rightPanel = React.createRef<HTMLDivElement>();

  renderRightPanel = (panelName: rightPanelName) => {
    
    switch (panelName) {
      case "graphContainer":
        return <GraphContainer />;
      case "listview":
        // return <GoogleScholar />
        // return <ListView ref={this.rightPanel} />;

      case "synthesisOutlineEditor":
        if (featureToggles.showDocList) {
          return <DocList />;
        } else {
          return null;
        }
      case "synthesisOutlineWOZEditor":
        if (featureToggles.showDocList) {
          return <WOZEditor />;
          // return <DocEditor />;
        } else {
          return null;
        }

      case "synthesisOutlineRealEditor":
        if (featureToggles.showDocList) {
          return <RealisticEditor />;
          // return <DocEditor />;
        } else {
          return null;
        }
      default:
        return (
          <div>
            alt-1 | alt-2 | alt-3 | alt-4 | alt-5 (for mac users,
            ctrl+alt+[1/2/3/4])
          </div>
        );
    }
  };

  render() {
    const { pdfRootDir, pdfDir } = this.props;
    const { pdfNodes } = this.state;
    const fileOptions = pdfNodes.map(node => ({
      value: node,
      label: node.data.pdfDir
    }));

    if (pdfNodes.length === 0) {
      return <h2>Add some pdfs to your selected folder and view->reload</h2>;
    }

    return (
      <ViewPortContainer>
        <div style={{ flex: 1, padding: 5, height: 50, margin: 15, zIndex: 4 }}>
          <Select
            // style={this.styleFn}
            options={fileOptions}
            onChange={this.setPathInfo}
          />
        </div>
        <MainContainer>
          {pdfDir.length > 0 && (
            <div
              style={{
                border: "4px solid grey",
                borderRadius: 5,
                // padding: 3,
                minWidth: this.props.mainPdfReader.width + 3,
                display: "flex"
              }}
            >
              {/* <PdfViewer
                tabIndex={0}
                isMainReader={true}
                key={pdfDir}
                pageNumbersToLoad={[]}
                scrollAfterClick={false}
                {...{
                  pdfRootDir,
                  ...this.props.mainPdfReader,
                  height: "100%"
                }}
              /> */}

              <Pdf
                scale={this.props.mainPdfReader.scale}
                load={{ dir: pdfDir, rootDir: pdfRootDir }}
                loadPageNumbers={[]}
                scrollToPageNumber={this.props.mainPdfReader.scrollToPageNumber}
                scrollToTop={this.props.mainPdfReader.top}
                scrollToLeft={this.props.mainPdfReader.left}
              />
            </div>
          )}
          <ResizeDivider onTransforming={this.onResizeDivider} />
          {this.renderRightPanel(this.props.rightPanel)}
        </MainContainer>
        <PortalContainer />
      </ViewPortContainer>
    );
  }
}
const ConnectedApp = connect(
  mapState,
  mapDispatch
)(_App);

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <ConnectedApp />
      </Provider>
    );
  }
}

const rootEl = document.getElementById("app");
export const render = (Component: typeof App) =>
  ReactDOM.render(<Component />, rootEl);

hot(render(App));
