import { Meteor } from 'meteor/meteor'
import Server from '../classes/server/Server'
import Util from '../classes/Utilities'
import { LinksCollection } from '../dbs';

if (Meteor.isServer) {

    Server.addPub("PUBLICATION HERE", () => { })

    Server.addFunction("METEOR METHOD HERE", (id, name) => {
        try {
            LinksCollection.insert({ id, name })
        } catch (error) {
            Util.showError("METEOR METHOD HERE", Util.errorMsg(error))
        }
    })

}