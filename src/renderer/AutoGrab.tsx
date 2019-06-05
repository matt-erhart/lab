import fs = require("fs-extra");
// import console = require("console");

import jsonfile = require("jsonfile");
import axios from "axios";
import {
  makeAutograbNode,
  aNode,
  makeLink,
  PdfPublication, makePdfPublication
} from "../store/creators";

import store, { iRootState, iDispatch, defaultApp } from "../store/createStore";
import console = require("console");

const PlaygroundDefaults = {
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

const mapDispatch = ({
  graph: { addBatch },
  app: { setMainPdfReader, setRightPanel }
}: iDispatch) => ({ addBatch, setMainPdfReader, setRightPanel });


type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

export const createGROBIDMetadata = async (
  path: string,
  pdfPath: string,
  overwrite = false
) => {
  // console.log("Inside createGROBIDMetadata")
  let GROBIDMetadata = {};
  const fileExists = await fs.pathExists(path);
  if (fileExists && !overwrite) {
    return true;
  }
  //TODO; fileExists check branch 
  // const filePath = 'python-service/tmp/paper276.pdf';
  const pdfData = await fs.readFileSync(pdfPath);
  console.log("Calling GROBID API")
  await axios.post('http://52.10.103.106/autograb/grobidmetadata', pdfData, {
    // axios.post('http://localhost:5000/autograb/grobidmetadata', pdfData, {
    headers: { 'Content-Type': 'application/pdf' },
  }).then(result => {
    GROBIDMetadata = result['data'];
  }).catch(err => {
    console.log(err + " Bypass, use fake data instead");
    //Fake data if service request failed ...
    GROBIDMetadata = { "author": "bla", "venue": "bla", "title": "bla" }
  });

  // if (!fileExists || overwrite) {
  console.log("GROBIDMetadata!")
  console.log(GROBIDMetadata);
  await jsonfile.writeFile(path, GROBIDMetadata);
  return true
  // } else {
  //   return false;
  // }
}

export const createAutoGrabInfo = async (
  pagesOfTextToDisplay: any[], // textToDisplay Pages
  path: string,
  pdf: any, // to be deleted, not necessary
  pdfPath: string,
  overwrite = false
) => {
  // TODO (Xin): here we grab info for the pdf from calling python service
  console.log("Inside createAutoGrabInfo, reading pages[0] in below");

  // Auto-grab from local python Flask service, code in ../../python-service/hello.py
  let autoGrabDetails = {};

  const fileExists = await fs.pathExists(path);
  if (fileExists && !overwrite) {
    return true;
  }
  // console.log("calling API")
  await axios
    .post("http://52.10.103.106/autograb/pdfdata", {
      // .post("http://localhost/autograb/pdfdata", {
      pagesOfTextToDisplay: pagesOfTextToDisplay,
      path: path
    })
    .then(result => {
      autoGrabDetails = result['data'];
    })
    .catch(error => {
      console.log(error + " Bypass, use fake data instead");
      //Fake data if service request failed ...
      autoGrabDetails = {
        note:
          "Below are a list of (key, value) for metadata. Each key is the metadata type, the value is a list of top-scored sentences for that metadata type. These sentences were parsed and concatenated with an external tool (spacy). ",
        participant_detail: [
          {
            text:
              "If you see this, then the AWS service aren't responding or haven't been started, contact Xin. ",
            score: 1.0
          },
          {
            text:
              "We interviewed industry researchers with academic training, who shared how they have used academic research to inform their work.",
            score: 0.9181269407272339
          },
          {
            text:
              "In the second interview stage, we broadened recruiting criteria and interviewed 37 participants engaged in HCI-related research and practice fields.",
            score: 0.8893097639083862
          }
        ]
      };
    });

  // Test visiting an arbitrary existing web service ... tried https://jsonplaceholder.typicode.com/users

  // if (!fileExists || overwrite) {
  console.log("autoGrabDetails")
  console.log(autoGrabDetails);
  await jsonfile.writeFile(path, autoGrabDetails);
  return true
  // } else {
  //   return false;
  // }
}

export const createAutoGrabNodesAndLinkToPublicationNodes = (pdfDirs: string[], allNodeIds: string[], newPubs: any[]) => {

  const autograbNodes = pdfDirs
    .filter((dir, ix) => {
      const fileExists = fs.pathExistsSync(dir + "metadataToHighlight.json")
      return fileExists;
    })
    .map((dir, ix) => {
      return makeAutograbNode(
        dir,
        "metadataToHighlight.json",
        "-autograb",
        { x: 50 + ix + Math.random() * 100, y: 50 + ix * Math.random() * 100 }
      );
    });

  const newAutograbs = autograbNodes.filter(
    autograbNode => !allNodeIds.includes(autograbNode.id)
  ); //filter out nodes that exists

  // add links from nodes of type auto-grab to nodes of pdf.publication
  let newLinks = [];
  for (let i = 0; i < newPubs.length; i++) {
    const linkToPdf = makeLink(newPubs[i].id, newAutograbs[i].id, {
      type: "more"
    });
    newLinks.push(linkToPdf);
    // assert each paper corresponds to one autograb node and idx are the same(for now)
  }

  // concatenate nodes of type auto-grab and nodes of pdf.publication
  let newNodes = [] as aNode[];
  const nodesArray = newPubs.concat(autograbNodes);
  for (let i = 0; i < nodesArray.length; i++) {
    newNodes.push(nodesArray[i]);
  }
  // return new nodes and links batch to be added in Redux
  return { newNodes: newNodes, newLinks: newLinks };

}



export const createAutoGrabNodesAndLinkToPublicationNodesSingle = (dir: string, allNodeIds: string[], newPubs: any[]) => {
  const fileExists = fs.pathExistsSync(dir + "metadataToHighlight.json")
  let autograbNodes: any[]
  if (fileExists) {
    autograbNodes = [makeAutograbNode(
      dir,
      "metadataToHighlight.json",
      "-autograb",
      { x: 0, y: 0 }
    )]
  } else {
    autograbNodes = []
  }

  // const newAutograbs = autograbNodes.filter(
  //   autograbNode => !allNodeIds.includes(autograbNode.id)
  // ); //filter out nodes that exists

  // add links from nodes of type auto-grab to nodes of pdf.publication
  let newLinks = [];
  // concatenate nodes of type auto-grab and nodes of pdf.publication
  let newNodes = [] as aNode[];
  // const nodesArray = newPubs.concat(autograbNodes);
  const nodesArray = [].concat(autograbNodes);
  for (let i = 0; i < nodesArray.length; i++) {
    newNodes.push(nodesArray[i]);
  }
  // return new nodes and links batch to be added in Redux
  return { newNodes: newNodes, newLinks: newLinks };

}


export const createGROBIDNodesAndLinkToPublicationNodesSingle = (dir: string, allNodeIds: string[], newPubs: any[]) => {

  const fileExists = fs.pathExistsSync(dir + "metadataFromGROBID.json")
  let autograbNodes: any[]
  if (fileExists) {
    autograbNodes = [makeAutograbNode(
      dir,
      "metadataFromGROBID.json",
      "-GROBIDMetadata",
      { x: 0, y: 0 }
    )]
  } else {
    autograbNodes = []
  }

  // const newAutograbs = autograbNodes.filter(
  //   autograbNode => !allNodeIds.includes(autograbNode.id)
  // ); //filter out nodes that exists

  // add links from nodes of type auto-grab to nodes of pdf.publication
  let newLinks = [];

  // concatenate nodes of type auto-grab and nodes of pdf.publication
  let newNodes = [] as aNode[];
  // const nodesArray = newPubs.concat(autograbNodes);
  const nodesArray = [].concat(autograbNodes);
  for (let i = 0; i < nodesArray.length; i++) {
    newNodes.push(nodesArray[i]);
  }
  // return new nodes and links batch to be added in Redux
  return { newNodes: newNodes, newLinks: newLinks };

}


export const createGROBIDNodesAndLinkToPublicationNodes = (pdfDirs: string[], allNodeIds: string[], newPubs: any[]) => {

  const autograbNodes = pdfDirs
    .filter((dir, ix) => {
      // console.log("inside makeAutoGrabNode " + fulldirName);
      const fileExists = fs.pathExistsSync(dir + "metadataFromGROBID.json")
      return fileExists;
    })
    .map((dir, ix) => {
      return makeAutograbNode(
        dir,
        "metadataFromGROBID.json",
        "-GROBIDMetadata",
        { x: 50 + ix + Math.random() * 100, y: 50 + ix * Math.random() * 100 }
      );
    });

  const newAutograbs = autograbNodes.filter(
    autograbNode => !allNodeIds.includes(autograbNode.id)
  ); //filter out nodes that exists

  // add links from nodes of type auto-grab to nodes of pdf.publication
  let newLinks = [];
  for (let i = 0; i < newPubs.length; i++) {
    const linkToPdf = makeLink(newPubs[i].id, newAutograbs[i].id, {
      type: "more"
    });
    newLinks.push(linkToPdf);
    // assert each paper corresponds to one autograb node and idx are the same(for now)
  }

  // concatenate nodes of type auto-grab and nodes of pdf.publication
  let newNodes = [] as aNode[];
  const nodesArray = newPubs.concat(autograbNodes);
  for (let i = 0; i < nodesArray.length; i++) {
    newNodes.push(nodesArray[i]);
  }
  // return new nodes and links batch to be added in Redux
  return { newNodes: newNodes, newLinks: newLinks };

}
