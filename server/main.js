import { Meteor } from "meteor/meteor"
import Server from "../imports/api/classes/server/Server"

import "../imports/api/server/api"
import "../imports/startup/server"

const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
})

Meteor.startup(() => {
	Server.registerFunctions()
	Server.initServer()


	// if (!Meteor.users.findOne()) {
	// 	Accounts.createUser({
	// 		username: Meteor.settings.user.username,
	// 		email: Meteor.settings.user.email,
	// 		password: Meteor.settings.user.password,
	// 		profile: Meteor.settings.user.profile,
	// 	})
	// }

	io.on("connection", (socket) => {
		console.log("connected")
		socket.emit("me", socket.id)

		socket.on("disconnect", () => {
			socket.broadcast.emit("callEnded")
		})

		socket.on("callUser", (data) => {
			console.log(data)
			io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
		})

		socket.on("answerCall", (data) => {
			io.to(data.to).emit("callAccepted", data.signal)
		})
	})

	server.listen(8080, () => console.log("server is running on port 8080"))
})
