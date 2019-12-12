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
        this.combineData = this.combineData.bind(this);
        this.loadData = this.loadData.bind(this);
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

    loadData = function(){
        if(fs.existsSync(path+'/metadata.json')){
            console.log("Loading library");
            let dir = this.fsReadDir(path)
            let data = this.fsReadFile(path+'/metadata.json')
            let promises = [dir, data];
            Promise.all(promises)
            .then((results) => {
                this.combineData(results[0],results[1]);
            })
            .catch((err) => {
                console.log(err);
            })  
        } else{
            console.log("making file");
            fs.writeFile(path+'/metadata.json', JSON.stringify({}), this.loadData);
        }
        

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

    combineData(files, metadata){
        let games = [];
        let key = 0;
        for (var file of files){
            let f = file.split('.')
            let name = f[0];
            let ext = f[1];
            if (ext != 'mp4' && ext!= 'webm'){
                continue;
            }
            let game = {
                key : key,
                file : file,
            }
            key += 1;
            if (metadata[f]){
                let m = metadata[f];
                game = {
                    id : m.game.gameData.gameId,
                    game : m.game,
                    details : m.details,
                }
            }
            let stats = fs.stat(path+'videos/'+file, function(error, data){
                if (data){
                    game['date'] = data['birthtime'];
                    game['size'] = data['size']
                }
            })
            games.push(game);
        }
        this.setState({
            games: games,
        })
    }

}

export default Library;