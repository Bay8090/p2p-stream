const videoPlayer = document.getElementById('videoPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const inviteBtn = document.getElementById('inviteBtn');
const inviteMenu = document.getElementById('inviteMenu');
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const fileInput = document.getElementById('fileInput');

let peer, connections = [], isPlaying = false;

// Inicializar Peer
peer = new Peer();
peer.on('open', id => {
    document.getElementById('peerIdDisplay').innerText = "ID: " + id.substring(0,5);
    document.getElementById('inviteLink').value = window.location.href.split('#')[0] + "#" + id;
});

// Funcionamiento de Menús
inviteBtn.onclick = () => inviteMenu.classList.add('show');
document.getElementById('closeInvite').onclick = () => inviteMenu.classList.remove('show');
chatToggle.onclick = () => chatPanel.classList.toggle('show');
document.getElementById('closeChat').onclick = () => chatPanel.classList.remove('show');

// Seleccionar Video
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        videoPlayer.src = URL.createObjectURL(file);
        videoPlayer.play();
        playPauseBtn.innerText = "⏸";
        isPlaying = true;
    }
};

// Play / Pause
playPauseBtn.onclick = () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerText = "⏸";
    } else {
        videoPlayer.pause();
        playPauseBtn.innerText = "▶";
    }
};

// Progreso
videoPlayer.ontimeupdate = () => {
    const pct = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    document.getElementById('progressFill').style.width = pct + "%";
};

// Chat
document.getElementById('sendBtn').onclick = () => {
    const msg = document.getElementById('chatInput').value;
    if(msg) {
        const div = document.createElement('div');
        div.innerText = "Tú: " + msg;
        document.getElementById('chatMessages').appendChild(div);
        document.getElementById('chatInput').value = "";
    }
};
