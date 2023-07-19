
var socket = io.connect("http://localhost:3000");

var videoChatForm = document.getElementById("form-container");
var videoChatRooms = document.getElementById("video-chat-rooms");
var joinButton = document.getElementById('joinButton');
var roomInput = document.getElementById("roomName");
var userVideo = document.getElementById("user-1");
var peerVideo = document.getElementById("user-2");
var cameraButton = document.getElementById("camera-btn");
var micButton = document.getElementById("mic-btn");
var endCallButton = document.getElementById("leave-btn");
var userStream;
var rtcPeerConnection;

var iceServer = {
    iceServers: [
        {
            urls: ['stun:stun.services.mozilla.com', 'stun:stun.l.google.com:19302'],
        },
    ],
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


var creator = false;


joinButton.addEventListener('click', function (e) {
    console.log("click")
    e.preventDefault();
    let roomNameInput = document.getElementById('roomName');
    roomName = roomNameInput.value
    if(roomName == ''){
        alert("Please enter a room name")
    }
    else{
        socket.emit('join', roomName);
        console.log(roomName)
        videoChatForm.style.display = 'none';
        videoChatRooms.style.display = 'block';
    }
  
});
socket.on("created", function (roomName) {
    creator = true;
    navigator.getUserMedia({
        video: {  width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },},
        audio: true
    },
        function (stream) {
            userStream = stream;
            document.getElementById('user-2').style.display = 'block'
            document.getElementById('user-1').classList.add('smallFrame')
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            };
        },
        function (err) {
            alert("Please enable access and attach a camera");
        }
    );
}
);
socket.on("joined", function (roomName) {
    creator = false;
    navigator.getUserMedia({
        video: {  width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 }, },
        audio: true
    },
        function (stream) {
            userStream = stream;
            document.getElementById('user-2').style.display = 'block'
            document.getElementById('user-1').classList.add('smallFrame')
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            };
            socket.emit("ready", roomName);
        },
        function (err) {
            alert("Please enable access and attach a camera");
        }
    );

});
socket.on("ready", function () {
    if (creator) {

        rtcPeerConnection = new RTCPeerConnection(iceServer);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer(
            function (offer) {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", roomName, offer);
            },
            function (error) {
                console.log(error);
            }
        );

    }

});

socket.on("offer", function (offer) {
    if (!creator) {

        rtcPeerConnection = new RTCPeerConnection(iceServer);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
            function (answer) {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", roomName, answer);
            },
            function (error) {
                console.log(error);
            }
        );

    }
}
);
socket.on("answer", function (answer) {
    rtcPeerConnection.setRemoteDescription(answer);
    console.log("answer", answer);
});


socket.on("candidate", function (candidate) {
    const iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);

});

function OnIceCandidateFunction(event) {
    if (event.candidate) {
        socket.emit("candidate", roomName, event.candidate);
    }
}
function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function (e) {
        peerVideo.play();
    };
}

cameraButton.addEventListener("click", function () {
    let enabled = userStream.getVideoTracks()[0].enabled;
    if (enabled) {
        userStream.getVideoTracks()[0].enabled = false;
        cameraButton.innerHTML = "Camera On";
    } else {
        userStream.getVideoTracks()[0].enabled = true;
        cameraButton.innerHTML = "Camera Off";
    }
}
);

micButton.addEventListener("click", function () {
    let enabled = userStream.getAudioTracks()[0].enabled;
    if (enabled) {
        userStream.getAudioTracks()[0].enabled = false;
        micButton.innerHTML = "Mic On";
    } else {
        userStream.getAudioTracks()[0].enabled = true;
        micButton.innerHTML = "Mic Off";
    }
}
);

endCallButton.addEventListener("click", function () {
    userStream.getTracks().forEach(function (track) {
        track.stop();
    });
    window.location.reload();
}
);