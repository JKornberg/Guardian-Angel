import React, {Component} from 'react';
import './App.css';
import VideoPlayer from  './components/Player';
import Library from './components/Library';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
import Recorder from './Recorder';
import LeagueTracker from './LeagueTracker';
const {desktopCapturer} = window.require('electron');
const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;

class App extends Component{

    constructor(props){
        super(props);
        //this.manageRecording = this.manageRecording.bind(this);
        this.location = './videos/';
        this.recorder = new Recorder(this.location);
        this.gameTracker = null;
        this.saveMetadata = this.saveMetadata.bind(this);
    }
 
    componentDidMount(){
        console.log('alive4');
        setInterval(this.checkProcesses, 15000)
        ipcRenderer.on('check-processes', (event, arg) => {
            this.manageRecording(arg);
        })
    }

    manageRecording(arg){
        if (this.recorder.active){
            if (this.recorder.recording == false){
                if (arg.length != 0){
                    console.log("Found game starting recording")
                    this.recorder.startRecording((going, file)=>{
                        if (going){
                            this.gameTracker = new LeagueTracker(this.location, file);
                        }
                    });
                }
                else{
                    console.log("Game not found");
                }
            } else {
                if (arg.length == 0){
                    let file = this.recorder.stopRecording();
                }
            }
        }
    }

    saveMetadata = function(file){
        this.gameTracker.saveMetadata(this.location, file);
    }

    checkProcesses = function(){
        ipcRenderer.send('check-processes', null)
    }

    


    render(){
        return (
        <Router>
            <div>
            <Link to="/"><h1>Plays</h1></Link>
            <Switch>
                <Route path="/" exact component ={Library}/>
                <Route path="/player/:id" component ={VideoPlayer}/>
            </Switch>
            </div>
        </Router>

        );
  }

}

export default App;










