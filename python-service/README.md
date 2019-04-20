In this directory, _`hello.py`_ (NO!!! new one is `python autograb-server.py `) is the Flask python service which src/io.ts calls from to auto-grab details from parsed PDF.

i.e. the TypeScript end-point invokes the API from http://localhost:5000/autograb/pdfdata

It is suggested to call with `source activate snorkel` for local debug of the service.

Our AWS instance runs with allennlp==0.8.1 and some version of spacy. Enter the instance to learn more about its platform. The autograb-service-aws.py is the current working script.


