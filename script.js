document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const fileInput = document.getElementById('fileInput');
    const inviteBtn = document.getElementById('inviteBtn');
    const inviteMenu = document.getElementById('inviteMenu');
    const chatToggle = document.getElementById('chatToggle');
    const chatPanel = document.getElementById('chatPanel');
    const progressFill = document.getElementById('progressFill');

    let peer = new Peer();
    let connections = [];

    // --- Funciones de Interfaz ---
    playPauseBtn.onclick = () => {
        if (video.paused) { video.play(); playPauseBtn.innerText = "⏸"; }
        else { video.pause(); playPauseBtn.innerText = "▶"; }
        broadcast({ type: 'control', action: video.paused ? 'pause' : 'play' });
    };

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            video.src = URL.createObjectURL(file);
            video.play();
            playPauseBtn.innerText = "⏸";
        }
    };

    inviteBtn.onclick = () => inviteMenu.style.display = 'flex';
    document.getElementById('closeInvite').onclick = () => inviteMenu.style.display = 'none';
    chatToggle.onclick = () => chatPanel.classList.toggle('active');
    document.getElementById('closeChat').onclick = () => chatPanel.classList.remove('active');

    // --- P2P Lógica ---
    peer.on('open', id => {
        document.getElementById('peerIdDisplay').innerText = "ID: " + id.substring(0,6);
        document.getElementById('inviteLink').value = window.location.origin + window.location.pathname + "#" + id;
    });

    peer.on('connection', conn => {
        connections.push(conn);
        conn.on('data', data => handleData(data));
    });

    function broadcast(obj) {
        connections.forEach(c => { if(c.open) c.send(obj); });
    }

    function handleData(data) {
        if(data.type === 'control') {
            if(data.action === 'play') video.play();
            else video.pause();
        }
    }

    // --- Progreso ---
    video.ontimeupdate = () => {
        const pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = pct + "%";
        document.getElementById('timeDisplay').innerText = formatTime(video.currentTime) + " / " + formatTime(video.duration);
    };

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ":" + (s < 10 ? "0" + s : s);
    }
});
