import Watcher from "./Watcher"

class ExampleWatcher extends Watcher {
	constructor(parent) {
		super(parent)
		this.callFunction = Meteor.call
		this.callSubscribe = Meteor.subscribe
	}

	addME = () => {
		this.callFunc("ANY", (err, res) => {})
	}
}

export default ExampleWatcher()
