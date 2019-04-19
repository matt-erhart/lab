import fs = require("fs-extra");
import jsonfile = require("jsonfile");
import axios from "axios";

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
    await axios
      .post("http://localhost:5000/autograb/pdfdata", {
        pagesOfTextToDisplay: pagesOfTextToDisplay,
        path: path
      })
      .then(result => {
        autoGrabDetails = result['data'];
      })
      .catch(error => {
        console.log(error+" Bypass, use fake data instead");
        //Fake data if service request failed ...
        autoGrabDetails = {
            note:
              "Below are a list of (key, value) for metadata.Each key is the metadata type, the value is a list of top-scored sentences for that metadata type. These sentences were parsed and concatenated with an external tool (spacy). ",
            participant_detail: [
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
  
    const fileExists = await fs.pathExists(path);
  
    if (!fileExists || overwrite) {
      console.log("making ", path);
      await jsonfile.writeFile(path, autoGrabDetails);
      return true;
    } else {
      return false;
    }
  };
