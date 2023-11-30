const socket = io();

const roomListDiv = document.getElementById('room-list');
const messagesDiv = document.getElementById('messages');
const newMessageForm = document.getElementById('new-message');
const newRoomForm = document.getElementById('new-room');
const statusDiv = document.getElementById('status');

const roomTemplate = document.getElementById('room');
const messageTemplate = document.getElementById('message');

const messageField = newMessageForm.querySelector('#message');
const usernameField = newMessageForm.querySelector('#username');
const roomNameField = newRoomForm.querySelector('#name');

const STATE = {
  currentRoom: 'Inicio',
  connected: false,
};

function setConnectedStatus(status) {
  STATE.connected = status;
  statusDiv.className = status ? 'connected' : 'reconnecting';
}

const changeRoom = (room) => {
  if (STATE.currentRoom === room) return;

  const newRoom = roomListDiv.querySelector(`.room[data-name='${room}']`);
  const oldRoom = roomListDiv.querySelector(
    `.room[data-name='${STATE.currentRoom}']`
  );

  if (!newRoom || !oldRoom) return;

  STATE.currentRoom = room;
  oldRoom.classList.remove('active');
  newRoom.classList.add('active');

  messagesDiv.querySelectorAll('.message').forEach((msg) => {
    messagesDiv.removeChild(msg);
  });

  STATE[room].forEach((data) =>
    sendMessageToRoom({ room, username: data.username, message: data.message })
  );
};

function createRoom(name) {
  if (STATE[name]) {
    changeRoom(name);
    return false;
  }

  const node = roomTemplate.content.cloneNode(true);
  const room = node.querySelector('.room');
  room.addEventListener('click', (e) => {
    e.preventDefault();
    changeRoom(name);
  });
  room.textContent = name;
  room.dataset.name = name;
  roomListDiv.appendChild(node);

  STATE[name] = [];
  changeRoom(name);
  return true;
}

function mountUiMessage({ username, message }) {
  const newMessageNode = messageTemplate.content.cloneNode(true);

  newMessageNode.querySelector('.message .username').textContent = username;
  newMessageNode.querySelector('.message .username').style.color = '#32a852';
  newMessageNode.querySelector('.message .text').textContent = message;
  messagesDiv.appendChild(newMessageNode);
}

function sendMessageToRoom({
  room,
  username,
  message,
  pushToOtherRoom = false,
}) {
  if (pushToOtherRoom) {
    STATE[room].push({ username, message });
  }

  if (STATE.currentRoom === room) {
    mountUiMessage({ username, message });
    socket.emit('message', { room, username, message });
  }
}

function init() {
  createRoom('Inicio');

  newMessageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const room = STATE.currentRoom;
    const message = messageField.value;
    const username = usernameField.value || 'Anônimo';
    if (!message) return;

    if (STATE.connected) {
      sendMessageToRoom({ room, message, username });
      messageField.value = '';
    }
  });

  newRoomForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const room = roomNameField.value;
    if (!room) return;

    roomNameField.value = '';
    if (!createRoom(room)) return;

    sendMessageToRoom({
      room,
      username: 'O Criador',
      message: 'Olha só, uma sala novinha! Nice.',
      pushToOtherRoom: true,
    });
  });

  socket.on('message', (event) => {
    const { message, room, username } = event;

    if (!message || !room || !username) {
      return;
    }

    mountUiMessage({ username, message });
  });

  setConnectedStatus(true);
}

init();
