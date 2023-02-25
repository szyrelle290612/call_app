import * as React from "react"
import { Routes, Route } from "react-router-dom"
import App from "../../ui/App"
import Notfound from "../../ui/Notfound"
import Peer2 from "../../ui/Peer2"

function Home() {
	return (
		<div className="routes">
			<Routes>
				<Route path="/" element={<App />} />\
				<Route path="/peer2" element={<Peer2 />} />
				<Route path="*" element={<Notfound />} />
			</Routes>
		</div>
	)
}

export default Home
