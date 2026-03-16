const app = document.getElementById('app');
const videoPlayer = document.getElementById('videoPlayer');
const videoContainer = document.getElementById('videoContainer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressFill = document.getElementById('progressFill');
const peerIdDisplay = document.getElementById('peerIdDisplay');
const fileInput = document.getElementById('fileInput');
const inviteLink = document.getElementById('inviteLink');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

let hideControlsTimeout, peer, myId = '', connections = [], isPlaying = false;

function handleOrientation() {
    if (window.matchMedia("(orientation: landscape)").matches) {
        app.classList.add('landscape-mode'); app.classList.remove('portrait-mode');
    } else {
        app.classList.add('portrait-mode'); app.classList.remove('landscape-mode');
    }
}
window.addEventListener('resize', handleOrientation);
handleOrientation();

function initPeer() {
    peer = new Peer({ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
    peer.on('open', id => {
        myId = id;
        peerIdDisplay.textContent = "ID: " + id.substring(0, 6);
        inviteLink.value = window.location.href.split('#')[0] + "#" + id;
    });

    peer.on('connection', conn => {
        setupConnection(conn);
        setTimeout(() => {
            if (conn.open) {
                conn.send({
                    type: 'command',
                    cmd: 'sync',
                    time: videoPlayer.currentTime,
                    playing: !videoPlayer.paused
                });
            }
        }, 2000);
    });

    peer.on('call', call => {
        const stream = videoPlayer.captureStream ? videoPlayer.captureStream() : null;
        call.answer(stream);
        call.on('stream', s => videoPlayer.srcObject = s);
    });
}

function setupConnection(conn) {
    connections.push(conn);
    conn.on('data', data => {
        if (data.type === 'chat') addMessage(data.text, false, data.sender);
        else if (data.type === 'command') handleVideoCommand(data);
    });
}

function handleVideoCommand(data) {
    switch(data.cmd) {
        case 'play': videoPlayer.play(); isPlaying = true; break;
        case 'pause': videoPlayer.pause(); isPlaying = false; break;
        case 'seek': videoPlayer.currentTime = data.time; break;
        case 'sync':
            videoPlayer.currentTime = data.time;
            if (data.playing) videoPlayer.play(); else videoPlayer.pause();
            isPlaying = data.playing;
            break;
    }
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
}

function broadcast(data) { connections.forEach(c => c.open && c.send(data)); }

playPauseBtn.onclick = (e) => {
    e.stopPropagation();
    if (videoPlayer.paused) {
        videoPlayer.play(); broadcast({type:'command', cmd:'play'});
    } else {
        videoPlayer.pause(); broadcast({type:'command', cmd:'pause'});
    }
    isPlaying = !videoPlayer.paused;
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
};

document.getElementById('progressContainer').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * videoPlayer.duration;
    videoPlayer.currentTime = newTime;
    broadcast({type: 'command', cmd: 'seek', time: newTime});
};

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        videoPlayer.src = URL.createObjectURL(file);
        videoPlayer.onloadedmetadata = () => {
            const stream = videoPlayer.captureStream();
            connections.forEach(c => peer.call(c.peer, stream));
        };
    }
};

document.getElementById('sendBtn').onclick = () => {
    const text = chatInput.value.trim();
    if (text) {
        broadcast({ type: 'chat', text, sender: myId });
        addMessage(text, true); chatInput.value = '';
    }
};

function addMessage(text, own, sender) {
    const div = document.createElement('div');
    div.className = "message " + (own ? "own" : "");
    div.innerHTML = (own ? "" : "<b>" + sender.substring(0,4) + ":</b> ") + text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

window.onload = () => {
    initPeer();
    const hash = window.location.hash.substring(1);
    if (hash) {
        const conn = peer.connect(hash);
        conn.on('open', () => setupConnection(conn));
    }
};
