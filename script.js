const app = document.getElementById('app');
const videoPlayer = document.getElementById('videoPlayer');
const videoContainer = document.getElementById('videoContainer');
const playPauseBtn = document.getElementById('playPauseBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const orientationBtn = document.getElementById('orientationBtn');
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
    peer.on('connection', setupConnection);
    peer.on('call', call => {
        call.answer(videoPlayer.captureStream ? videoPlayer.captureStream() : null);
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
    if (data.cmd === 'play') { videoPlayer.play(); isPlaying = true; playPauseBtn.textContent = '⏸'; }
    else if (data.cmd === 'pause') { videoPlayer.pause(); isPlaying = false; playPauseBtn.textContent = '▶'; }
    else if (data.cmd === 'seek') videoPlayer.currentTime = data.time;
}

function broadcast(data) { connections.forEach(c => c.open && c.send(data)); }

videoContainer.addEventListener('click', () => {
    videoContainer.classList.add('tap-active');
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => videoContainer.classList.remove('tap-active'), 2000);
});

playPauseBtn.onclick = (e) => {
    e.stopPropagation();
    if (isPlaying) { videoPlayer.pause(); broadcast({type:'command', cmd:'pause'}); }
    else { videoPlayer.play(); broadcast({type:'command', cmd:'play'}); }
    isPlaying = !isPlaying; playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
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

document.getElementById('inviteBtn').onclick = () => document.getElementById('inviteMenu').classList.add('show');
document.getElementById('closeInvite').onclick = () => document.getElementById('inviteMenu').classList.remove('show');
document.getElementById('chatToggle').onclick = () => document.getElementById('chatPanel').classList.add('show');
document.getElementById('closeChat').onclick = () => document.getElementById('chatPanel').classList.remove('show');

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
    if (hash) setTimeout(() => setupConnection(peer.connect(hash)), 1000);
};
