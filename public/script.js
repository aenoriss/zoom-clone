const socket = io("/")
const videoGrid = document.getElementById("video-grid");

const myPeer = new Peer(undefined);

const myAudio = document.createElement("audio");
myAudio.muted = true;

const peers = [];

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
}).then(stream => {
    addVideoStream(myAudio, stream);

    myPeer.on("call", call => {
        call.answer(stream)

        call.on("stream", userVideoStream => {
            addVideoStream(audio, userVideoStream);
        })
    })

    socket.on("user-connected", userId => {
        connectToNewUser(userId, stream);
    })

    socket.on("user-disconnected", userId => {
        console.log("gg", userId);
        peers[userId].close();
    })
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const audio = document.createElement("video");
    call.on("stream", userVideoStream => {
        addVideoStream(audio, userVideoStream)
    })

    call.on("close", () => {
        audio.remove()
    })

    peers[userId] = call;
}

function addVideoStream(audio, stream) {
    audio.srcObject = stream;
    audio.addEventListener("loadedmetadata", () => {
        audio.play()
    })

    videoGrid.append(audio)
}