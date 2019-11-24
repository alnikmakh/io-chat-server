const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Listen on *: ${PORT}`));

let chatrooms = new Map();
const addUserToChatroom = (idChatRoom, user) => {
  let roomUsers = chatrooms.get(idChatRoom);
  roomUsers.push(user);
  chatrooms.set(idChatRoom, roomUsers);
};

const removeUserOfChatRoom = (idChatRoom, user) => {
  let roomUsers = chatrooms.get(idChatRoom);
  roomUsers.forEach((el, i) => {
    if (el === user) {
      roomUsers.splice(i, 1);
    }
  });
  chatrooms.set(idChatRoom, roomUsers);
};

io.on("connection", socket => {
  let nick = "";
  let chatroom = "";
  const id = socket.client.id;
  
  const updateOnlineUsers = (chatRoomId, usersOnline) => {
    io.to(chatRoomId).emit("update", usersOnline);
  };
  
  console.log(`User connected: ${id}`);
  
  socket.on("login", message => {
    console.log(message);
    
    nick = message.nick;
    chatroom = message.id;
    
    socket.join(message.id);
    
    if (chatrooms.has(message.id)) {
      addUserToChatroom(message.id, message.nick);
      updateOnlineUsers(message.id, chatrooms.get(message.id));
    } else {
      chatrooms.set(message.id, [message.nick]);
      updateOnlineUsers(message.id, chatrooms.get(message.id));
    }
  });

  socket.on("chat message", msg => {
    io.to(msg.id).emit("chat message", msg);
  });

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${id}, reason: ${reason}`);
    if (chatrooms.has(chatroom)) {
      removeUserOfChatRoom(chatroom, nick);
      updateOnlineUsers(chatroom, chatrooms.get(chatroom));
    }
  })
});