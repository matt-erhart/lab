// import path = require("path");
// import fs = require("fs-extra");
// import jsonfile = require("jsonfile");
// import axios from "axios";

// const callGrobid = async () => {
//   //   const pdfData = await fs.readFile(
//   //     "F:\\GoogleSync\\pdfs\\The Economies and Dimensionality of Design Prototyping Value, Time, Cost, and Fidelit.pdf"
//   //   );

//   //   const data = await axios.post(
//   //     "http://52.10.103.106/autograb/grobidmetadata",
//   //     pdfData,
//   //     {
//   //       headers: { "Content-Type": "application/pdf" }
//   //     }
//   //   );

//   //   console.log(data);
//   var params = {
//     // Request parameters
//     expr: "W='testing'",
//     model: "latest",
//     attributes: "Ti",
//     count: "10",
//     offset: "0"
//   };
//   //      "https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=And(W='poverty',W='impedes')&model=latest&count=10&offset=0&attributes=Ti",
//   // "https://api.labs.cognitive.microsoft.com/academic/v1.0/interpret?query=poverty impedes&complete=0&count=10&model=latest",
// const url = "https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?"

//   try {
//     const ms = await axios.get(
//       url + "expr=Ti='active learning increases student performance in science engineering and mathematics'&model=latest&count=10&offset=0&attributes=E.DN,E.VFN,Ti,Y,D,ECC,AA.AuN,W,VSN,IA,",
//       {
//         // params,
//         headers: {
//           Host: "api.labs.cognitive.microsoft.com",
//           "Ocp-Apim-Subscription-Key": "2681b4126f064fa2a7bbf223a6b10734"
//         }
//       }
//     );
//     console.log(ms.data.entities[0]);
//   } catch (err) {
//     console.log(err);
//   }
// };
// callGrobid();