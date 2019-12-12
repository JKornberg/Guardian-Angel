const electron = window.require('electron');
const LCUConnector = electron.remote.require('lcu-connector');
const fs = electron.remote.require('fs');

class LeagueTracker{
    constructor(){
        var that = this;
        this.connector = new LCUConnector();
        this.makeCall = this.makeCall.bind(this); 
        this.connector.on('connect', (data) => {
            this.getSummoner(data);
            this.getGame(data);
        })
        this.connector.start();
        this.details = {};
        this.saveMetadata = this.saveMetadata.bind(this);
        console.log("Initialized Tracker")
    }

    getSummoner = function(data){
        this.makeCall(data, '/lol-summoner/v1/current-summoner', 'summoner')
    }

    getGame = function(data){
        this.makeCall(data, '/lol-gameflow/v1/session', 'game')
    }


    makeCall = function(data, call, detail){
        let base = data.protocol + '://' + data.address + ':' + data.port
        let auth = 'Basic ' + btoa(data.username + ':' + data.password);
        let myHeaders = new Headers({
            'Accept': 'application/json',
            'Authorization' : auth,
            'strictSSL' : false
        })
        let response = fetch(base+call, {headers: myHeaders})
        .then(response => response.json())
        .then(d => {
            this.details[detail] = d;
            this.printThing();
        })
        .catch(err => console.log(err));
    }

    printThing(){
        console.log(this.details);
    }

    saveMetadata = function(location, file){
        fs.readFile(location, (err, data) => {
            let json;
            try{
                json = JSON.parse(data);
                json[file] = {
                    'id' : file,
                    'game' : 'League of Legends',
                    'details' : this.details,
                    'parsed' : false,
                }
            }
            catch{
                console.log("No Metadata found, creating new");
                json = {}
                json[file] = {
                    'id' : file,
                    'game' : 'League of Legends',
                    'details' : this.details,
                    'parsed' : false
                }
            }
            console.log(JSON.stringify(json));
            fs.writeFile(location, JSON.stringify(json), (err) =>{
                if(err) {console.log("error writing file: " + err);}
            });
            console.log(json);
        });
    }
}

export default LeagueTracker;