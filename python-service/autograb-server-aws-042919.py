'''
-*- coding: utf-8 -*-
Copyright (C) 2019/4/16
Author: Xin Qian

Starts a python Flask REST service to auto-grab details in PDF, e.g. participant info, etc.
Follows the skeleton from hello.py


'''
import json
from bs4 import BeautifulSoup
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from util import inference
import random
import time 
import ntpath
import os
app = Flask(__name__)  # creates an app object from Flask.
CORS(app)
from copy import deepcopy
import json
import requests
from xmljson import badgerfish as bf # install on aws!!
from xml.etree.ElementTree import fromstring

try:
	from urlparse import urljoin
except ImportError:
	from urllib.parse import urljoin

empDB = [{'id': '101', 'name': 'Saravanan S', 'title': 'Technical Leader'},
		 {'id': '201', 'name': 'Rajkumar P', 'title': 'Sr Software Engineer'}]

GROBID_config={"grobid_server":"localhost","grobid_port":"8070"}

class ApiClient(object):
	""" Client to interact with a generic Rest API.
	Subclasses should implement functionality accordingly with the provided
	service methods, i.e. ``get``, ``post``, ``put`` and ``delete``.
	"""

	accept_type = 'application/xml'
	api_base = None

	def __init__(
			self,
			base_url,
			username=None,
			api_key=None,
			status_endpoint=None,
			timeout=60
	):
		""" Initialise client.
		Args:
			base_url (str): The base URL to the service being used.
			username (str): The username to authenticate with.
			api_key (str): The API key to authenticate with.
			timeout (int): Maximum time before timing out.
		"""
		self.base_url = base_url
		self.username = username
		self.api_key = api_key
		self.status_endpoint = urljoin(self.base_url, status_endpoint)
		self.timeout = timeout

	@staticmethod
	def encode(request, data):
		""" Add request content data to request body, set Content-type header.
		Should be overridden by subclasses if not using JSON encoding.
		Args:
			request (HTTPRequest): The request object.
			data (dict, None): Data to be encoded.
		Returns:
			HTTPRequest: The request object.
		"""
		if data is None:
			return request

		request.add_header('Content-Type', 'application/json')
		request.data = json.dumps(data)

		return request

	@staticmethod
	def decode(response):
		""" Decode the returned data in the response.
		Should be overridden by subclasses if something else than JSON is
		expected.
		Args:
			response (HTTPResponse): The response object.
		Returns:
			dict or None.
		"""
		try:
			return response.json()
		except ValueError as e:
			return e.message

	def get_credentials(self):
		""" Returns parameters to be added to authenticate the request.
		This lives on its own to make it easier to re-implement it if needed.
		Returns:
			dict: A dictionary containing the credentials.
		"""
		return {"username": self.username, "api_key": self.api_key}

	def call_api(
			self,
			method,
			url,
			headers=None,
			params=None,
			data=None,
			files=None,
			timeout=None,
	):
		""" Call API.
		This returns object containing data, with error details if applicable.
		Args:
			method (str): The HTTP method to use.
			url (str): Resource location relative to the base URL.
			headers (dict or None): Extra request headers to set.
			params (dict or None): Query-string parameters.
			data (dict or None): Request body contents for POST or PUT requests.
			files (dict or None: Files to be passed to the request.
			timeout (int): Maximum time before timing out.
		Returns:
			ResultParser or ErrorParser.
		"""
		headers = deepcopy(headers) or {}
		headers['Accept'] = self.accept_type
		params = deepcopy(params) or {}
		data = data or {}
		files = files or {}
		#if self.username is not None and self.api_key is not None:
		#    params.update(self.get_credentials())
		r = requests.request(
			method,
			url,
			headers=headers,
			params=params,
			files=files,
			data=data,
			timeout=timeout,
		)

		return r, r.status_code

	def get(self, url, params=None, **kwargs):
		""" Call the API with a GET request.
		Args:
			url (str): Resource location relative to the base URL.
			params (dict or None): Query-string parameters.
		Returns:
			ResultParser or ErrorParser.
		"""
		return self.call_api(
			"GET",
			url,
			params=params,
			**kwargs
		)

	def delete(self, url, params=None, **kwargs):
		""" Call the API with a DELETE request.
		Args:
			url (str): Resource location relative to the base URL.
			params (dict or None): Query-string parameters.
		Returns:
			ResultParser or ErrorParser.
		"""
		return self.call_api(
			"DELETE",
			url,
			params=params,
			**kwargs
		)

	def put(self, url, params=None, data=None, files=None, **kwargs):
		""" Call the API with a PUT request.
		Args:
			url (str): Resource location relative to the base URL.
			params (dict or None): Query-string parameters.
			data (dict or None): Request body contents.
			files (dict or None: Files to be passed to the request.
		Returns:
			An instance of ResultParser or ErrorParser.
		"""
		return self.call_api(
			"PUT",
			url,
			params=params,
			data=data,
			files=files,
			**kwargs
		)

	def post(self, url, params=None, data=None, files=None, **kwargs):
		""" Call the API with a POST request.
		Args:
			url (str): Resource location relative to the base URL.
			params (dict or None): Query-string parameters.
			data (dict or None): Request body contents.
			files (dict or None: Files to be passed to the request.
		Returns:
			An instance of ResultParser or ErrorParser.
		"""
		return self.call_api(
			method="POST",
			url=url,
			params=params,
			data=data,
			files=files,
			**kwargs
		)

	def service_status(self, **kwargs):
		""" Call the API to get the status of the service.
		Returns:
			An instance of ResultParser or ErrorParser.
		"""
		return self.call_api(
			'GET',
			self.status_endpoint,
			params={'format': 'json'},
			**kwargs
		)

class grobid_client(ApiClient):

	def __init__(self):
		self.config = GROBID_config

	def process_pdf(self,pdf_file, service="processHeaderDocument", generateIDs=False, consolidate_header=False, consolidate_citations=False):
		# Based on the python client code of GROBID
		# check if TEI file is already produced 
		# we use ntpath here to be sure it will work on Windows too

		# The consolidation parameters (consolidateHeader and consolidateCitations) indicate if 
		# GROBID should try to complete the extracted metadata with an additional external call to CrossRef API. 
		# Ref: https://grobid.readthedocs.io/en/latest/Grobid-service/

		pdf_file_name = ntpath.basename(pdf_file)
		pdf_dir=ntpath.dirname(pdf_file)
		filename = os.path.join(pdf_dir, os.path.splitext(pdf_file_name)[0] + '.tei.xml') # in fact change suffix 
		if os.path.isfile(filename): # return if exist
			return

		print("GROBID on pdf_file", pdf_file)
		files = {
			'input': (
				pdf_file,
				open(pdf_file, 'rb'),
				'application/pdf',
				{'Expires': '0'}
			)
		}
		
		the_url = 'http://'+GROBID_config['grobid_server']
		if len(GROBID_config['grobid_port'])>0:
			the_url += ":"+GROBID_config['grobid_port']
		the_url += "/api/"+service # By default is "processHeaderDocument"

		# set the GROBID parameters
		the_data = {}
		if generateIDs:
			the_data['generateIDs'] = '1'
		if consolidate_header:
			the_data['consolidateHeader'] = '1'
		if consolidate_citations:
			the_data['consolidateCitations'] = '1'    

		res, status = self.post(
			url=the_url,
			files=files,
			data=the_data,
			headers={'Accept': 'text/plain'}
		)

		#print(str(status))
		#print(res.text)

		if status == 503:
			print("Coming to a sleep ;<<")
			time.sleep(self.config['sleep_time'])
			return self.process_pdf(pdf_file, output)
		elif status != 200:
			print('Processing failed with error ' + str(status))
		else:
			# writing TEI file
			# with open(filename,'w',encoding='utf8') as tei_file:
			#     tei_file.write(res.text)
			return res.text

	
client=grobid_client()

@app.route('/autograb/grobidmetadata', methods=['POST'])
def parsePDFAndGROBIDExtract():
	filename=str(int(time.time()))+str(random.randint(0, 1000))+".pdf"
	pdf_path='tmp/'+filename
	
	print(request.data)
	with open(pdf_path, 'wb') as f2:
		f2.write(request.data)
		f2.flush()
		
	xml_text=client.process_pdf(pdf_path)
	print("TEI written!!",xml_text)
	soup = BeautifulSoup(xml_text, 'xml')
	author_list=[]
	for author in soup.findAll("author"):
		try:
			author_list.append(author.findAll("persName")[0].findAll("forename")[0].findAll(text=True)[0]+" "+author.findAll("persName")[0].findAll("surname")[0].findAll(text=True)[0])
		except:
			continue
	try:
		venue=" ".join(soup.findAll("monogr")[0].findAll(text=True)).replace("\n"," ").strip()
	except:
		venue="NULL"
	try:
		title=" ".join(soup.findAll("title")[0])
	except:
		title="NULL"
	return jsonify({"author":author_list,"venue":venue,"title":title})

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
	# To decode data received in a Flask request
	# https://stackoverflow.com/questions/10434599/how-to-get-data-received-in-flask-request
	print("[Sanity-check] inside realpdfdata data's keys like this "+str([request.json["path"] if "path" in request.json else ""]))
	# print(request.json["pagesOfTextToDisplay"])
	
	
	filename='tmp/pagesOfTextToDisplay-'+request.json["path"].split("/")[-2].split(".pdf")[0]+'.json'
	with open(filename, 'w') as outfile:
		json.dump(request.json["pagesOfTextToDisplay"], outfile, indent=4)
	
	# filename='tmp/pagesOfTextToDisplay-2.json'
	metadataToHighlight=inference(filename)
	
	# fake metadataToHighlight for front-end rendering
	# metadataToHighlight = {
	#     "note": "Below are a list of (key, value) for metadata.Each key is the metadata type, the value is a list of top-scored sentences for that metadata type. These sentences were parsed and concatenated with an external tool (spacy). ",
	#     "participant_detail": [
	#         {
	#             "text": "We interviewed industry researchers with academic training, who shared how they have used academic research to inform their work.",
	#             "score": 0.9181269407272339
	#         },
	#         {
	#             "text": "In the second interview stage, we broadened recruiting criteria and interviewed 37 participants engaged in HCI-related research and practice fields.",
	#             "score": 0.8893097639083862
	#         },
	#         {
	#             "text": "We also interviewed science communicators and communication managers.",
	#             "score": 0.710110604763031
	#         },
	#         {
	#             "text": "We iterated on the model after each interview.",
	#             "score": 0.6941357851028442
	#         },
	#         {
	#             "text": "Second, we interviewed academic researchers, design practitioners and students, entrepreneurs, and science communicators.",
	#             "score": 0.6827952265739441
	#         },
	#         {
	#             "text": "We met with him and he prototyped a version that we had in mind.",
	#             "score": 0.6094831824302673
	#         },
	#         {
	#             "text": "See detailed participant information on Table 1, and in Supplementary materials.",
	#             "score": 0.47279655933380127
	#         },
	#         {
	#             "text": "Second, at the bottom, we show participant experience in the HCI field.",
	#             "score": 0.37527304887771606
	#         }
	#     ]
	# }
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
	app.run(host="0.0.0.0", port=80)