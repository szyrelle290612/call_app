import { Meteor } from "meteor/meteor";

class Server {
	constructor(settings) {
		if (!settings) throw new Error("No Meteor settings found!");

		this.functions = {};
		this.settings = settings;

	}

	initServer() {

	}

	registerFunctions() {
		Meteor.methods(this.functions);
	}

	addFunction(name, func) {
		if (typeof func != "function") throw new Error("func not a function");
		if (this.functions[name]) throw new Error(`function "${name}" is already registered`);
		this.functions[name] = func;
	}

	addPub(name, func) {
		if (typeof func != "function") throw new Error("Invalid publication!");
		Meteor.publish(name, func);
	}

	callfunction(...args) {
		let keys = Object.keys(arguments);
		const id = arguments[0];
		keys.splice(0, 1);
		let result = keys.map((index) => arguments[index]);
		if (!this.functions[id]) throw new Error(`Function not found! [${id}]`);
		return this.functions[id].apply(this, result);
	}

}

export default new Server(Meteor.settings);
