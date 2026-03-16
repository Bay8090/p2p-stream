const peer = new Peer();
const videoEl = document.getElementById('mainVideo');
const sidebar = document.getElementById('sidebar');
let conn;

peer.on('open', id => {
    document.getElementById('my-id-display').innerText = "ID: " + id;
    if(window.location.hash) {
        const remoteId = window.location.hash.substring(1);
        connectTo(remoteId);
    }
});

document.getElementById('menuBtn').onclick = () => sidebar.classList.toggle('active');

function copyInvite() {
    const id = peer.id;
    const url = window.location.origin + window.location.pathname + "#" + id;
    if (navigator.share) {
        navigator.share({ title: '¡Mira conmigo!', text: 'Únete a mi stream:', url: url });
    } else {
        navigator.clipboard.writeText(url); alert("Link copiado!");
    }
}

document.getElementById('fileInput').onchange = (e) => {
    const file = e.target.files[0];
    videoEl.src = URL.createObjectURL(file);
    const stream = videoEl.captureStream();
    if(conn) peer.call(conn.peer, stream);
};

document.getElementById('shareScreenBtn').onclick = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    videoEl.srcObject = stream;
    const rId = prompt("ID del amigo:");
    if(rId) {
        conn = peer.connect(rId);
        peer.call(rId, stream);
    }
};

peer.on('connection', c => { conn = c; c.on('data', data => addMsg("Amigo", data)); });
peer.on('call', call => { call.answer(); call.on('stream', s => videoEl.srcObject = s); });

function addMsg(u, t) {
    const d = document.createElement('div'); d.innerText = u + ": " + t;
    document.getElementById('chat-box').appendChild(d);
}

document.getElementById('sendBtn').onclick = () => {
    const m = document.getElementById('msgInput').value;
    if(m && conn) { conn.send(m); addMsg("Tú", m); document.getElementById('msgInput').value = ""; }
};
