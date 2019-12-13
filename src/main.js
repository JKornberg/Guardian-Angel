const  electron = require('electron');
const {ipcMain} = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');
const path = require('path');
const url = require('url');
const find = require('find-process');
const util = require('util');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
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
// const mainMenuTemplate = [{
//     label: 'File',
//     submenu : [
//     {
//         label : "Settings",
//         click(){
//             createSettingsWindow();
//         }
//     },
//     {
//         label : 'Quit',
//         click(){
//         app.quit();
//         }
//     }]
//     }, {
//         label: 'View',
//         submenu : [
//         {
//             label : "Developer Tools",
//             click(){
//                 focusedWindow.toggleDevTools();
//             }
//         }]
//     }

// ]

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


let fsReadDir = util.promisify(fs.readdir);
let fsReadFile = util.promisify(fs.readFile);

//Listens for request to load library
ipcMain.on('load-library', async (event, arg) =>{
    loadLibrary(event);
})

//reads directory and metadata to fill library
function loadLibrary(event){
    let filePath = './videos';
    if(fs.existsSync(filePath+'/metadata.json')){
        let dir = fsReadDir(filePath)
        let data = fsReadFile(filePath+'/metadata.json')
        let promises = [dir, data];
        Promise.all(promises)
        .then((results) => {
            combineData(results[0],results[1], event);
        })
        .catch((err) => {
            console.log(err);
        })} 
    else{
        console.log("making file");
        fs.writeFile(filePath+'/metadata.json', JSON.stringify({}), loadLibrary);
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
        event.reply('load-library', games);
}








