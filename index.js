const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Listen on *: ${PORT}`));

let chatrooms = new Map(); //Map as container for chatrooms

//Add handler for "login" event, for add new user to chatroom
const addUserToChatroom = (idChatRoom, user) => {
  let roomUsers = chatrooms.get(idChatRoom);
  roomUsers.push(user);
  chatrooms.set(idChatRoom, roomUsers);
};

//Add handler for "disconnect" event, for delete disconnected user
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
  //function for send all chatroom members list of online users
  const updateOnlineUsers = (chatRoomId, usersOnline) => {
    io.to(chatRoomId).emit("update", usersOnline);
  };
  
  console.log(`User connected: ${id}`);
  
  socket.on("login", message => {
    console.log(message);
    //save scoket id & user's nick
    nick = message.nick;
    chatroom = message.id;
    //create chatroom
    socket.join(message.id);
    
    if (chatrooms.has(message.id)) {  //for new user (who connect to " ./ " URL) need create new chatroom & update users online list
      addUserToChatroom(message.id, message.nick);
      updateOnlineUsers(message.id, chatrooms.get(message.id));
    } else {  //for guest (who connect from copyed link " ./:id " URL) need add user to already existing chatroom & update users online list
      chatrooms.set(message.id, [message.nick]);
      updateOnlineUsers(message.id, chatrooms.get(message.id));
    }
  });
  //send messages to chatroom users
  socket.on("chat message", msg => {
    io.to(msg.id).emit("chat message", msg);
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${id}, reason: ${reason}`);
    if (chatrooms.has(chatroom)) {  //on user disconnected, need remove him from chatroom & update users online list
      removeUserOfChatRoom(chatroom, nick);
      updateOnlineUsers(chatroom, chatrooms.get(chatroom));
    }
  })
});