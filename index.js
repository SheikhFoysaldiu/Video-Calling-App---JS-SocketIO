const express = require('express');
const app = express();
const socket = require('socket.io');

const server = app.listen(3000, () => {
    console.log('server started');
})

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

const userRoute = require('./routes/userRoute');
app.use('/', userRoute);


// Socket setup

const io = socket(server,
    { 
      cors: {
        origin: '*',
      }
    }
  );
io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    socket.on('join', (roomName) => {
      console.log('User joined', roomName);
      const room = io.sockets.adapter.rooms.get(roomName);
      console.log(room);

      if( room === undefined){
        ok = true;
        socket.join(roomName);
        socket.emit('created', roomName);
      }
      else if(room.size == 1){
        socket.join(roomName);
        socket.emit('joined', roomName);
      }
      else{
        console.log('Room full', roomName);
      }

  
    });
    socket.on('ready', (roomName) => {
      console.log('Ready', roomName);
      socket.broadcast.to(roomName).emit('ready');
    }
    );
  
    socket.on('offer', (roomName, offer) => {
      console.log('roomName', roomName);
      socket.broadcast.to(roomName).emit('offer', offer);
    }
    );
    socket.on('answer', (roomName, answer) => {
      console.log('Answer', roomName, answer);
      socket.broadcast.to(roomName).emit('answer', answer);
    }
    );
    socket.on('candidate', (roomName, candidate) => {
      console.log('Candidate', roomName, candidate);
      socket.broadcast.to(roomName).emit('candidate', candidate);
    }
    );
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    }
    );
 
  });
  
