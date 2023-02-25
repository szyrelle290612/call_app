import React, { Component } from 'react'
import Peer from "simple-peer"
import io from "socket.io-client"


const socket = io.connect('http://localhost:8080')



export default class Peer2 extends Component {
    constructor(prop) {
        super(prop)
        this.state = {
            myId: "",
            stream: "",
            receivingCall: false,
            caller: "",
            callerSignal: "",
            callAccepted: false,
            idToCall: "",
            callEnded: false,
            name: "",
        }
        this.myVideo = React.createRef()
        this.userVideo = React.createRef()
        this.phoneUser = React.createRef()
        this.connectionRef = React.createRef()
    }

    componentDidMount() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            this.setState({ stream: stream })
            console.log(stream)
        }).catch((err) => {
            console.log(err)
            console.log('no media found!')
        })

        socket.on("me", (id) => {
            this.setState({ myId: id })
        })
        socket.on("callUser", (data) => {
            this.setState({ receivingCall: true, caller: data.from, name: data.name, callerSignal: data.signal })
        })
    }








    answerCall = () => {
        const { stream, caller } = this.state
        this.setState({ callAccepted: true })
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        })
        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller })
        })
        peer.on("stream", (stream) => {
            console.log(stream)
            this.userVideo.current.srcObject = stream
        })

        peer.signal(this.state.callerSignal)
        this.connectionRef.current = peer
    }

    leaveCall = () => {
        this.setState({ stream: "", callEnded: true })
        this.connectionRef.current.destroy()
    }


    render() {
        const { stream, callAccepted, callEnded, idToCall, receivingCall, name } = this.state
        return (
            <>
                <h1>Peer 2</h1>
                <div className="container">
                    <div className="myId">
                        <div><strong>MY ID: </strong> {this.state.myId}</div>
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
                        <button className='call_button_small' id='mic_button'>
                            <img src='images/mic.png' id='mic_button_image'></img>
                        </button>
                        {callAccepted && !callEnded ? (
                            <button className="button_call" id='stranger_video_button' onClick={this.leaveCall.bind(this)}>
                                End Call
                            </button>
                        ) : (
                            <button className="button_call" id='stranger_video_button' >
                                CALL
                            </button>
                        )}
                    </div>
                </div>
            </>
        )
    }
}
