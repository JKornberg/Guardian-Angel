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
        this.onRefresh = this.onRefresh.bind(this);
    }

    componentDidMount(){
        console.log("Mounting Library");
        //this.loadData();
        ipcRenderer.send('load-library', null);
        ipcRenderer.on('load-library', (event, arg) =>{
            //console.log('received library');
            this.setState({
                games : arg,
            })
        });
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners('load-library');
    }

    onRefresh = function(){
        ipcRenderer.send('load-library', null);
        console.log(this.state.games);
        ipcRenderer.send('refresh-historical', this.state.games);
    }

    render() {
        const games = this.state.games.map((game) =>
            <div key={game.file}>
                <Link to={{
                    pathname: `player/${game.key}`,
                    state: {
                        game : game
                    }
                }}><h1>{game.file}</h1></Link>
            </div>
         )
        return (
        <div>
            <h3>Library</h3>
            <button type="btn" onClick = {this.onRefresh} className ="btn btn-primary">Refresh</button>
            {games}
        </div>
        );
    }

}

export default Library;