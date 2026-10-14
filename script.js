// ==========================================
// 1. CONFIGURATION FIREBASE & SERVICES
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDVv_oN6LDQzUEeO5-vxgiQKSnA4p39PSM",
    authDomain: "fedchat-e604b.firebaseapp.com",
    databaseURL: "https://fedchat-e604b-default-rtdb.firebaseio.com", 
    projectId: "fedchat-e604b",
    storageBucket: "fedchat-e604b.firebasestorage.app",
    messagingSenderId: "988159515018",
    appId: "1:988159515018:web:93a09a3fd007d3771b9073"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// Dom Elements
const authScreen = document.getElementById('authScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const notifSound = document.getElementById('notificationSound');
const ringtoneSound = document.getElementById('ringtoneSound');

const mainMenuBtn = document.getElementById('mainMenuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const themeBtn = document.getElementById('themeBtn');
const privacyBtn = document.getElementById('privacyBtn');
const privacyModal = document.getElementById('privacyModal');
const closePrivacyBtn = document.getElementById('closePrivacyBtn');

const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const cancelNewChat = document.getElementById('cancelNewChat');
const connectPeerBtn = document.getElementById('connectPeerBtn');
const peerIdInput = document.getElementById('peerIdInput');
const conversationsList = document.getElementById('conversationsList');
const sidebar = document.getElementById('sidebar');
const chatMain = document.getElementById('chatMain');
const backToListBtn = document.getElementById('backToListBtn');

const soundToggle = document.getElementById('soundToggle');
const soundSelect = document.getElementById('soundSelect');
const shareOnlineToggle = document.getElementById('shareOnlineToggle');
const readReceiptsToggle = document.getElementById('readReceiptsToggle');

const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesArea = document.getElementById('messagesArea');
const chattingWithDisplay = document.getElementById('chattingWithDisplay');
const friendStatusDisplay = document.getElementById('friendStatusDisplay');
const callBtnContainer = document.getElementById('callBtnContainer');
const typingIndicator = document.getElementById('typingIndicator');

const attachBtn = document.getElementById('attachBtn');
const imageInput = document.getElementById('imageInput');
const stickerBtn = document.getElementById('stickerBtn');
const stickerPicker = document.getElementById('stickerPicker');
const voiceBtn = document.getElementById('voiceBtn');

let currentUserId = null;
let currentPeerId = null;
let chatRef = null;
let typingRef = null;
let isSoundEnabled = localStorage.getItem('fedchat_sound_enabled') !== 'false';
let shareOnline = localStorage.getItem('fedchat_share_online') !== 'false';
let readReceipts = localStorage.getItem('fedchat_read_receipts') !== 'false';

soundToggle.checked = isSoundEnabled;
shareOnlineToggle.checked = shareOnline;
readReceiptsToggle.checked = readReceipts;

// ==========================================
// 2. AUTHENTIFICATION & PROFILE (NOM & ID)
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.email.split('@')[0];
        document.getElementById('myIdDisplay').innerText = `@${currentUserId}`;
        
        // Chache non itilizatè a nan baz done a
        db.ref(`users/${currentUserId}/name`).once('value').then((snap) => {
            const userName = snap.val() || currentUserId;
            document.getElementById('myNameDisplay').innerText = userName;
        });

        authScreen.classList.remove('active');
        chatScreen.classList.add('active');
        
        setupPresence();
        loadConversations();
    } else {
        currentUserId = null;
        currentPeerId = null;
        chatScreen.classList.remove('active');
        authScreen.classList.add('active');
    }
});

function setupPresence() {
    if (!shareOnline) return;
    const userStatusRef = db.ref(`users/${currentUserId}/status`);
    const connectedRef = db.ref('.info/connected');
    
    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            userStatusRef.onDisconnect().set('offline');
            userStatusRef.set('online');
        }
    });
}

document.getElementById('showSignup').addEventListener('click', () => {
    loginForm.style.display = 'none'; signupForm.style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', () => {
    signupForm.style.display = 'none'; loginForm.style.display = 'block';
});

document.getElementById('signupBtn').addEventListener('click', () => {
    const name = document.getElementById('signupName').value.trim();
    const id = document.getElementById('signupId').value.trim().toLowerCase();
    const pass = document.getElementById('signupPassword').value;
    
    if(!name || !id || pass.length < 6) {
        return alert("Tanpri antre non ou, yon ID, ak yon modpas (omwen 6 karaktè).");
    }
    
    auth.createUserWithEmailAndPassword(`${id}@fedchat.com`, pass)
        .then((cred) => {
            // Sove non itilizatè a nan baz done a
            db.ref(`users/${id}/name`).set(name);
            alert("Kont kreye avèk siksè!");
        })
        .catch(err => alert("Erè : " + err.message));
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const id = document.getElementById('loginId').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;
    if(!id || !pass) return alert("Ranpli tout chan yo tanpri.");
    auth.signInWithEmailAndPassword(`${id}@fedchat.com`, pass)
        .catch(err => alert("Erè koneksyon. Verifye ID oswa modpas ou."));
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if(shareOnline) db.ref(`users/${currentUserId}/status`).set('offline');
    auth.signOut();
});

// ==========================================
// 3. MENU & NAVIGATION
// ==========================================
mainMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
});
document.addEventListener('click', () => dropdownMenu.style.display = 'none');

themeBtn.addEventListener('click', () => document.body.classList.toggle('light-theme'));
privacyBtn.addEventListener('click', () => privacyModal.style.display = 'flex');
closePrivacyBtn.addEventListener('click', () => privacyModal.style.display = 'none');

newChatBtn.addEventListener('click', () => newChatModal.style.display = 'flex');
cancelNewChat.addEventListener('click', () => newChatModal.style.display = 'none');

connectPeerBtn.addEventListener('click', () => {
    const peer = peerIdInput.value.trim().toLowerCase();
    if(!peer || peer === currentUserId) return alert("ID sa a pa valab.");
    currentPeerId = peer;
    newChatModal.style.display = 'none';
    peerIdInput.value = '';
    openChat(currentPeerId);
});

backToListBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden-mobile');
    chatMain.classList.add('hidden-mobile');
    currentPeerId = null;
});

// ==========================================
// 4. LIS KONVÈSASYON AK CHAT
// ==========================================
function loadConversations() {
    db.ref(`users/${currentUserId}/chats`).on('value', (snapshot) => {
        conversationsList.innerHTML = '';
        const chats = snapshot.val();
        if (!chats) {
            conversationsList.innerHTML = '<div class="no-chats-placeholder">Pa gen konvèsasyon ankò.</div>';
            return;
        }

        Object.keys(chats).forEach(peerId => {
            const chatData = chats[peerId];
            
            // Chache non zanmi an
            db.ref(`users/${peerId}/name`).once('value').then((snap) => {
                const friendName = snap.val() || peerId;
                const div = document.createElement('div');
                div.className = `conv-item ${currentPeerId === peerId ? 'active' : ''}`;
                div.innerHTML = `
                    <div class="avatar-circle"><i class="fa-solid fa-user"></i></div>
                    <div class="conv-info">
                        <div class="conv-name">${friendName}</div>
                        <div class="conv-last-msg">${chatData.lastMessage || 'Klike pou w pale'}</div>
                    </div>
                `;
                div.addEventListener('click', () => openChat(peerId));
                conversationsList.appendChild(div);
            });
        });
    });
}

function openChat(peerId) {
    currentPeerId = peerId;
    
    db.ref(`users/${peerId}/name`).once('value').then((snap) => {
        chattingWithDisplay.innerText = snap.val() || peerId;
    });

    callBtnContainer.style.display = 'flex';
    messageInput.disabled = false;
    sendBtn.disabled = false;
    
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden-mobile');
        chatMain.classList.remove('hidden-mobile');
        backToListBtn.style.display = 'block';
    }

    db.ref(`users/${peerId}/status`).on('value', (snap) => {
        const status = snap.val();
        friendStatusDisplay.innerText = status === 'online' ? 'An liy (online)' : 'Offline';
    });

    loadMessages();
}

// ==========================================
// 5. MESSAGERIE (FOTO, STICKERS, VWA)
// ==========================================
function loadMessages() {
    const chatId = [currentUserId, currentPeerId].sort().join('_');
    messagesArea.innerHTML = '';
    
    if(chatRef) chatRef.off();
    if(typingRef) typingRef.off();

    chatRef = db.ref(`chats/${chatId}/messages`);
    chatRef.on('child_added', (snapshot) => {
        const msg = snapshot.val();
        const msgKey = snapshot.key;
        const isMe = msg.sender === currentUserId;

        if (!isMe && readReceipts && msg.status !== 'read') {
            db.ref(`chats/${chatId}/messages/${msgKey}`).update({ status: 'read' });
        }

        const div = document.createElement('div');
        div.className = `message-bubble ${isMe ? 'msg-sent' : 'msg-received'}`;
        
        let contentHtml = '';
        if (msg.type === 'image') {
            contentHtml = `<img src="${msg.text}" class="msg-img">`;
        } else if (msg.type === 'audio') {
            contentHtml = `<audio controls src="${msg.text}" style="max-width: 200px;"></audio>`;
        } else {
            contentHtml = `<span>${msg.text}</span>`;
        }

        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const ticks = isMe ? `<span class="msg-ticks ${msg.status === 'read' ? 'read' : ''}">${msg.status === 'read' ? '✓✓' : '✓'}</span>` : '';
        
        div.innerHTML = `${contentHtml}<span class="msg-time">${timeStr}</span>${ticks}`;
        messagesArea.appendChild(div);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        if(!isMe && isSoundEnabled && notifSound) {
            notifSound.play().catch(e => console.log(e));
        }
    });

    typingRef = db.ref(`chats/${chatId}/typing/${currentPeerId}`);
    typingRef.on('value', (snap) => {
        typingIndicator.style.display = snap.val() ? 'flex' : 'none';
    });
}

let typingTimer;
messageInput.addEventListener('input', () => {
    if (!currentPeerId) return;
    const chatId = [currentUserId, currentPeerId].sort().join('_');
    db.ref(`chats/${chatId}/typing/${currentUserId}`).set(true);
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        db.ref(`chats/${chatId}/typing/${currentUserId}`).set(false);
    }, 1500);
});

sendBtn.addEventListener('click', () => sendMessage());
messageInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

function sendMessage(text = null, type = 'text') {
    const txt = text || messageInput.value.trim();
    if(!txt || !currentPeerId) return;

    const chatId = [currentUserId, currentPeerId].sort().join('_');
    const msgRef = db.ref(`chats/${chatId}/messages`).push();
    
    msgRef.set({
        sender: currentUserId,
        text: txt,
        type: type,
        status: 'sent',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    db.ref(`users/${currentUserId}/chats/${currentPeerId}`).set({ lastMessage: type === 'image' ? '[Foto]' : txt, time: Date.now() });
    db.ref(`users/${currentPeerId}/chats/${currentUserId}`).set({ lastMessage: type === 'image' ? '[Foto]' : txt, time: Date.now() });

    if(!text) messageInput.value = '';
}

attachBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        sendMessage(event.target.result, 'image');
    };
    reader.readAsDataURL(file);
});

stickerBtn.addEventListener('click', () => {
    stickerPicker.style.display = stickerPicker.style.display === 'block' ? 'none' : 'block';
});
document.querySelectorAll('.sticker-item').forEach(item => {
    item.addEventListener('click', () => {
        sendMessage(item.innerText, 'text');
        stickerPicker.style.display = 'none';
    });
});

let mediaRecorder;
let audioChunks = [];
voiceBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    sendMessage(reader.result, 'audio');
                };
            };
            
            mediaRecorder.start();
            voiceBtn.style.color = "#ff4d4d";
            alert("Anrejistreman kòmanse... Klike ankò pou voye.");
        } catch (err) {
            alert("Pa gen aksè ak mikwofòn nan.");
        }
    } else {
        mediaRecorder.stop();
        voiceBtn.style.color = "white";
    }
});

// ==========================================
// 6. APÈL (PEERJS)
// ==========================================
let peer = null;
let currentCall = null;
let localStream = null;

const videoModal = document.getElementById('videoModal');
const callStatus = document.getElementById('callStatus');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const answerBtn = document.getElementById('answerBtn');
const hangupBtn = document.getElementById('hangupBtn');
const audioCallBtn = document.getElementById('audioCallBtn');
const videoCallBtn = document.getElementById('videoCallBtn');

auth.onAuthStateChanged((user) => {
    if (user) {
        if (peer) peer.destroy();
        peer = new Peer(currentUserId);
        
        peer.on('call', (call) => {
            currentCall = call;
            videoModal.style.display = 'flex';
            callStatus.innerText = `${call.peer} ap rele w...`;
            answerBtn.style.display = 'flex';
            if (ringtoneSound) ringtoneSound.play().catch(e => console.log(e));

            answerBtn.onclick = () => {
                if (ringtoneSound) ringtoneSound.pause();
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                    localStream = stream;
                    localVideo.srcObject = stream;
                    answerBtn.style.display = 'none';
                    call.answer(stream);
                    call.on('stream', remoteStream => remoteVideo.srcObject = remoteStream);
                });
            };
        });
    }
});

function startCall(isVideo) {
    if (!currentPeerId) return;
    navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true }).then(stream => {
        localStream = stream;
        localVideo.srcObject = isVideo ? stream : null;
        videoModal.style.display = 'flex';
        callStatus.innerText = `Ap rele ${currentPeerId}...`;

        const call = peer.call(currentPeerId, stream);
        currentCall = call;
        call.on('stream', remoteStream => remoteVideo.srcObject = remoteStream);
    }).catch(err => alert("Erè kamera/mikwo: " + err.message));
}

audioCallBtn.addEventListener('click', () => startCall(false));
videoCallBtn.addEventListener('click', () => startCall(true));
hangupBtn.addEventListener('click', () => {
    if (currentCall) currentCall.close();
    videoModal.style.display = 'none';
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (ringtoneSound) ringtoneSound.pause();
});
