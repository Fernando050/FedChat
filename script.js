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

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
    });
}

// Éléments du DOM
const authScreen = document.getElementById('authScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const notifSound = document.getElementById('notificationSound');
const ringtoneSound = document.getElementById('ringtoneSound');

const mainMenuBtn = document.getElementById('mainMenuBtn');
const chatHeaderMenuBtn = document.getElementById('chatHeaderMenuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const themeBtn = document.getElementById('themeBtn');
const privacyBtn = document.getElementById('privacyBtn');
const privacyModal = document.getElementById('privacyModal');
const closePrivacyBtn = document.getElementById('closePrivacyBtn');

const editMsgBtn = document.getElementById('editMsgBtn');
const deleteMsgBtn = document.getElementById('deleteMsgBtn');

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

let selectedMessageId = null;
let selectedMessageSender = null;
let selectedMessageText = "";

let isSoundEnabled = localStorage.getItem('fedchat_sound_enabled') !== 'false';
let shareOnline = localStorage.getItem('fedchat_share_online') !== 'false';
let readReceipts = localStorage.getItem('fedchat_read_receipts') !== 'false';

soundToggle.checked = isSoundEnabled;
shareOnlineToggle.checked = shareOnline;
readReceiptsToggle.checked = readReceipts;

// ==========================================
// 2. AUTHENTIFICATION & PRÉSENCE (ONLINE)
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.email.split('@')[0];
        document.getElementById('myIdDisplay').innerText = currentUserId;
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
    const id = document.getElementById('signupId').value.trim().toLowerCase();
    const pass = document.getElementById('signupPassword').value;
    if(!id || pass.length < 6) return alert("Veuillez entrer un ID et un mot de passe (au moins 6 caractères).");
    auth.createUserWithEmailAndPassword(`${id}@fedchat.com`, pass)
        .then(() => alert("Compte créé avec succès !"))
        .catch(err => alert("Erreur : " + err.message));
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const id = document.getElementById('loginId').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;
    if(!id || !pass) return alert("Veuillez remplir tous les champs.");
    auth.signInWithEmailAndPassword(`${id}@fedchat.com`, pass)
        .catch(err => alert("Erreur de connexion. Vérifiez votre ID ou mot de passe."));
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if(shareOnline) db.ref(`users/${currentUserId}/status`).set('offline');
    auth.signOut();
});

// ==========================================
// 3. MENU & NAVIGATION
// ==========================================
function toggleMenu(e) {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
}

mainMenuBtn.addEventListener('click', toggleMenu);
if(chatHeaderMenuBtn) chatHeaderMenuBtn.addEventListener('click', toggleMenu);

document.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
});

themeBtn.addEventListener('click', () => document.body.classList.toggle('light-theme'));
privacyBtn.addEventListener('click', () => privacyModal.style.display = 'flex');
closePrivacyBtn.addEventListener('click', () => privacyModal.style.display = 'none');

newChatBtn.addEventListener('click', () => newChatModal.style.display = 'flex');
cancelNewChat.addEventListener('click', () => newChatModal.style.display = 'none');

connectPeerBtn.addEventListener('click', () => {
    const peer = peerIdInput.value.trim().toLowerCase();
    if(!peer || peer === currentUserId) return alert("Cet ID n'est pas valide.");
    currentPeerId = peer;
    newChatModal.style.display = 'none';
    peerIdInput.value = '';
    openChat(currentPeerId);
});

backToListBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden-mobile');
    chatMain.classList.add('hidden-mobile');
    currentPeerId = null;
    clearSelection();
});

function clearSelection() {
    if(selectedMessageId) {
        const prevSelected = document.getElementById(`msg_${selectedMessageId}`);
        if(prevSelected) prevSelected.classList.remove('selected');
    }
    selectedMessageId = null;
    selectedMessageSender = null;
    selectedMessageText = "";
    editMsgBtn.classList.add('disabled-menu-item');
    deleteMsgBtn.classList.add('disabled-menu-item');
}

// MODIFIER UN MESSAGE
editMsgBtn.addEventListener('click', () => {
    if(!selectedMessageId) return;
    if(selectedMessageSender !== currentUserId) {
        alert("Vous ne pouvez modifier que vos propres messages.");
        return;
    }
    
    const newText = prompt("Modifier le message :", selectedMessageText);
    if(newText && newText.trim() !== "" && newText.trim() !== selectedMessageText) {
        const chatId = [currentUserId, currentPeerId].sort().join('_');
        db.ref(`chats/${chatId}/messages/${selectedMessageId}`).update({
            text: newText.trim(),
            isEdited: true
        }).then(() => clearSelection());
    }
});

// SUPPRIMER UN MESSAGE
deleteMsgBtn.addEventListener('click', () => {
    if(!selectedMessageId) return;
    if(confirm("Voulez-vous vraiment supprimer ce message ?")) {
        const chatId = [currentUserId, currentPeerId].sort().join('_');
        db.ref(`chats/${chatId}/messages/${selectedMessageId}`).remove()
            .then(() => clearSelection());
    }
});

// ==========================================
// 4. LISTE DES CONVERSATIONS
// ==========================================
function loadConversations() {
    db.ref(`users/${currentUserId}/chats`).on('value', (snapshot) => {
        conversationsList.innerHTML = '';
        const chats = snapshot.val();
        if (!chats) {
            conversationsList.innerHTML = '<div class="no-chats-placeholder">Aucune conversation pour le moment.</div>';
            return;
        }

        Object.keys(chats).forEach(peerId => {
            const chatData = chats[peerId];
            const div = document.createElement('div');
            div.className = `conv-item ${currentPeerId === peerId ? 'active' : ''}`;
            div.innerHTML = `
                <div class="avatar-circle"><i class="fa-solid fa-user"></i></div>
                <div class="conv-info">
                    <div class="conv-name">${peerId}</div>
                    <div class="conv-last-msg">${chatData.lastMessage || 'Cliquer pour discuter'}</div>
                </div>
            `;
            div.addEventListener('click', () => openChat(peerId));
            conversationsList.appendChild(div);
        });
    });
}

function openChat(peerId) {
    currentPeerId = peerId;
    chattingWithDisplay.innerText = currentPeerId;
    callBtnContainer.style.display = 'flex';
    messageInput.disabled = false;
    sendBtn.disabled = false;
    clearSelection();
    
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden-mobile');
        chatMain.classList.remove('hidden-mobile');
    }

    db.ref(`users/${peerId}/status`).on('value', (snap) => {
        const status = snap.val();
        friendStatusDisplay.innerText = status === 'online' ? 'En ligne' : 'Hors ligne';
    });

    loadMessages();
}

// ==========================================
// 5. MESSAGERIE (PHOTOS, STICKERS, VOICE, EDIT/DELETE)
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
        div.id = `msg_${msgKey}`;
        
        let contentHtml = '';
        if (msg.type === 'image') {
            contentHtml = `<img src="${msg.text}" class="msg-img">`;
        } else if (msg.type === 'audio') {
            contentHtml = `<audio controls src="${msg.text}" style="max-width: 200px;"></audio>`;
        } else {
            contentHtml = `<span class="msg-txt">${msg.text}</span>`;
        }

        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const ticks = isMe ? `<span class="msg-ticks ${msg.status === 'read' ? 'read' : ''}">${msg.status === 'read' ? '✓✓' : '✓'}</span>` : '';
        const editedTag = msg.isEdited ? ' <em style="font-size:10px; opacity:0.6;">(Modifié)</em>' : '';
        
        div.innerHTML = `${contentHtml}${editedTag}<span class="msg-time">${timeStr}</span>${ticks}`;
        
        // Clic pour sélectionner un message
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection();
            
            selectedMessageId = msgKey;
            selectedMessageSender = msg.sender;
            selectedMessageText = msg.text || "";
            div.classList.add('selected');
            
            // Activation des options dans le menu à 3 points
            deleteMsgBtn.classList.remove('disabled-menu-item');
            if(isMe && msg.type === 'text') {
                editMsgBtn.classList.remove('disabled-menu-item');
            }
        });

        messagesArea.appendChild(div);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        if(!isMe && isSoundEnabled && notifSound) {
            notifSound.play().catch(e => console.log(e));
        }
    });

    chatRef.on('child_changed', (snapshot) => {
        const msgKey = snapshot.key;
        const msg = snapshot.val();
        const msgElem = document.getElementById(`msg_${msgKey}`);
        if(msgElem && msg.type === 'text') {
            const txtElem = msgElem.querySelector('.msg-txt');
            if(txtElem) txtElem.innerText = msg.text;
        }
    });

    chatRef.on('child_removed', (snapshot) => {
        const msgKey = snapshot.key;
        const msgElem = document.getElementById(`msg_${msgKey}`);
        if(msgElem) msgElem.remove();
        clearSelection();
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

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', () => sendMessage());

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

    db.ref(`users/${currentUserId}/chats/${currentPeerId}`).set({ lastMessage: type === 'image' ? '[Photo]' : txt, time: Date.now() });
    db.ref(`users/${currentPeerId}/chats/${currentUserId}`).set({ lastMessage: type === 'image' ? '[Photo]' : txt, time: Date.now() });

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
            alert("Enregistrement en cours... Cliquez à nouveau pour envoyer.");
        } catch (err) {
            alert("Accès au microphone refusé.");
        }
    } else {
        mediaRecorder.stop();
        voiceBtn.style.color = "white";
    }
});

// ==========================================
// 6. SYSTÈME D'APPEL (PEERJS)
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
            callStatus.innerText = `${call.peer} vous appelle...`;
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
        callStatus.innerText = `Appel de ${currentPeerId}...`;

        const call = peer.call(currentPeerId, stream);
        currentCall = call;
        call.on('stream', remoteStream => remoteVideo.srcObject = remoteStream);
    }).catch(err => alert("Erreur caméra/micro : " + err.message));
}

audioCallBtn.addEventListener('click', () => startCall(false));
videoCallBtn.addEventListener('click', () => startCall(true));
hangupBtn.addEventListener('click', () => {
    if (currentCall) currentCall.close();
    videoModal.style.display = 'none';
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (ringtoneSound) ringtoneSound.pause();
});
