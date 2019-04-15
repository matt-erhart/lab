'''
-*- coding: utf-8 -*-
Copyright (C) 2019/4/14
Author: Xin Qian

Starts a simple python Flask REST service.
Follows tutorial from here https://dzone.com/articles/restful-web-services-with-python-flask

'''

from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)  # creates an app object from Flask.
CORS(app)

empDB = [{'id': '101', 'name': 'Saravanan S', 'title': 'Technical Leader'},
         {'id': '201', 'name': 'Rajkumar P', 'title': 'Sr Software Engineer'}]


@app.route("/")
def hello():
    return "Hello World!"


# curl -i http://localhost:5000/empdb/employee
@app.route('/empdb/employee', methods=['GET'])
def getAllEmp():
    return jsonify({'emps': empDB})


# curl -i http://localhost:5000/empdb/employee/301   ## {"emp":[{"id":"301","name":"Sriram H","title":"Technical Leader 2"}]}
# curl -i http://localhost:5000/empdb/employee/303   ## {"emp":[]}
@app.route('/empdb/employee/<empId>', methods=['GET'])
def getEmp(empId):
    usr = [emp for emp in empDB if (emp['id'] == empId)]
    return jsonify({'emp': usr})


# curl -i -H "Content-type: application/json" -X PUT -d "{\"title\":\"Technical Leader 2\"}" http://localhost:5000/empdb/employee/201
@app.route('/empdb/employee/<empId>', methods=['PUT'])
def updateEmp(empId):
    em = [emp for emp in empDB if (emp['id'] == empId)]
    if 'name' in request.json:  # NOTE: the request.json will contain the JSON object set in the client request.
        em[0]['name'] = request.json['name']
    if 'title' in request.json:
        em[0]['title'] = request.json['title']
    return jsonify({'emp': em[0]})


# curl -i -H "Content-type: application/json" -X POST -d "{\"id\":\"301\",\"title\":\"Technical Leader 2\",\"name\":\"Sriram H\"}" http://localhost:5000/empdb/employee
@app.route('/empdb/employee', methods=['POST'])
def createEmp():
    dat = {
        'id': request.json['id'],
        'name': request.json['name'],
        'title': request.json['title']
    }

    empDB.append(dat)
    return jsonify(dat)


# The HTTP POST method is used to send user-generated data to the web server. For example, a POST method is used when a user comments on a forum or if they upload a profile picture.
# curl -i -H "Content-type: application/json" -X POST -d "{}" http://localhost:5000/autograb/pdfdata
@app.route('/autograb/pdfdata', methods=['POST'])
def parsePDFAndGetAutoGrab():
    # TODO: put python code/process that takes parses pdf data from request.json, then auto-grab details
    print("[Sanity-check] Get pages (textToDisplay) data's keys like this " + str(list(request.json.keys())))

    # fake metadataToHighlight for front-end rendering
    metadataToHighlight = {
        "note": "Below are a list of (key, value) for metadata.Each key is the metadata type, the value is a list of top-scored sentences for that metadata type. These sentences were parsed and concatenated with an external tool (spacy). ",
        "participant_detail": [
            {
                "text": "We interviewed industry researchers with academic training, who shared how they have used academic research to inform their work.",
                "score": 0.9181269407272339
            },
            {
                "text": "In the second interview stage, we broadened recruiting criteria and interviewed 37 participants engaged in HCI-related research and practice fields.",
                "score": 0.8893097639083862
            },
            {
                "text": "We also interviewed science communicators and communication managers.",
                "score": 0.710110604763031
            },
            {
                "text": "We iterated on the model after each interview.",
                "score": 0.6941357851028442
            },
            {
                "text": "Second, we interviewed academic researchers, design practitioners and students, entrepreneurs, and science communicators.",
                "score": 0.6827952265739441
            },
            {
                "text": "We met with him and he prototyped a version that we had in mind.",
                "score": 0.6094831824302673
            },
            {
                "text": "See detailed participant information on Table 1, and in Supplementary materials.",
                "score": 0.47279655933380127
            },
            {
                "text": "Second, at the bottom, we show participant experience in the HCI field.",
                "score": 0.37527304887771606
            }
        ]
    }
    return jsonify(metadataToHighlight)


# curl -i -X DELETE http://localhost:5000/empdb/employee/301
@app.route('/empdb/employee/<empId>', methods=['DELETE'])
def deleteEmp(empId):
    em = [emp for emp in empDB if (emp['id'] == empId)]
    if len(em) == 0:
        abort(404, "Don't have this empID")
    empDB.remove(em[0])
    return jsonify({'response': 'Success'})


if __name__ == "__main__":
    app.run()
