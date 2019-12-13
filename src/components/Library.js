import React, { Component } from 'react';
import {Link} from 'react-router-dom';
// import FileTree from '../utilities/FileTree';
// var remote = window.require('electron').remote;
// var {dialog} = remote;
const electron = window.require('electron');
const fs = electron.remote.require('fs');
const util = require('util');
const path = './videos'
const ipcRenderer  = electron.ipcRenderer;

class Library extends Component {
    
    constructor(props){
        super(props);
        this.state = {
            games : [],
        }
        this.fsReadDir = util.promisify(fs.readdir);
        this.fsReadFile = util.promisify(fs.readFile);
    }

    componentDidMount(){
        console.log("Mounting Library");
        //this.loadData();
        ipcRenderer.send('load-library', null);
        ipcRenderer.on('load-library', (event, arg) =>{
            console.log('received library');
            this.setState({
                games : arg,
            })
        });
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners('load-library');
    }

    render() {
        const games = this.state.games.map((game) =>
            <div key={game.key}>
                <Link to={{
                    pathname: `player/${game.key}`,
                    state: {
                        game : game
                    }
                }}><h1>{game.key}</h1></Link>
            </div>
         )
        return (
        <div>
            <h3>Title</h3>
            {games}
        </div>
        );
    }

}

export default Library;