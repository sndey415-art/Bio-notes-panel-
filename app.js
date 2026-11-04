import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration from your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyAE_N7EbtwFNaT3oLK3TAt-cqxrAkzuFSo",
  authDomain: "bionotes-96fe1.firebaseapp.com",
  projectId: "bionotes-96fe1",
  storageBucket: "bionotes-96fe1.firebasestorage.app",
  messagingSenderId: "949138478789",
  appId: "1:949138478789:web:72eda8afcbfba5e53582ac",
  measurementId: "G-06LQWSJYR8"
};

let db;
let myAuthorId = localStorage.getItem('chatgpt_user_id');
if (!myAuthorId) {
  myAuthorId = 'user_' + Math.floor(Math.random() * 10000);
  localStorage.setItem('chatgpt_user_id', myAuthorId);
}

// Function to start Firebase only when password is correct
window.startFirebaseApp = function() {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Update Presence (Online Status)
  updatePresence();
  setInterval(updatePresence, 30000); // Ping every 30 seconds

  // Listen to messages
  loadMessages();
  checkPartnerStatus();
};

async function updatePresence() {
  const userRef = doc(db, "presence", myAuthorId);
  await setDoc(userRef, { lastSeen: serverTimestamp() });
}

function checkPartnerStatus() {
  const q = query(collection(db, "presence"));
  onSnapshot(q, (snapshot) => {
    let someoneElseOnline = false;
    const now = new Date().getTime();
    
    snapshot.forEach((docSnap) => {
      if (docSnap.id !== myAuthorId) {
        const data = docSnap.data();
        if (data.lastSeen) {
          const lastSeenTime = data.lastSeen.toDate().getTime();
          // If active in the last 1 minute (60000 ms), show Online
          if (now - lastSeenTime < 60000) {
            someoneElseOnline = true;
          }
        }
      }
    });

    const statusEl = document.getElementById('online-status');
    if (someoneElseOnline) {
      statusEl.innerText = "Partner is Online 🟢";
      statusEl.style.color = "#10a37f";
    } else {
      statusEl.innerText = "Offline / Away ⚪";
      statusEl.style.color = "#8e8ea0";
    }
  });
}

window.sendMessage = async function() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (text === "") return;
  input.value = ''; 
  await addDoc(collection(db, "messages"), { text: text, type: "text", author: myAuthorId, timestamp: serverTimestamp() });
};

window.sendMedia = async function() {
  const url = prompt("Paste Image/Video URL here:");
  if (!url) return;
  let type = url.match(/\.(mp4|webm|ogg)$/i) || url.includes("video") ? "video" : "image";
  await addDoc(collection(db, "messages"), { text: url, type: type, author: myAuthorId, timestamp: serverTimestamp() });
};

function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById('messages-container');
    container.innerHTML = ''; 
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement('div');
      div.className = msg.author === myAuthorId ? 'message-wrapper mine' : 'message-wrapper';
      
      let contentHtml = '';
      if (msg.type === "image") {
        contentHtml = `<img src="${msg.text}" class="msg-img">`;
      } else if (msg.type === "video") {
        contentHtml = `<video src="${msg.text}" controls class="msg-img"></video>`;
      } else {
        contentHtml = msg.text;
      }
      
      div.innerHTML = `<div class="message-content">${contentHtml}</div>`;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  });
}
