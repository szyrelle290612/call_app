import Watcher from "../Watcher";

class AppWatcher extends Watcher {
    #word = ""
    #stream = ""
    constructor(parent) {
        super(parent)
        this.callFunction = Meteor.call;
        this.callSubscribe = Meteor.subscribe;
    }

    get Word() {
        return this.#word
    }

    setWord(word) {
        this.#word = word
        this.activateWatcher()
    }


    setStream(stream) {
        this.#stream = stream
        this.activateWatcher()
    }

    get Stream() {
        return this.#stream
    }





    save(id, name) {
        console.log(id, name);
        this.callFunc("METEOR METHOD HERE", id, name, (err, data) => {
            console.log(err, data)
        })
    }
}

export default new AppWatcher()