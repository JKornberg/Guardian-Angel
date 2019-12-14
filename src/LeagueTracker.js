const electron = window.require('electron');
const LCUConnector = electron.remote.require('lcu-connector');
const fs = electron.remote.require('fs');
const ipcRenderer  = electron.ipcRenderer;

class LeagueTracker{
    constructor(location){
        this.location = location;
        this.connector = new LCUConnector();
        this.makeCall = this.makeCall.bind(this);
        this.connected = false;
        this.saveMetadata = this.saveMetadata.bind(this);
        this.getCurrentMatchData = this.getCurrentMatchData.bind(this);
        this.getHistoricalMatchData = this.getHistoricalMatchData.bind(this);
        console.log("Initialized Tracker")
        this.connector.on('disconnect', () =>  {
            this.data = null;
            this.connectd = false;
        })
    }

    ensureConnection = function(callback, args){
        if (!this.connected){
            this.connector.on('connect', (data) => {
                this.data = data;
                this.connected = true;
                callback(data, args);
            });
            this.connector.start();
        }
        else{
            callback(this.data, args);
        }
    }

    getCurrentMatchData = function(data, file){
        let summonerInfo = this.makeCall(data, '/lol-summoner/v1/current-summoner')
        let matchInfo = this.makeCall(data, '/lol-gameflow/v1/session')
        let regionInfo = this.makeCall(data, '/riotclient/get_region_locale')
        let promises = [summonerInfo, matchInfo, regionInfo];
        Promise.all(promises)
        .then((values) => {
            this.connector.stop();
            this.connected = false;
            let summoner = values[0];
            let game = values[1];
            let region = values[2];
            let data = {};
            data.game = 'League of Legends';
            data.id = this.file;
            data.details = {
                'accountId' : summoner.accountId,
                'name' : summoner.displayName,
                'summonerId' : summoner.summonerId,
                'region' : region.locale.region,
                'gameId' : game.gameData.gameId,
            }
            data.parsed = false;
            this.saveMetadata(data, file)
        })
    }

    getHistoricalMatchData = function(data, games){
        let calls = [];
        let files = [];
        for (let game of games){
            if (!game.parsed){
                console.log(game)
                let p = this.makeCall(data, '/lol-acs/v1/games/' + game.id);
                calls.push(p)
                files.push(game.file)
            }
        }
        let historical = {}
        Promise.all(calls)
        .then( (results) => {
            for (let i = 0; i < files.length; i++){
                historical[files[i]] = results[i]
            }
            ipcRenderer.send('Save Historical', historical);
        });
    }

    makeCall = function(data, call){
        let base = data.protocol + '://' + data.address + ':' + data.port
        let auth = 'Basic ' + btoa(data.username + ':' + data.password);
        let myHeaders = new Headers({
            'Accept': 'application/json',
            'Authorization' : auth,
            'strictSSL' : false
        })
        return fetch(base+call, {headers: myHeaders}).then(response=>response.json());
    }

    saveMetadata = function(data, file){
        console.log("Saving metadata: ");
        fs.readFile(this.location+'currentMatch.json', (err, resp) => {
            let json;
            try{
                json = JSON.parse(resp);
                json[file] = data;
            }
            catch(error){
                console.log(error);
                console.log("No Metadata found, creating new");
                json = {}
                json[file] = data;
            }
            console.log(JSON.stringify(json));
            fs.writeFile(this.location+'currentMatch.json', JSON.stringify(json), (err) =>{
                if(err) {console.log("error writing file: " + err);}
            });
        });
    }
}

export default LeagueTracker;