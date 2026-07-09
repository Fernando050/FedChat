// Enpòte fonksyon Firebase yo apati CDN ofisyèl la
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Konfigirasyon pa w la (Soti nan kòd ou te ban mwen an)
const firebaseConfig = {
  apiKey: "AIzaSyDVv_oN6LDQzUEeO5-vxgiQKSnA4p39PSM",
  authDomain: "fedchat-e604b.firebaseapp.com",
  projectId: "fedchat-e604b",
  storageBucket: "fedchat-e604b.firebasestorage.app",
  messagingSenderId: "988159515018",
  appId: "1:988159515018:web:93a09a3fd007d3771b9073"
};

// Inisyalize Firebase ak Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Chache Eleman HTML yo (DOM)
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const currentUserDisplay = document.getElementById('current-user-display');
const chatBox = document.getElementById('chat-box');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let currentUser = "";

// 1. Fonksyon pou antre nan chat la
joinBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name !== "") {
        currentUser = name;
        currentUserDisplay.textContent = currentUser;
        
        // Kache login lan, montre chat la
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        // Chaje mesaj yo
        loadMessages();
    } else {
        alert("Tanpri, antre yon non pou w ka kòmanse!");
    }
});

// 2. Fonksyon pou voye mesaj
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Anpeche paj la rechaje
    
    const messageText = messageInput.value.trim();
    if (messageText === "") return;

    // Voye mesaj la sou Firestore
    try {
        await addDoc(collection(db, "messages"), {
            user: currentUser,
            text: messageText,
            timestamp: serverTimestamp()
        });
        messageInput.value = ""; // Netwaye jaden tèks la
        chatBox.scrollTop = chatBox.scrollHeight; // Desann anba nèt
    } catch (error) {
        console.error("Erè lè nap voye mesaj la: ", error);
    }
});

// 3. Fonksyon pou chaje ak afiche mesaj an tan reyèl (Real-time)
function loadMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    
    // onSnapshot ap koute chanjman yo an tan reyèl
    onSnapshot(q, (snapshot) => {
        chatBox.innerHTML = ''; // Netwaye bwat la anvan l met nouvo yo
        
        snapshot.forEach((doc) => {
            const message = doc.data();
            const messageElement = document.createElement('div');
            
            // Verifye si se mesaj pa m oswa pa lòt moun pou n konn ki style pou n bal
            if (message.user === currentUser) {
                messageElement.classList.add('message', 'self');
            } else {
                messageElement.classList.add('message', 'other');
            }
            
            // Fòma HTML anndan mesaj la
            messageElement.innerHTML = `
                <span class="meta">${message.user}</span>
                <span class="text">${message.text}</span>
            `;
            
            chatBox.appendChild(messageElement);
        });
        
        // Toujou kenbe scroll la anba nèt pou wè dènye mesaj yo
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ... (Kòd Firebase ak Chat ou yo ki te la deja) ...

// ==========================================
// ANREJISTRE SERVICE WORKER LA POU PWA a
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker anrejistre avèk siksè:', registration.scope);
            })
            .catch(error => {
                console.log('Enskripsyon Service Worker la echwe:', error);
            });
    });
}
