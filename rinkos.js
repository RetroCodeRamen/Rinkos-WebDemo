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
}

const menuOptions = [
  'Chat',
  'Peer List',
  'System Info',
  'Settings'
];

const chatMenuOptions = [
  'Chat Rooms',
  'Instant Messages',
  'Back'
];

let state = 'boot'; // 'boot', 'menu', 'placeholder', 'setup', 'settings', 'chatmenu'
let selected = 0;
let chatSelected = 0;
let placeholderText = '';

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
  let menuHtml = '<div class="menu-list">';
  for (let i = 0; i < menuOptions.length; i++) {
    menuHtml += `<div class=\"menu-item\">${selected === i ? '<span class=\\"menu-cursor\\">&gt;</span>' : '<span style=\\"display:inline-block;width:1em;\\"></span>'} ${menuOptions[i]}</div>`;
  }
  menuHtml += '</div>';
  rinkosScreen.querySelector('.menu-list')?.remove();
  rinkosScreen.querySelector('.placeholder-screen')?.remove();
  rinkosScreen.insertAdjacentHTML('beforeend', menuHtml);
}

function drawChatMenu() {
  if (logoImg) logoImg.style.display = 'none';
  rinkosScreen.innerHTML = '';
  let menuHtml = '<div class="menu-list">';
  for (let i = 0; i < chatMenuOptions.length; i++) {
    menuHtml += `<div class=\"menu-item\">${chatSelected === i ? '<span class=\\"menu-cursor\\">&gt;</span>' : '<span style=\\"display:inline-block;width:1em;\\"></span>'} ${chatMenuOptions[i]}</div>`;
  }
  menuHtml += '</div>';
  rinkosScreen.innerHTML = menuHtml;
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
  rinkosScreen.innerHTML = `
    <form id="settings-form" style="display:flex;flex-direction:column;align-items:center;gap:1em;width:90%;margin:0 auto;">
      <label style="font-size:1.1em;">Change username:<br>
        <input id="settings-username" type="text" maxlength="16" value="${user ? user.username : ''}" style="font-size:1em;width:180px;" required autofocus />
      </label>
      <button type="submit" style="font-size:1.1em;">Save</button>
      <button type="button" id="settings-back" style="font-size:1em;">Back</button>
    </form>
  `;
  document.getElementById('settings-form').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('settings-username').value.trim();
    if (username) {
      saveUserInfo(username);
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
      if (menuOptions[selected] === 'Settings') {
        showSettings();
      } else if (menuOptions[selected] === 'Chat') {
        showChatMenu();
      } else {
        showPlaceholder('Loading ' + menuOptions[selected] + '...');
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
      if (chatMenuOptions[chatSelected] === 'Back') {
        showMenu();
      } else if (chatMenuOptions[chatSelected] === 'Chat Rooms') {
        showChatRoom();
      } else if (chatMenuOptions[chatSelected] === 'Instant Messages') {
        showPlaceholder('Instant Messages coming soon...');
      }
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
  }
  oldHandleKey(e);
}

// On load, check for user info and time
function startRinkOS() {
  if (!getUserInfo() || !getDeviceTime()) {
    state = 'setup';
    rinkosScreen.innerHTML = '';
    if (logoImg) logoImg.style.display = 'block';
    rinkosScreen.appendChild(logoImg);
    drawSetupScreen();
  } else {
    drawBootScreen();
    setTimeout(showMenu, BOOT_TIME);
  }
}

startRinkOS();
window.addEventListener('keydown', handleKey); 