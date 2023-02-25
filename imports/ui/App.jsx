import React from "react"
import { withTracker } from "meteor/react-meteor-data";
import AppW from '../api/classes/client/App';
import Peer1 from "./Peer1";

class App extends React.Component {
	constructor(props) {
		super(props)
		AppW.setWatcher(this, "UNIQUEID")
	}



	render() {

		AppW.initiateWatch("UNIQUEID")
		const word = AppW.Word
		return (
			<Peer1 />
		)
	}

}

export default withTracker(() => {
})(App)


