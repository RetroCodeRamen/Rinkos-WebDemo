// RinkOS Web Mockup

const BOOT_TIME = 3000; // ms
const USER_KEY = 'rinkos_user';
const TIME_KEY = 'rinkos_time';

function getUserInfo() {
  return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
}

function getDeviceTime() {
  return localStorage.getItem(TIME_KEY);
}

function saveUserInfo(username) {
  localStorage.setItem(USER_KEY, JSON.stringify({ username }));
}

function saveDeviceTime(time) {
  localStorage.setItem(TIME_KEY, time);
  // Calculate offset between real time and device time
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const deviceTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  timeOffset = deviceTime.getTime() - now.getTime();
}

function getCurrentDeviceTime() {
  const now = new Date();
  const deviceTime = new Date(now.getTime() + timeOffset);
  return deviceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateClock() {
  const clockElement = document.getElementById('device-clock');
  if (clockElement) {
    clockElement.textContent = getCurrentDeviceTime();
  }
}

const menuOptions = [
  'Chat',
  'RinkoScript',
  'Settings'
];

const chatMenuOptions = [
  'The Den',
  'New Chat',
  'Messages',
  'Active Users',
  'Back'
];

let state = 'boot'; // 'boot', 'menu', 'placeholder', 'setup', 'settings', 'chatmenu', 'chatroom', 'directmessages', 'peerlist', 'newchat'
let selected = 0;
let chatSelected = 0;
let placeholderText = '';
let messagesSelected = 0;
let peerListSelected = 0;

const rinkosScreen = document.getElementById('rinkos-screen');
const logoImg = document.getElementById('rinko-logo-img');

let chatRoomState = {
  messages: [],
  loading: false,
  atTop: false,
  input: '',
  oldestTime: null,
  scrollIndex: 0
};

let chatRoomPollInterval = null;

let bunnygramConvState = {
  messages: [],
  loading: false,
  atTop: false,
  input: '',
  oldestTime: null,
  pollInterval: null,
  recipient: ''
};

let powerOnStarted = false;

let messagesState = {
  conversations: [],
  selectedConversation: null,
  messages: [],
  loading: false,
  atTop: false,
  input: '',
  oldestTime: null,
  scrollIndex: 0
};

let peerListState = {
  peers: [],
  lastUpdate: 0
};

let timeOffset = 0; // Offset between real time and device time

let luaEnv = null;
let installedScripts = new Set();

function getPowerOnStarted() {
  return powerOnStarted;
}

function setPowerOnStarted(value) {
  powerOnStarted = value;
}

function showPowerOffOverlay() {
  const overlay = document.getElementById('poweroff-overlay');
  overlay.classList.remove('fade');
  overlay.style.display = 'flex';
  setPowerOnStarted(false);
  function handlePowerOn() {
    if (getPowerOnStarted()) return;
    setPowerOnStarted(true);
    overlay.classList.add('fade');
    setTimeout(() => {
      overlay.style.display = 'none';
      startRinkOS();
    }, 700);
    window.removeEventListener('mousedown', handlePowerOn);
    window.removeEventListener('touchstart', handlePowerOn);
    window.removeEventListener('keydown', handlePowerOn);
  }
  window.addEventListener('mousedown', handlePowerOn);
  window.addEventListener('touchstart', handlePowerOn);
  window.addEventListener('keydown', handlePowerOn);
}

// On page load, show Power Off overlay and wait for user interaction
window.addEventListener('DOMContentLoaded', showPowerOffOverlay);

function drawBootScreen() {
  if (logoImg) logoImg.style.display = 'none';
  rinkosScreen.innerHTML = `
    <div class="boot-message">
      <div><b>Rinko</b> is waking up.</div>
      <div style="margin-top:1em; font-size:0.9em;">Please wait...</div>
    </div>
  `;
}

function drawMenu() {
  if (logoImg) logoImg.style.display = 'block';
  let menuHtml = `<div id="device-clock" style="text-align:center;margin-bottom:1em;font-size:1.2em;">${getCurrentDeviceTime()}</div>`;
  menuHtml += '<div class="menu-list">';
  for (let i = 0; i < menuOptions.length; i++) {
    menuHtml += `<div class=\"menu-item\">${selected === i ? '<span class=\\"menu-cursor\\">&gt;</span>' : '<span style=\\"display:inline-block;width:1em;\\"></span>'} ${menuOptions[i]}</div>`;
  }
  menuHtml += '</div>';
  rinkosScreen.querySelector('.menu-list')?.remove();
  rinkosScreen.querySelector('#device-clock')?.remove();
  rinkosScreen.insertAdjacentHTML('beforeend', menuHtml);
}

function drawChatMenu() {
  if (logoImg) logoImg.style.display = 'none';
  rinkosScreen.innerHTML = `<div id="device-clock" style="text-align:center;margin-bottom:1em;font-size:1.2em;">${getCurrentDeviceTime()}</div>`;
  let menuHtml = '<div class="menu-list">';
  for (let i = 0; i < chatMenuOptions.length; i++) {
    menuHtml += `<div class=\"menu-item\">${chatSelected === i ? '<span class=\\"menu-cursor\\">&gt;</span>' : '<span style=\\"display:inline-block;width:1em;\\"></span>'} ${chatMenuOptions[i]}</div>`;
  }
  menuHtml += '</div>';
  rinkosScreen.innerHTML += menuHtml;
}

function drawPlaceholder() {
  if (logoImg) logoImg.style.display = 'block';
  rinkosScreen.querySelector('.menu-list')?.remove();
  rinkosScreen.innerHTML += `<div class="placeholder-screen">${placeholderText}</div>`;
}

function drawSetupScreen() {
  if (logoImg) logoImg.style.display = 'block';
  rinkosScreen.innerHTML = `
    <form id="setup-form" style="display:flex;flex-direction:column;align-items:center;gap:1em;width:90%;margin:0 auto;">
      <label style="font-size:1.1em;">Enter your username:<br>
        <input id="setup-username" type="text" maxlength="16" style="font-size:1em;width:180px;" required autofocus />
      </label>
      <label style="font-size:1.1em;">Set device time (HH:MM):<br>
        <input id="setup-time" type="time" required style="font-size:1em;width:120px;" />
      </label>
      <button type="submit" style="font-size:1.1em;">Start RinkOS</button>
    </form>
  `;
  document.getElementById('setup-form').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('setup-username').value.trim();
    const time = document.getElementById('setup-time').value;
    if (username && time) {
      saveUserInfo(username);
      saveDeviceTime(time);
      showMenu();
    }
  };
}

function drawSettingsScreen() {
  if (logoImg) logoImg.style.display = 'block';
  const user = getUserInfo();
  const currentTime = getCurrentDeviceTime();
  rinkosScreen.innerHTML = `
    <form id="settings-form" style="display:flex;flex-direction:column;align-items:center;gap:1em;width:90%;margin:0 auto;">
      <label style="font-size:1.1em;">Change username:<br>
        <input id="settings-username" type="text" maxlength="16" value="${user ? user.username : ''}" style="font-size:1em;width:180px;" required autofocus />
      </label>
      <label style="font-size:1.1em;">Change device time (HH:MM):<br>
        <input id="settings-time" type="time" value="${currentTime}" style="font-size:1em;width:120px;" required />
      </label>
      <button type="submit" style="font-size:1.1em;">Save</button>
      <button type="button" id="settings-back" style="font-size:1em;">Back</button>
    </form>
  `;
  document.getElementById('settings-form').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('settings-username').value.trim();
    const time = document.getElementById('settings-time').value;
    if (username && time) {
      saveUserInfo(username);
      saveDeviceTime(time);
      showMenu();
    }
  };
  document.getElementById('settings-back').onclick = showMenu;
}

function showMenu() {
  state = 'menu';
  selected = 0;
  rinkosScreen.innerHTML = '';
  if (logoImg) logoImg.style.display = 'block';
  rinkosScreen.appendChild(logoImg);
  drawMenu();
}

function showChatMenu() {
  state = 'chatmenu';
  chatSelected = 0;
  drawChatMenu();
}

function showPlaceholder(text) {
  state = 'placeholder';
  placeholderText = text;
  rinkosScreen.innerHTML = '';
  if (logoImg) logoImg.style.display = 'block';
  rinkosScreen.appendChild(logoImg);
  drawPlaceholder();
  setTimeout(showMenu, 1200);
}

function showSettings() {
  state = 'settings';
  rinkosScreen.innerHTML = '';
  if (logoImg) logoImg.style.display = 'block';
  rinkosScreen.appendChild(logoImg);
  drawSettingsScreen();
}

function showChatRoom() {
  state = 'chatroom';
  chatRoomState = {
    messages: [],
    loading: false,
    atTop: false,
    input: '',
    oldestTime: null,
    scrollIndex: 0
  };
  rinkosScreen.innerHTML = '';
  drawChatRoom('bottom');
  fetchChatRoomMessages();
  if (chatRoomPollInterval) clearInterval(chatRoomPollInterval);
  chatRoomPollInterval = setInterval(() => {
    if (state === 'chatroom') fetchChatRoomMessages();
  }, 2000);
}

function leaveChatRoom() {
  if (chatRoomPollInterval) {
    clearInterval(chatRoomPollInterval);
    chatRoomPollInterval = null;
  }
  showChatMenu();
}

function drawChatRoom(scrollTo = null, prevScrollData = null) {
  // Save input value and cursor position if input exists
  let prevInput = document.getElementById('chatroom-input');
  let prevValue = prevInput ? prevInput.value : chatRoomState.input;
  let prevSelectionStart = prevInput ? prevInput.selectionStart : null;
  let prevSelectionEnd = prevInput ? prevInput.selectionEnd : null;
  let hadFocus = prevInput ? document.activeElement === prevInput : false;

  rinkosScreen.innerHTML = '';
  let html = '<div class="chatroom-list" id="chatroom-list">';
  if (chatRoomState.messages.length === 0) {
    html += '<div style="color:#888;text-align:center;">No messages yet.</div>';
  } else {
    for (const msg of chatRoomState.messages) {
      html += `<div class="chat-message"><b>${msg.sender}</b> <span style="font-size:0.8em;color:#888;">${formatTime(msg.time)}</span><br>${escapeHtml(msg.text)}</div>`;
    }
  }
  html += '</div>';
  html += `<form id="chatroom-form" style="display:flex;gap:4px;margin-top:8px;align-items:center;">
    <input id="chatroom-input" type="text" maxlength="200" autocomplete="off" style="flex:1;font-size:1em;" placeholder="Type a message..." autofocus value="${prevValue.replace(/"/g, '&quot;')}" />
    <button id="btn-up" type="button" style="width:36px;height:32px;font-size:1.2em;">&#8593;</button>
    <button id="btn-down" type="button" style="width:36px;height:32px;font-size:1.2em;">&#8595;</button>
    <button type="submit" style="font-size:1em;">Send</button>
  </form>`;
  html += '<button id="chatroom-back" style="margin-top:8px;font-size:1em;width:100%;">Back</button>';
  rinkosScreen.innerHTML = html;

  const chatList = document.getElementById('chatroom-list');

  setTimeout(() => {
    if (scrollTo === 'top') {
      chatList.scrollTop = 0;
    } else if (scrollTo === 'bottom' || (prevScrollData && prevScrollData.wasAtBottom)) {
      chatList.scrollTop = chatList.scrollHeight;
    } else if (prevScrollData && !prevScrollData.wasAtBottom) {
      chatList.scrollTop = prevScrollData.prevScrollTop + (chatList.scrollHeight - prevScrollData.prevScrollHeight);
    }
  }, 0);

  const input = document.getElementById('chatroom-input');
  input.value = prevValue;
  if (hadFocus && input) {
    input.focus();
    if (prevSelectionStart !== null && prevSelectionEnd !== null) {
      input.setSelectionRange(prevSelectionStart, prevSelectionEnd);
    }
  }

  document.getElementById('chatroom-form').onsubmit = function(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      sendChatRoomMessage(text);
      input.value = '';
      chatRoomState.input = '';
      setTimeout(() => {
        const chatList = document.getElementById('chatroom-list');
        chatList.scrollTop = chatList.scrollHeight;
      }, 0);
    }
  };
  input.oninput = function(e) {
    chatRoomState.input = e.target.value;
  };
  document.getElementById('chatroom-back').onclick = leaveChatRoom;

  document.getElementById('btn-up').onclick = () => scrollChat('up');
  document.getElementById('btn-down').onclick = () => scrollChat('down');
}

function scrollChat(direction) {
  const chatList = document.getElementById('chatroom-list');
  const scrollAmount = 60; // px per scroll
  if (direction === 'up') {
    if (chatList.scrollTop === 0 && !chatRoomState.atTop && chatRoomState.oldestTime) {
      // At top, fetch more
      fetchChatRoomMessages(chatRoomState.oldestTime, true);
    } else {
      chatList.scrollTop = Math.max(0, chatList.scrollTop - scrollAmount);
    }
  } else if (direction === 'down') {
    chatList.scrollTop = Math.min(chatList.scrollHeight, chatList.scrollTop + scrollAmount);
  }
}

function fetchChatRoomMessages(before = null, append = false) {
  chatRoomState.loading = true;
  let url = 'http://localhost:3001/api/messages?recipient=broadcast&limit=5';
  if (before) url += `&before=${encodeURIComponent(before)}`;

  // Save scroll data before fetching
  const chatList = document.getElementById('chatroom-list');
  let prevScrollData = null;
  if (chatList) {
    const prevScrollTop = chatList.scrollTop;
    const prevScrollHeight = chatList.scrollHeight;
    const wasAtBottom = Math.abs(prevScrollTop + chatList.clientHeight - prevScrollHeight) < 2;
    prevScrollData = { prevScrollTop, prevScrollHeight, wasAtBottom };
  }

  fetch(url)
    .then(res => res.json())
    .then(msgs => {
      let scrollTo = null;
      if (append) {
        const existingTimes = new Set(chatRoomState.messages.map(m => m.time));
        const newMsgs = msgs.filter(m => !existingTimes.has(m.time));
        chatRoomState.messages = newMsgs.concat(chatRoomState.messages);
        scrollTo = 'top';
      } else {
        chatRoomState.messages = msgs;
      }
      chatRoomState.atTop = msgs.length < 5;
      if (chatRoomState.messages.length > 0) {
        chatRoomState.oldestTime = chatRoomState.messages[0].time;
      }
      drawChatRoom(scrollTo, prevScrollData);
    });
}

function sendChatRoomMessage(text) {
  const user = getUserInfo();
  const now = new Date();
  fetch('http://localhost:3001/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: user.username,
      recipient: 'broadcast',
      time: now.toISOString(),
      text
    })
  }).then(() => {
    fetchChatRoomMessages();
  });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return charsToReplace[tag] || tag;
  });
}

function handleKey(e) {
  if (state === 'menu') {
    if (e.key === 'ArrowUp') {
      selected = (selected - 1 + menuOptions.length) % menuOptions.length;
      drawMenu();
    } else if (e.key === 'ArrowDown') {
      selected = (selected + 1) % menuOptions.length;
      drawMenu();
    } else if (e.key === 'Enter') {
      if (menuOptions[selected] === 'Chat') {
        showChatMenu();
      } else if (menuOptions[selected] === 'RinkoScript') {
        showRinkoScript();
      } else if (menuOptions[selected] === 'Settings') {
        showSettings();
      }
    }
  } else if (state === 'chatmenu') {
    if (e.key === 'ArrowUp') {
      chatSelected = (chatSelected - 1 + chatMenuOptions.length) % chatMenuOptions.length;
      drawChatMenu();
    } else if (e.key === 'ArrowDown') {
      chatSelected = (chatSelected + 1) % chatMenuOptions.length;
      drawChatMenu();
    } else if (e.key === 'Enter') {
      if (chatMenuOptions[chatSelected] === 'The Den') {
        showChatRoom();
      } else if (chatMenuOptions[chatSelected] === 'New Chat') {
        showNewChatScreen();
      } else if (chatMenuOptions[chatSelected] === 'Messages') {
        state = 'messages';
        messagesSelected = 0;
        fetchConversations();
        drawMessagesScreen();
      } else if (chatMenuOptions[chatSelected] === 'Active Users') {
        state = 'peerlist';
        fetchPeerList();
        drawPeerList();
      } else if (chatMenuOptions[chatSelected] === 'Back') {
        showMenu();
      }
    } else if (e.key === 'Escape') {
      showMenu();
    }
  } else if (state === 'messages') {
    if (e.key === 'ArrowUp') {
      messagesSelected = Math.max(0, messagesSelected - 1);
      drawMessagesScreen();
    } else if (e.key === 'ArrowDown') {
      messagesSelected = Math.min(messagesState.conversations.length, messagesSelected + 1);
      drawMessagesScreen();
    } else if (e.key === 'Enter') {
      if (messagesSelected < messagesState.conversations.length) {
        showBunnygramConversation(messagesState.conversations[messagesSelected].username);
      } else if (messagesSelected === messagesState.conversations.length) {
        // Back button is selected
        showChatMenu();
      }
    } else if (e.key === 'Escape') {
      showChatMenu();
    }
  } else if (state === 'peerlist') {
    if (e.key === 'ArrowUp') {
      peerListSelected = Math.max(0, peerListSelected - 1);
      drawPeerList();
    } else if (e.key === 'ArrowDown') {
      peerListSelected = Math.min(peerListState.peers.length, peerListSelected + 1);
      drawPeerList();
    } else if (e.key === 'Enter') {
      if (peerListSelected < peerListState.peers.length) {
        showBunnygramConversation(peerListState.peers[peerListSelected].username);
      } else if (peerListSelected === peerListState.peers.length) {
        // Back button is selected
        showChatMenu();
      }
    } else if (e.key === 'Escape') {
      showChatMenu();
    }
  } else if (state === 'newchat') {
    if (e.key === 'Escape') {
      showChatMenu();
    }
  } else if (state === 'settings') {
    if (e.key === 'Enter') {
      showMenu();
    }
  } else if (state === 'chatroom') {
    if (e.key === 'ArrowUp') {
      scrollChat('up');
    }
    if (e.key === 'ArrowDown') {
      scrollChat('down');
    }
    if (e.key === 'Escape') {
      leaveChatRoom();
    }
    return;
  } else if (state === 'bunnygramconversation') {
    if (e.key === 'ArrowUp') {
      scrollBunnygram('up');
    }
    if (e.key === 'ArrowDown') {
      scrollBunnygram('down');
    }
    if (e.key === 'Escape') {
      leaveBunnygramConversation();
      showChatMenu();
    }
    return;
  }
  oldHandleKey(e);
}

function playStartupChord() {
  const audio = document.getElementById('startup-chime');
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function showStartupAnimation() {
  state = 'startup';
  rinkosScreen.classList.add('startup');
  rinkosScreen.innerHTML = '';
  // 1. Wait for Power Off fade, then show logo off-screen and start animation
  setTimeout(() => {
    rinkosScreen.innerHTML = `<img id="rinko-logo-anim" src="RinkoLogo.png" alt="Rinko Logo" />`;
    // 2. After 1s (slide-in), play chime (only once)
    setTimeout(() => {
      playStartupChord();
      // 3. Hold logo for 4s, then fade out
      setTimeout(() => {
        const logo = document.getElementById('rinko-logo-anim');
        if (logo) logo.classList.add('logo-fade-out');
        // 4. After fade, show menu
        setTimeout(() => {
          rinkosScreen.classList.remove('startup');
          rinkosScreen.innerHTML = '';
          showMenu();
        }, 700);
      }, 4000);
    }, 1000); // 1s for earlier chime
  }, 700); // Wait for Power Off fade
}

// Replace boot logic with startup animation
function startRinkOS() {
  if (!getUserInfo() || !getDeviceTime()) {
    state = 'setup';
    rinkosScreen.innerHTML = '';
    if (logoImg) logoImg.style.display = 'block';
    rinkosScreen.appendChild(logoImg);
    drawSetupScreen();
  } else {
    // Calculate initial time offset
    const savedTime = getDeviceTime();
    const [hours, minutes] = savedTime.split(':').map(Number);
    const now = new Date();
    const deviceTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    timeOffset = deviceTime.getTime() - now.getTime();
    
    // Start clock updates
    setInterval(updateClock, 1000);
    showStartupAnimation();
  }
}

function showBunnygramStart() {
  state = 'bunnygramstart';
  rinkosScreen.innerHTML = `<form id="bunnygram-start-form" style="display:flex;flex-direction:column;align-items:center;gap:1em;width:90%;margin:0 auto;">
    <label style="font-size:1.1em;">Send a Bunnygram to:<br>
      <input id="bunnygram-recipient" type="text" maxlength="16" style="font-size:1em;width:180px;" required autofocus />
    </label>
    <button type="submit" style="font-size:1.1em;">Start</button>
    <button type="button" id="bunnygram-back" style="font-size:1em;">Back</button>
  </form>`;
  document.getElementById('bunnygram-start-form').onsubmit = function(e) {
    e.preventDefault();
    const recipient = document.getElementById('bunnygram-recipient').value.trim();
    if (recipient) {
      showBunnygramConversation(recipient);
    }
  };
  document.getElementById('bunnygram-back').onclick = showBunnygramMenu;
}

function showBunnygramReview() {
  state = 'bunnygramreview';
  rinkosScreen.innerHTML = '<div style="text-align:center;margin-top:2em;font-size:1.2em;">Review Past Bunnygrams coming soon...</div>';
}

function showBunnygramConversation(recipient) {
  state = 'bunnygramconversation';
  bunnygramConvState = {
    messages: [],
    loading: false,
    atTop: false,
    input: '',
    oldestTime: null,
    pollInterval: null,
    recipient
  };
  rinkosScreen.innerHTML = '';
  drawBunnygramConversation('bottom');
  fetchBunnygramMessages();
  if (bunnygramConvState.pollInterval) clearInterval(bunnygramConvState.pollInterval);
  bunnygramConvState.pollInterval = setInterval(() => {
    if (state === 'bunnygramconversation') fetchBunnygramMessages();
  }, 2000);
}

function leaveBunnygramConversation() {
  if (bunnygramConvState.pollInterval) {
    clearInterval(bunnygramConvState.pollInterval);
    bunnygramConvState.pollInterval = null;
  }
  showChatMenu();
}

function drawBunnygramConversation(scrollTo = null, prevScrollData = null) {
  // Save input value and cursor position if input exists
  let prevInput = document.getElementById('bunnygram-input');
  let prevValue = prevInput ? prevInput.value : bunnygramConvState.input;
  let prevSelectionStart = prevInput ? prevInput.selectionStart : null;
  let prevSelectionEnd = prevInput ? prevInput.selectionEnd : null;
  let hadFocus = prevInput ? document.activeElement === prevInput : false;

  rinkosScreen.innerHTML = '';
  let html = `<div style="font-size:1.1em;text-align:center;margin-bottom:0.5em;">Bunnygram with <b>${bunnygramConvState.recipient}</b></div>`;
  html += '<div class="chatroom-list" id="bunnygram-list">';
  if (bunnygramConvState.messages.length === 0) {
    html += '<div style="color:#888;text-align:center;">No messages yet.</div>';
  } else {
    for (const msg of bunnygramConvState.messages) {
      html += `<div class="chat-message"><b>${msg.sender}</b> <span style="font-size:0.8em;color:#888;">${formatTime(msg.time)}</span><br>${escapeHtml(msg.text)}</div>`;
    }
  }
  html += '</div>';
  html += `<form id="bunnygram-form">
    <input id="bunnygram-input" type="text" maxlength="200" autocomplete="off" placeholder="Type a message..." autofocus value="${prevValue.replace(/"/g, '&quot;')}" />
    <button id="btn-up-bunnygram" type="button">&#8593;</button>
    <button id="btn-down-bunnygram" type="button">&#8595;</button>
    <button type="submit">Send</button>
  </form>`;
  html += '<button id="bunnygram-back" style="margin-top:8px;font-size:1em;width:100%;">Back</button>';
  rinkosScreen.innerHTML = html;

  const list = document.getElementById('bunnygram-list');
  setTimeout(() => {
    if (scrollTo === 'top') {
      list.scrollTop = 0;
    } else if (scrollTo === 'bottom' || (prevScrollData && prevScrollData.wasAtBottom)) {
      list.scrollTop = list.scrollHeight;
    } else if (prevScrollData && !prevScrollData.wasAtBottom) {
      list.scrollTop = prevScrollData.prevScrollTop + (list.scrollHeight - prevScrollData.prevScrollHeight);
    }
  }, 0);

  const input = document.getElementById('bunnygram-input');
  input.value = prevValue;
  if (hadFocus && input) {
    input.focus();
    if (prevSelectionStart !== null && prevSelectionEnd !== null) {
      input.setSelectionRange(prevSelectionStart, prevSelectionEnd);
    }
  }
  input.oninput = function(e) {
    bunnygramConvState.input = e.target.value;
  };
  document.getElementById('bunnygram-form').onsubmit = function(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      sendBunnygramMessage(text);
      input.value = '';
      bunnygramConvState.input = '';
      setTimeout(() => {
        const list = document.getElementById('bunnygram-list');
        list.scrollTop = list.scrollHeight;
      }, 0);
    }
  };
  document.getElementById('bunnygram-back').onclick = () => {
    leaveBunnygramConversation();
  };
  document.getElementById('btn-up-bunnygram').onclick = () => scrollBunnygram('up');
  document.getElementById('btn-down-bunnygram').onclick = () => scrollBunnygram('down');
}

function fetchBunnygramMessages(before = null, append = false) {
  bunnygramConvState.loading = true;
  const user = getUserInfo();
  let url = `http://localhost:3001/api/messages?limit=5`;
  url += `&user1=${encodeURIComponent(user.username)}`;
  url += `&user2=${encodeURIComponent(bunnygramConvState.recipient)}`;
  if (before) url += `&before=${encodeURIComponent(before)}`;

  // Save scroll data before fetching
  const list = document.getElementById('bunnygram-list');
  let prevScrollData = null;
  if (list) {
    const prevScrollTop = list.scrollTop;
    const prevScrollHeight = list.scrollHeight;
    const wasAtBottom = Math.abs(prevScrollTop + list.clientHeight - prevScrollHeight) < 2;
    prevScrollData = { prevScrollTop, prevScrollHeight, wasAtBottom };
  }

  fetch(url)
    .then(res => res.json())
    .then(msgs => {
      let scrollTo = null;
      if (append) {
        const existingTimes = new Set(bunnygramConvState.messages.map(m => m.time));
        const newMsgs = msgs.filter(m => !existingTimes.has(m.time));
        bunnygramConvState.messages = newMsgs.concat(bunnygramConvState.messages);
        scrollTo = 'top';
      } else {
        bunnygramConvState.messages = msgs;
      }
      bunnygramConvState.atTop = msgs.length < 5;
      if (bunnygramConvState.messages.length > 0) {
        bunnygramConvState.oldestTime = bunnygramConvState.messages[0].time;
      }
      drawBunnygramConversation(scrollTo, prevScrollData);
    });
}

function sendBunnygramMessage(text) {
  const user = getUserInfo();
  const now = new Date();
  fetch('http://localhost:3001/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: user.username,
      recipient: bunnygramConvState.recipient,
      time: now.toISOString(),
      text
    })
  }).then(() => {
    fetchBunnygramMessages();
  });
}

function scrollBunnygram(direction) {
  const list = document.getElementById('bunnygram-list');
  const scrollAmount = 60;
  if (direction === 'up') {
    if (list.scrollTop === 0 && !bunnygramConvState.atTop && bunnygramConvState.oldestTime) {
      fetchBunnygramMessages(bunnygramConvState.oldestTime, true);
    } else {
      list.scrollTop = Math.max(0, list.scrollTop - scrollAmount);
    }
  } else if (direction === 'down') {
    list.scrollTop = Math.min(list.scrollHeight, list.scrollTop + scrollAmount);
  }
}

function showNewChatScreen() {
  state = 'newchat';
  rinkosScreen.innerHTML = `<form id="newchat-form" style="display:flex;flex-direction:column;align-items:center;gap:1em;width:90%;margin:0 auto;">
    <label style="font-size:1.1em;">Start a chat with:<br>
      <input id="newchat-username" type="text" maxlength="16" style="font-size:1em;width:180px;" required autofocus />
    </label>
    <button type="submit" style="font-size:1.1em;">Start Chat</button>
    <button type="button" id="newchat-back" style="font-size:1em;">Back</button>
  </form>`;
  
  document.getElementById('newchat-form').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('newchat-username').value.trim();
    if (username) {
      showBunnygramConversation(username);
    }
  };
  
  document.getElementById('newchat-back').onclick = showChatMenu;
}

function drawMessagesScreen() {
  if (logoImg) logoImg.style.display = 'none';
  rinkosScreen.innerHTML = '';
  
  let html = '<div class="menu-list">';
  html += '<div class="menu-header">Messages</div>';
  
  if (messagesState.conversations.length === 0) {
    html += '<div class="menu-item">No conversations yet</div>';
  } else {
    for (let i = 0; i < messagesState.conversations.length; i++) {
      const conv = messagesState.conversations[i];
      html += `<div class="menu-item">${messagesSelected === i ? '<span class="menu-cursor">&gt;</span>' : '<span style="display:inline-block;width:1em;"></span>'} ${conv.username}</div>`;
    }
  }
  
  html += '<div class="menu-item"><span style="display:inline-block;width:1em;"></span> Back</div>';
  html += '</div>';
  rinkosScreen.innerHTML = html;
}

function drawPeerList() {
  if (logoImg) logoImg.style.display = 'none';
  rinkosScreen.innerHTML = '';
  
  let html = '<div class="menu-list">';
  html += '<div class="menu-header">Active Users (Last 5 min)</div>';
  
  if (peerListState.peers.length === 0) {
    html += '<div class="menu-item">No active users</div>';
  } else {
    for (let i = 0; i < peerListState.peers.length; i++) {
      const peer = peerListState.peers[i];
      html += `<div class="menu-item">${peerListSelected === i ? '<span class="menu-cursor">&gt;</span>' : '<span style="display:inline-block;width:1em;"></span>'} ${peer.username}</div>`;
    }
  }
  
  html += '<div class="menu-item"><span style="display:inline-block;width:1em;"></span> Back</div>';
  html += '</div>';
  rinkosScreen.innerHTML = html;
}

async function fetchConversations() {
  const user = getUserInfo();
  if (!user) return;
  
  try {
    const response = await fetch(`http://localhost:3001/api/messages?user1=${user.username}`);
    const messages = await response.json();
    
    // Get unique usernames from messages
    const usernames = new Set();
    messages.forEach(msg => {
      if (msg.sender !== user.username) usernames.add(msg.sender);
      if (msg.recipient !== user.username) usernames.add(msg.recipient);
    });
    
    messagesState.conversations = Array.from(usernames).map(username => ({ username }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
  }
}

async function fetchMessages() {
  const user = getUserInfo();
  if (!user || !messagesState.selectedConversation) return;
  
  try {
    const response = await fetch(`http://localhost:3001/api/messages?user1=${user.username}&user2=${messagesState.selectedConversation.username}`);
    messagesState.messages = await response.json();
    drawMessagesScreen();
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}

async function sendMessage(text) {
  const user = getUserInfo();
  if (!user || !messagesState.selectedConversation) return;
  
  try {
    await fetch('http://localhost:3001/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: user.username,
        recipient: messagesState.selectedConversation.username,
        time: new Date().toISOString(),
        text
      })
    });
    
    await fetchMessages();
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function fetchPeerList() {
  try {
    const response = await fetch('http://localhost:3001/api/peers');
    peerListState.peers = await response.json();
    peerListState.lastUpdate = Date.now();
    drawPeerList();
  } catch (error) {
    console.error('Error fetching peer list:', error);
  }
}

// Add keepalive functionality
function startKeepalive() {
  const user = getUserInfo();
  if (!user) return;
  
  const sessionId = Math.random().toString(36).substring(7);
  
  async function sendKeepalive() {
    try {
      await fetch('http://localhost:3001/api/peer/keepalive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          username: user.username
        })
      });
    } catch (error) {
      console.error('Error sending keepalive:', error);
    }
  }
  
  // Send keepalive every minute
  sendKeepalive();
  setInterval(sendKeepalive, 60000);
}

// Start keepalive when RinkOS starts
window.addEventListener('DOMContentLoaded', () => {
  showPowerOffOverlay();
  startKeepalive();
  initLuaEnv();
});

function initLuaEnv() {
    if (!luaEnv) {
        luaEnv = new RinkLuaEnv();
    }
}

function showRinkoScript() {
    state = 'rinkscript';
    rinkosScreen.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.5em;width:100%;height:100%;padding:0.5em;box-sizing:border-box;">
            <div style="font-size:1.1em;text-align:center;margin-bottom:0.25em;">RinkoScript Editor</div>
            <textarea id="script-editor" style="width:100%;height:300px;font-family:monospace;font-size:1em;resize:none;padding:0.5em;box-sizing:border-box;border:1px solid #ccc;margin-bottom:0.25em;" placeholder="Enter your Lua script here..."></textarea>
            <div style="display:flex;gap:0.5em;justify-content:center;margin:0.25em 0;">
                <button id="run-script" style="font-size:1em;padding:0.25em 0.75em;height:2em;">Run</button>
                <button id="save-script" style="font-size:1em;padding:0.25em 0.75em;height:2em;">Save</button>
                <button id="load-script" style="font-size:1em;padding:0.25em 0.75em;height:2em;">Load</button>
                <button id="script-back" style="font-size:1em;padding:0.25em 0.75em;height:2em;">Back</button>
            </div>
            <div style="font-size:0.9em;color:#666;margin-top:0.25em;">Output:</div>
            <div id="script-output" style="font-family:monospace;white-space:pre-wrap;height:100px;border:1px solid #ccc;padding:0.5em;overflow-y:auto;background:#fff;margin-top:0.25em;"></div>
        </div>
    `;

    document.getElementById('run-script').onclick = () => {
        const code = document.getElementById('script-editor').value;
        const output = document.getElementById('script-output');
        if (luaEnv && code) {
            try {
                // Clear previous output
                output.textContent = '';
                
                // Run the script
                const success = luaEnv.runScript('temp', code);
                
                // Display result
                output.textContent = success ? 'Script executed successfully' : 'Error executing script';
            } catch (error) {
                output.textContent = 'Error: ' + error.message;
            }
        }
    };

    document.getElementById('save-script').onclick = () => {
        const code = document.getElementById('script-editor').value;
        const output = document.getElementById('script-output');
        if (code) {
            localStorage.setItem('rinkscript_saved', code);
            output.textContent = 'Script saved successfully';
        }
    };

    document.getElementById('load-script').onclick = () => {
        const savedScript = localStorage.getItem('rinkscript_saved');
        const output = document.getElementById('script-output');
        if (savedScript) {
            document.getElementById('script-editor').value = savedScript;
            output.textContent = 'Script loaded successfully';
        } else {
            output.textContent = 'No saved script found';
        }
    };

    document.getElementById('script-back').onclick = showMenu;

    // Load saved script if exists
    const savedScript = localStorage.getItem('rinkscript_saved');
    if (savedScript) {
        document.getElementById('script-editor').value = savedScript;
    }
}

// Add RinkOS API functions for Lua
window.rinkosAddScript = function(name) {
    installedScripts.add(name);
    // Refresh menu to show new script
    if (state === 'menu') {
        drawMenu();
    }
};

window.rinkosDrawText = function(x, y, text) {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.textContent = text;
    rinkosScreen.appendChild(element);
};

window.rinkosDrawBox = function(x, y, width, height) {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.border = '1px solid black';
    rinkosScreen.appendChild(element);
};

window.rinkosClearScreen = function() {
    rinkosScreen.innerHTML = '';
};

window.rinkosGetInput = function() {
    // Implement input handling
    return '';
};

window.rinkosSendMessage = function(username, message) {
    const user = getUserInfo();
    const now = new Date();
    fetch('http://localhost:3001/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sender: user.username,
            recipient: username,
            time: now.toISOString(),
            text: message
        })
    });
};

window.rinkosGetMessages = function() {
    // Implement message retrieval
    return [];
};

window.rinkosGetPeers = function() {
    // Implement peer list retrieval
    return [];
};

window.addEventListener('keydown', handleKey); 