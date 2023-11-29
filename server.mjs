import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = app.listen(8000, () =>
  console.log('Server rodando na porta 8000')
);
const io = new Server(server);

io.on('connection', onConnected);

function onConnected(socket) {
  console.log('Socket connected', socket.id);

  socket.on('ping', (data) => {
    console.log(data);
    socket.broadcast.emit('message', 'pong');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });

  socket.on('message', (data) => {
    io.in(data.room).emit('message', data);
  });

  socket.on('change-room', (room) => {
    socket.join(room, () => {
      console.log(socket.rooms);
      socket.in(room).emit('hello');
    });
    console.log('room changed', room);
  });
}

app.use(express.static(__dirname + '/static'));
