const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Listen on *: ${PORT}`));

io.on("connection", socket => {
  const id = socket.client.id;
  
    console.log(`User connected: ${id}`);
  
  socket.on("login", message => {
    console.log(message);
    socket.join(message);
  });

  socket.on("chat message", msg => {
    io.to(msg.id).emit("chat message", msg);
  });

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${id}, reason: ${reason}`);
  })
});