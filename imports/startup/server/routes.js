import bodyParser from "body-parser"
import moment from "moment-timezone"
import { check } from "meteor/check"
import multer from "multer"
const { tokenGenerator, voiceResponse } = require("./handler");

Picker.middleware(multer().any())
Picker.middleware(bodyParser.json())
Picker.middleware(bodyParser.urlencoded({ extended: false }))

Meteor.startup(() => {
	Picker.route("/token", function (params, request, response, next) {
		request

		switch (request.method) {
			case "POST":
			case "GET": {
				response.statusCode = 200
				response.setHeader("Content-Type", "application/json")
				response.end(JSON.stringify(tokenGenerator()))
				break;
			}
			case "DELETE":
			case "PUT":
			default:
				response.statusCode = 404
				response.end("HI")
				break
		}
	})

	Picker.route("/voice", function (params, request, response, next) {
		request

		switch (request.method) {
			case "POST": {
				console.log(request.body)
				response.setHeader("Content-Type", "text/xml");
				response.end(voiceResponse(request.body));
				break;
			}
			case "GET":
			case "DELETE":
			case "PUT":
			default:
				response.statusCode = 404
				response.end("HI")
				break
		}
	})

})