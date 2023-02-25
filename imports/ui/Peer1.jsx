import React, { Component } from 'react'
import Peer from "simple-peer"
import io from "socket.io-client"
import AppW from '../api/classes/client/App';

const socket = io.connect('http://localhost:8080')



export default class Peer1 extends Component {
    constructor(prop) {
        super(prop)
        this.state = {
            myId: "",
            stream: "",
            stream2: "",
            stream3: "",
            receivingCall: false,
            caller: "",
            callerSignal: "",
            callAccepted: false,
            idToCall: "",
            callEnded: false,
            name: "",
            token: "",
            showCallButton: false,
            device: "",
            isCalling: false,
        }
        this.myVideo = React.createRef()
        this.userVideo = React.createRef()
        this.connectionRef = React.createRef()
        AppW.setWatcher(this, "PEER1")
    }

    componentDidMount() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            this.setState({ stream: stream })
            this.myVideo.current.srcObject = stream
        }).catch((err) => {
            console.log(err)
        })
        socket.on("me", (id) => {
            this.setState({ myId: id })
        })
        socket.on("callUser", (data) => {
            this.setState({ receivingCall: true, caller: data.from, name: data.name, callerSignal: data.signal })
        })
    }



    startupClient = async () => {
        let show = "false"
        console.log("Requesting Access Token...");
        try {
            const data = await fetch("/token").then((res) => res.json()).then((data) => { return data });
            this.setState({ token: data.token })
            const device = new Twilio.Device(data.token, {
                logLevel: 1,
                codecPreferences: ["opus", "pcmu"],
            });
            device.on("registered", function () {
                console.log("Twilio.Device Ready to make and receive calls!");
                show = true
            });

            device.on("error", function (error) {
                console.log("Twilio.Device Error: " + error.message);
            });

            device.on("incoming", () => {
                console.log('incoming')
            });

            this.setState({ showCallButton: show });
            this.setState({ device: device });
            device.register();
        } catch (err) {
            console.log(err);
            console.log("An error occurred. See your browser console for more information.");
        }
    }

    makeOutgoingCall = async () => {
        this.setState({ isCalling: true })
        let params = {
            // get the phone number to call from the DOM
            To: this.state.phone_number,
        };

        if (this.state.device) {
            const { device } = this.state
            console.log(`Attempting to call ${params.To} ...`);
            if (!params.To) {
                this.setState({ isCalling: false })
                return alert('Please enter a phone number to call.')
            }
            // Twilio.Device.connect() returns a Call object
            const call = await device.connect({ params })

            // add listeners to the Call
            // "accepted" means the call has finished connecting and the state is now "open"
            call.on("accept", (caller) => {
                console.log("Call in progress ...");
                this.setState({ stream2: call.getLocalStream() });
                console.log('localstream', call.getLocalStream())
                caller.on("volume", function (inputVolume, outputVolume) {
                    if (outputVolume && AppW.Word == "") {
                        AppW.setWord(call.getRemoteStream())
                    }
                });
                caller.mute(true);
                caller.on("error", (error) => {
                    console.log(error)
                })
            });


            call.on("error", (error) => {
                console.log(error)
            })

            call.on("disconnect", () => {
                this.setState({ isCalling: false })
                console.log("Call ended");
            });
            call.on("cancel", () => {
                console.log("Call canceled");
            });

        } else {
            log("Unable to make call.");
        }
    }



    callUser = (id) => {
        let all_Stream = []
        const { name, myId, stream2, stream } = this.state

        if (stream) {
            all_Stream.push(stream)
        }
        if (stream2) {
            all_Stream.push(stream2)
        }
        if (AppW.Word) {
            all_Stream.push(AppW.Word)
        }

        const peer = new Peer({
            initiator: true,
            trickle: false,
            streams: all_Stream
        })

        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: myId,
                name: name
            })
        })

        peer.on("stream", (stream) => {
            console.log("Peer 2 localStream", stream)
            AppW.setStream(stream)
            this.userVideo.current.srcObject = stream
        })

        socket.on("callAccepted", (signal) => {
            this.setState({ callAccepted: true })
            peer.signal(signal)
        })

        this.connectionRef.current = peer
    }


    leaveCall = () => {
        this.setState({ stream: "", callEnded: true })
        this.connectionRef.current.destroy()
    }



    render() {
        AppW.initiateWatch("PEER1")
        const { stream, callAccepted, callEnded, idToCall, receivingCall, name } = this.state
        return (
            <>

                <h1>Connect to Phone Call</h1>
                <button onClick={this.startupClient.bind(this)}>Start</button>
                {this.state.showCallButton &&
                    <div className="call_input_container">
                        {this.state.isCalling ?
                            <div>
                                <button onClick={this.makeOutgoingCall.bind(this)}>End Call</button>
                            </div>
                            :
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={this.makeOutgoingCall.bind(this)}>Call</button>
                                <input type="text" placeholder="+15552221234" value={this.state.phone_number} onChange={(e) => this.setState({ phone_number: e.target.value })} />
                            </div>}
                    </div>
                }
                <h1>Peer 1</h1>
                <div className="container">
                    <div className="myId">
                        <div><strong>MY ID: </strong> {this.state.myId}</div>
                        <label><strong>CONNECT TO: </strong></label>
                        <input
                            id="filled-basic"
                            value={idToCall}
                            onChange={(e) => this.setState({ idToCall: e.target.value })}
                        />
                    </div>
                </div>

                <div className="container-main">
                    <div className="call_container">
                        <div className="video-container">
                            <div>
                                {receivingCall && !callAccepted ? (
                                    <div className="caller">
                                        <h1 >{name} is calling...</h1>
                                        <button variant="contained" color="primary" onClick={this.answerCall.bind(this)}>
                                            Answer
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            <div className="video">
                                {stream && <audio playsInline muted ref={this.myVideo} autoPlay style={{ width: "300px" }} />}
                            </div>
                            <div className="video">
                                {callAccepted && !callEnded ?
                                    <audio playsInline ref={this.userVideo} controls autoPlay style={{ width: "300px" }} /> :
                                    null}
                            </div>
                        </div>
                        <button id='mic_button' onClick={() => this.handleStream.bind(this)}>
                            Get Stream
                        </button>
                        {callAccepted && !callEnded ? (
                            <button className="button_call" id='stranger_video_button' onClick={this.leaveCall.bind(this)}>
                                End Call
                            </button>
                        ) : (
                            <button className="button_call" id='stranger_video_button' onClick={this.callUser.bind(this, idToCall)}>
                                CALL
                            </button>
                        )}
                    </div>
                </div>
            </>
        )
    }
}
