const  electron = require('electron');
const {ipcMain} = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');
const url = require('url');
const find = require('find-process');
const util = require('util');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let path = './videos/';
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, 
        height: 600, 
        webPreferences: {
            nodeIntegration: true,
            webSecurity : false,
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL('http://localhost:3000');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// Configure Electron Menu
const mainMenuTemplate = [{
    label: 'File',
    submenu : [
    {
        label : "Settings",
        click(){
            createSettingsWindow();
        }
    },
    {
        label : 'Quit',
        click(){
        app.quit();
        }
    }]
    }, {
        label: 'View',
        submenu : [
        {
            label : "Developer Tools",
            click(){
                focusedWindow.toggleDevTools();
            }
        }]
    }

]

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
    createWindow();
    mainWindow.on('closed', function() {mainWindow = null;});
  });

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('check-processes', async (event, arg) => {
    checkProcesses(event);
})

function checkProcesses(event) {
    find('name', 'League of Legends.exe')
    .then((list) => {
        event.reply('check-processes',list)}
    )
    .catch((err) => console.log(err));

}

// ipcMain.on('Track League', async (event, file) => {
//     let gameTracker = new LeagueTracker();
//     gameTracker.getCurrentMatchData();
// })


let fsReadDir = util.promisify(fs.readdir);
let fsReadFile = util.promisify(fs.readFile);

//Listens for request to load library
ipcMain.on('load-library', async (event, arg) =>{
    loadLibrary(event);
})

//reads directory and metadata to fill library
function loadLibrary(event){
    if(fs.existsSync(path+'currentMatch.json')){
        let dir = fsReadDir(path)
        let data = fsReadFile(path+'currentMatch.json')
        let promises = [dir, data];
        Promise.all(promises)
        .then((results) => {
            combineData(results[0],JSON.parse(results[1]), event);
        })
        .catch((err) => {
            console.log(err);
        })} 
    else{
        console.log("making file");
        fs.writeFile(path+'currentMatch.json', JSON.stringify({}), ()=>loadLibrary(event));
    }
}

function combineData(files, metadata, event){
        let games = [];
        let key = 0;
        for (var file of files){
            let f = file.split('.')
            let name = f[0];
            let ext = f[1];
            if (ext != 'mp4' && ext!= 'webm'){
                continue;
            }
            key += 1;
            let game = {};
            if (metadata[file]){
                let m = metadata[file];
                game = {
                    id : m.details.gameId,
                    game : m.game,
                    details : m.details,
                    parsed : m.parsed
                }
            }
            game['file'] = file;
            let stats = fs.stat(path+file, function(error, data){
                if (data){
                    data['date'] = data['birthtime'];
                    data['size'] = data['size']
                }
            })
            games.push(game);
        }
        event.reply('load-library', games);
}

ipcMain.on('refresh-historical', async( event, arg) => {
    console.log('refreshing historical data');
    event.reply('refresh-historical',arg);
})

ipcMain.on('Save Historical', async (event, arg) =>{
    console.log("Saving historical data");
    saveHistorical(arg);
});

function saveHistorical(object){
    if (!fs.existsSync(path+'historicalMatch.json')){
        fs.writeFile(path+'historicalMatch.json', JSON.stringify({}), saveHistorical(object));
    }
    fsReadFile(path+'historicalMatch.json')
    .then((resp) => {
        for (key in object){
            resp[key] = object[key];
        }
        fs.writeFile(path+'historicalMatch.json', JSON.stringify(resp), ()=>{console.log("SAVED HISTORICAL")})
    })
}







