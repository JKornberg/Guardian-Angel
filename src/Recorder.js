const electron = window.require('electron');
const desktopCapturer = electron.desktopCapturer;
const fs = electron.remote.require('fs');
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
    constructor(){
        this.recording = false;
        this.active = true;
        this.blobs = [];
        this.recorder = null;
        this.game = null;
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
            console.log("callback: ");
            console.log(callback);
            if (this.recording){
                setTimeout(()=>this.stopRecording(callback), 5000);
            }
        } catch (e) {
            this.handleError(e) 
            return false;
        }})

    }

    handleStream = function(stream) {
        this.recorder = new MediaRecorder(stream);
        console.log(this.recorder);
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

    stopRecording(callback){
        console.log("Ending Recording")
        this.active = false;
        const save = () =>{
            toArrayBuffer(new Blob(this.blobs, {type: "video/webm;codecs=vp9"}), function(ab) {
                var buffer = toBuffer(ab);
                let date = new Date().getTime();
                var file = `./videos/LOL_${date}.webm`;
                fs.writeFile(file, buffer, function(err) {
                    if (err) {
                        console.error('Failed to save video ' + err);
                    } else {
                        console.log('Saved video: ' + file);
                        callback(file)
                    }
                });
            });
        }
        this.recording = false;
        this.recorder.onstop = save;
        this.recorder.stop();
        
    }


}

export default Recorder;