import React, { Component } from 'react';
import { Player } from 'video-react';

import '../../node_modules/video-react/dist/video-react.css'; // import css
const remote = window.require('electron').remote;
const fs = remote.require('fs');


class VideoPlayer extends Component {

    
    constructor(props){
        super(props);


    }

    componentDidMount(){
        if (this.props.location.state){
            this.setState({
                game : this.props.location.state.game
            })
        } 
    }

    render() {
        const s = {width: '480px', height: '360px', background: 'rgba(0,0,0,0.25)'}
        if (this.state){
            let source = "E:/Work/Javascript Stuff/plays/videos/" + this.props.location.state.game.file;
            console.log(source);
            return (
                <Player
                    playsInline
                    poster="/assets/poster.png"
                    src={source}
                />
                //<video autoPlay style={s}></video>
            );
        } else{
            return(
                <h1> Loading </h1>
            )
        }

    }
}




export default VideoPlayer;