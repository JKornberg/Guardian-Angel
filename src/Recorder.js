const electron = window.require('electron');
const desktopCapturer = electron.desktopCapturer;
const fs = electron.remote.require('fs');
const log = electron.remote.require('electron-log')
function toArrayBuffer(blob, cb) {
    let fileReader = new FileReader();
    fileReader.onload = function() {
        let arrayBuffer = this.result;
        cb(arrayBuffer);
    };
    fileReader.readAsArrayBuffer(blob);
}

function toBuffer(ab) {
    let buffer =  Buffer.alloc(ab.byteLength);
    let arr = new Uint8Array(ab);
    for (let i = 0; i < arr.byteLength; i++) {
        buffer[i] = arr[i];
    }
    return buffer;
}

class Recorder{
    constructor(location){
        this.recording = false;
        this.active = true;
        this.blobs = [];
        this.recorder = null;
        this.game = null;
        this.path = location;
        let date = new Date().getTime();
        this.file = `LOL_${date}.webm`;

        // this.startRecording = this.startRecording.bind(this);
        // this.handleStream = this.handleStream.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
    }
    
    startRecording(callback){
        desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        let src;
        for (const source of sources) {   
            if (source.name === 'League of Legends (TM) Client') {
                console.log('Screen Found');
                this.game = "League of Legends";
                src = source;
                break;
            }
        }
        if (src == null){
            console.log("no screen found")
            return false;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
                // {
                //     mandatory: {
                //     chromeMediaSource: 'desktop'
                // }
                //},
            video: {
                mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: src.id,
                minWidth: 1280,
                maxWidth: 2560,
                minHeight: 720,
                maxHeight: 1440
                }
            }
            })
            this.recording = true;
            this.handleStream(stream)
            callback(true, this.file)
            if (this.recording){
                setTimeout(()=>this.stopRecording(), 5000);
            }
        } catch (e) {
            this.handleError(e) 
            return false;
        }})

    }

    handleStream = function(stream) {
        this.recorder = new MediaRecorder(stream);
        this.blobs = [];
        this.recorder.ondataavailable = function(event) {
            this.blobs.push(event.data);
        };
        this.recorder.ondataavailable = this.recorder.ondataavailable.bind(this);
        this.recorder.start();
    }


    handleError = function(e) {
        console.error('handleUserMediaError', e);
    }

    stopRecording(){
        console.log("Ending Recording")
        this.active = false;
        this.recording = false;
        this.recorder.stop();  
        const save = () =>{
            toArrayBuffer(new Blob(this.blobs, {type: "video/webm;codecs=vp9"}), (ab)=> {
                var buffer = toBuffer(ab);
 
                fs.writeFile(this.path + this.file, buffer, (err) => {
                    if (err) {
                        console.error('Failed to save video ' + err);
                    } else {
                        console.log('Saved video: ' + this.path + this.file);
                    }
                });
            });
        }
        this.recorder.onstop = save;

    }


}

export default Recorder;