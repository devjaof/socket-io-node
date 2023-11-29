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

  socket.emit('change-room', room);
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
  room.addEventListener('click', () => changeRoom(name));
  room.textContent = name;
  room.dataset.name = name;
  roomListDiv.appendChild(node);

  STATE[name] = [];
  changeRoom(name);
  return true;
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
    const node = messageTemplate.content.cloneNode(true);

    node.querySelector('.message .username').textContent = username;
    node.querySelector('.message .username').style.color = '#32a852';
    node.querySelector('.message .text').textContent = message;
    messagesDiv.appendChild(node);

    try {
      socket.emit('message', { room, username, value: message });
    } catch (error) {
      console.error(error);
    }
  }

  socket.on('message', (data) => {
    console.log(data);
  });
}

function setConnectedStatus(status) {
  STATE.connected = status;
  statusDiv.className = status ? 'connected' : 'reconnecting';
}

function init() {
  socket.emit('ping', 'oi');

  socket.on('ping', (data) => {
    console.log(data);
  });

  createRoom('Inicio');
  sendMessageToRoom({
    room: 'Inicio',
    username: 'O Criador',
    message: 'Abra outra aba e sinta o poder',
    pushToOtherRoom: true,
  });

  // setup dos forms
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

  setConnectedStatus(true);
}

init();
