import * as React from "react"
import * as ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"
import Routes from "./routes"

Meteor.startup(() => {
	ReactDOM.render(
		<BrowserRouter>
			<Routes />
		</BrowserRouter>,
		document.getElementById("react-target")
	)
})
