const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const { addUser, removeUser, getUser, getUserInRoom } = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("NEW CONNECTION ");

  // Join User
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    // Send To Client
    socket.emit("userMessage", generateMessage("admin", "Welcome!"));

    //New User In Same Room
    socket.broadcast
      .to(user.room)
      .emit(
        "userMessage",
        generateMessage("admin", `${user.username} has joined!`)
      );
    // New User
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });
    callback();
  });

  // listen From Client
  socket.on("sendMsg", (msg, callback) => {
    const user = getUser(socket.id);

    //Filter Words
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Not Allowed!!");
    }

    io.to(user.room).emit("userMessage", generateMessage(user.username, msg));
    callback();
  });

  //Loaction
  socket.on("sendlocation", (msg, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "userLocation",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps/@=${msg.latitude},${msg.longitude},7z`
      )
    );
    callback();
  });

  //DisConnection For User
  socket.on("disconnect", () => {
    //Remove User
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "userMessage",
        generateMessage("admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUserInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server On Port ${port}`);
});
