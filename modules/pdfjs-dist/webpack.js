/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var pdfjs = require('./lib/pdf.js'); //changed from build to lib


// just do this after you load pdfjs
// var PdfjsWorker = require('./lib/pdf.worker.js'); // need worker-loader in webpack

// if (typeof window !== 'undefined' && 'Worker' in window) {
//   console.log('setting up worker for webpack')
//   pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker();
// }

module.exports = pdfjs;