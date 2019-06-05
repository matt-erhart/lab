import fs = require("fs-extra");
import jsonfile = require("jsonfile");
import axios from "axios";

import {
  makeAutograbNode,
  aNode,
  makeLink,
  PdfPublication, makePdfPublication
} from "../store/creators";

import FormData from 'form-data'
var request = require('request');
// var sleep = require('sleep');

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

  const fileExists = fs.pathExists(path);
  // await axios
  //   .post("http://52.10.103.106/autograb/pdfdata", {
  //     // .post("http://localhost/autograb/pdfdata", {
  //     pagesOfTextToDisplay: pagesOfTextToDisplay,
  //     path: path
  //   })
  //   .then(result => {
  //     autoGrabDetails = result['data'];
  //   })
  //   .catch(error => {
  //     console.log(error + " Bypass, use fake data instead");
  //     //Fake data if service request failed ...
  //     autoGrabDetails = {
  //       note:
  //         "Below are a list of (key, value) for metadata.Each key is the metadata type, the value is a list of top-scored sentences for that metadata type. These sentences were parsed and concatenated with an external tool (spacy). ",
  //       participant_detail: [
  //         {
  //           text:
  //             "We interviewed industry researchers with academic training, who shared how they have used academic research to inform their work.",
  //           score: 0.9181269407272339
  //         },
  //         {
  //           text:
  //             "In the second interview stage, we broadened recruiting criteria and interviewed 37 participants engaged in HCI-related research and practice fields.",
  //           score: 0.8893097639083862
  //         }
  //       ]
  //     };
  //   });

  //post the PDF data to extract metadata info
  // let formData = new FormData()
  // // console.log(pdfPath)
  // const testPdfPath = 'python-service/tmp/Zhang_et_al-2014-Journal_of_the_Association_for_Information_Science_and_Technology.pdf';
  // // const file = new Blob([fs.readFileSync(pdfPath), { type: 'application/pdf' });
  // // const pdfData = fs.readFileSync(testPdfPath)

  // // let pdfData = new Uint8Array(fs.readFileSync(testPdfPath))
  // formData.append('file', fs.createReadStream(testPdfPath))
  // await axios.post('http://localhost:5000/autograb/grobidmetadata', formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data'
  //   }
  // })
  // .then(function (response) {
  //   console.log(response)
  // })
  // .catch(function (error) {
  //   alert(error)
  // })
  // const imagePath = 'python-service/tmp/IMG_3509.JPG'
  // fs.readFile(imagePath, (err, imageData) => {
  //   if (err) {
  //     throw err;
  //   }
  //   const form = new FormData();
  //   form.append('file', imageData, {
  //     filepath: imagePath,
  //     contentType: 'image/jpeg',
  //   });
  //   axios.post('http://localhost:5000/autograb/grobidmetadata', form, {
  //     headers: {'Content-Type': 'multipart/form-data'},
  //   }).then(response => {
  //     console.log('success! ', response.status, response.statusText, response.headers, typeof response.data, Object.prototype.toString.apply(response.data));
  //   }).catch(err => {
  //     console.log(err);
  //   });
  // });

  // const pdfData = fs.readFileSync(testPdfPath);

  // formData.append('file', pdfData, { type: 'application/pdf' })
  // formData.append("consolidateHeader", "1");
  // formData.append("consolidateCitations", "0");

  // formData.submit("http://localhost:5000/autograb/grobidmetadata", function (err, res, body) {
  //   if (err) {
  //     console.log(err);
  //     return false;
  //   }

  //   if (!res) {
  //     console.log("GROBID service appears unavailable");
  //     //return false;
  //   } else {
  //     res.setEncoding('utf8');
  //   }

  //   // if (res.statusCode == 503) {
  //   //   // service unavailable, normally it means all the threads for GROBID on the server are currently used 
  //   //   // so we sleep a bit before retrying the process
  //   //   sleep.sleep(options.sleep_time);
  //   //   return callGROBID(options, file, callback);
  //   // } else if (res.statusCode == 204) {
  //   //   // success but no content, no need to read further the response and write an empty file
  //   //   return true;
  //   // } else if (res.statusCode != 200) {
  //   //   console.log("Call to GROBID service failed with error " + res.statusCode);
  //   //   return false;
  //   // }

  //   // var body = "";
  //   // res.on("data", function (chunk) {
  //   //   body += chunk;
  //   // });

  //   // res.on("end", function () {
  //   //   mkdirp(options.outPath, function (err, made) {
  //   //     // I/O error
  //   //     if (err)
  //   //       return cb(err);

  //   //     // first write the TEI reponse 
  //   //     var jsonFilePath = options.outPath + "/" + file.replace(".pdf", ".tei.xml");
  //   //     fs.writeFile(jsonFilePath, body, 'utf8',
  //   //       function (err) {
  //   //         if (err) {
  //   //           console.log(err);
  //   //         }
  //   //         console.log(white, "TEI response written under: " + jsonFilePath, reset);
  //   //         callback();
  //   //       }
  //   //     );
  //   //   });
  //   // });
  // });



  // // Test visiting an arbitrary existing web service ... tried https://jsonplaceholder.typicode.com/users

  // if (!fileExists || overwrite) {
  //   console.log("autoGrabDetails")
  //   console.log(autoGrabDetails);
  //   await jsonfile.writeFile(path, autoGrabDetails);
  //   return true
  // } else {
  //   return false;
  // }


  // var form = new FormData();
  // form.append("input", fs.createReadStream(testPdfPath));
  // form.append("consolidateHeader", "1");
  // form.append("consolidateCitations", "0");
  // var grobid_url = "http://cloud.science-miner.com/grobid/api/processHeaderDocument"

  // axios.post(grobid_url, form, { headers: { "Access-Control-Allow-Origin": "*" } })
  //   .then(function (response) {
  //     const bodyReturned = response['data']
  //     // first write the TEI reponse 
  //     var jsonFilePath = testPdfPath.replace(".pdf", ".tei.xml");
  //     fs.writeFile(jsonFilePath, bodyReturned, 'utf8',
  //       function (err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       }
  //     );
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //   })
}

export const createAutoGrabNodesAndLinkToPublicationNodes = (pdfDirs: string[], allNodeIds: string[], newPubs: any[]) => {

  const autograbNodes = pdfDirs.map((dir, ix) => {
    return makeAutograbNode(
      dir,
      { dir },
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
