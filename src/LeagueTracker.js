const electron = window.require('electron');
const LCUConnector = electron.remote.require('lcu-connector');
const fs = electron.remote.require('fs');

class LeagueTracker{
    constructor(location, file){
        this.file = file;
        this.location = location;
        this.connector = new LCUConnector();
        this.makeCall = this.makeCall.bind(this); 
        this.connector.on('connect', (data) => {
            this.getCurrentMatchData(data);
        })
        this.connector.start();
        this.saveMetadata = this.saveMetadata.bind(this);
        console.log("Initialized Tracker")
    }

    getCurrentMatchData = function(data){
        let summonerInfo = this.makeCall(data, '/lol-summoner/v1/current-summoner')
        let matchInfo = this.makeCall(data, '/lol-gameflow/v1/session')
        let promises = [summonerInfo, matchInfo];
        Promise.all(promises)
        .then((values) => {
            let summoner = values[0];
            let game = values[1];
            let data = {};
            data.game = 'League of Legends';
            console.log(values);
            data.details = {
                'accountId' : summoner.accountId,
                'name' : summoner.displayName,
                'summonerId' : summoner.summonerId,
                'region' : game.map.platformId,
                'gameId' : game.gameData.gameId
            }
            data.parsed = false;
            this.saveMetadata()
        })
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

    saveMetadata = function(){
        fs.readFile(this.location+'metadata.json', (err, data) => {
            let json;
            try{
                json = JSON.parse(data);
                json[this.file] = {
                    'id' : this.file,
                    'game' : 'League of Legends',
                    'details' : this.details,
                    'parsed' : false,
                }
            }
            catch(error){
                console.log(error);
                console.log("No Metadata found, creating new");
                json = {}
                json[this.file] = {
                    'id' : this.file,
                    'game' : 'League of Legends',
                    'details' : this.details,
                    'parsed' : false
                }
            }
            console.log(JSON.stringify(json));
            fs.writeFile(this.file, JSON.stringify(json), (err) =>{
                if(err) {console.log("error writing file: " + err);}
            });
            console.log(json);
        });
    }
}

export default LeagueTracker;