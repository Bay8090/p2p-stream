const video = document.getElementById('videoPlayer');
const chatPanel = document.getElementById('chatPanel');
const inviteMenu = document.getElementById('inviteMenu');
let peer, connections = [];

// Funciones de UI
function toggleChat() { chatPanel.classList.toggle('active'); }
function openInvite() { inviteMenu.style.display = 'flex'; }
function closeInvite() { inviteMenu.style.display = 'none'; }

function loadVideo(event) {
    const file = event.target.files[0];
    if (file) {
        video.src = URL.createObjectURL(file);
        video.play();
        document.getElementById('playPauseBtn').innerText = "⏸";
    }
}

function togglePlay() {
    if (video.paused) { video.play(); document.getElementById('playPauseBtn').innerText = "⏸"; }
    else { video.pause(); document.getElementById('playPauseBtn').innerText = "▶"; }
    broadcast({ type: 'control', cmd: video.paused ? 'pause' : 'play' });
}

function copyLink() {
    const link = document.getElementById('inviteLink');
    link.select();
    document.execCommand('copy');
    alert("¡Enlace copiado!");
}

// PeerJS
peer = new Peer();
peer.on('open', id => {
    document.getElementById('peerIdDisplay').innerText = "ID: " + id.substring(0,6);
    document.getElementById('inviteLink').value = window.location.origin + window.location.pathname + "#" + id;
});

peer.on('connection', conn => {
    connections.push(conn);
    conn.on('data', data => {
        if (data.type === 'chat') addMsg(data.user, data.msg);
        if (data.type === 'control') data.cmd === 'play' ? video.play() : video.pause();
    });
});

function broadcast(data) {
    connections.forEach(c => { if (c.open) c.send(data); });
}

function sendMsg() {
    const input = document.getElementById('chatInput');
    if (input.value) {
        addMsg("Tú", input.value);
        broadcast({ type: 'chat', user: "Amigo", msg: input.value });
        input.value = "";
    }
}

function addMsg(user, msg) {
    const box = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.innerHTML = `<b>${user}:</b> ${msg}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Sincronizar barra de progreso
video.ontimeupdate = () => {
    const pct = (video.currentTime / video.duration) * 100;
    document.getElementById('progressFill').style.width = pct + "%";
};
