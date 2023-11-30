import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import express from 'express';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);
server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

import { Server } from 'socket.io';
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/static'));

io.on('connection', (socket) => {
  socket.join('Inicio');
  io.to('Inicio').emit('message', 'Alguém acessou o chat...');

  socket.on('message', (msg) => {
    const { room } = msg;
    socket.to(room).emit('message', msg);
  });
});