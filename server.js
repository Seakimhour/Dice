const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getUsers,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static("public"));

const botName = "System";

var rollableDice = 5;
var rollAvailable = 3;
var currentDice = [];
var storeDice = [];
var currentTurn = "";

var currentRound = 1;
var startOrigin = "";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to Waiting Room!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.name} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Return users include points
  socket.on("playerPoint", () => {
    let users = getUsers();
    io.emit("playerPoint", users);
  });

  // When click on dice
  socket.on("selectDice", (data) => {
    io.emit("selectDice", data);
  });

  // remove dice and show it in storeDice
  socket.on("showStoreDice", (data) => {
    if (data.player_id == socket.id) {
      rollableDice--;
      storeDice.push(data.dice);
    }
    io.emit("showStoreDice", storeDice);
  });

  // Listen for Game Start
  socket.on("StartGame", (data) => {
    rollableDice = 5;
    rollAvailable = 3;
    currentDice = [];
    storeDice = [];
    currentTurn = data.player.id;
    startOrigin = data.player.id;
    currentRound = 1;

    console.log("currentTurn : " + currentTurn);
    io.emit("StartGame", data);
    io.emit("SetRound", currentRound);
  });

  // Listen for Die Rolling
  socket.on("rollTheDice", (data) => {
    currentDice = [];
    let faceValue;

    for (i = 1; i <= rollableDice; i++) {
      faceValue = Math.floor(Math.random() * 6) + 1;
      currentDice.push(faceValue);
    }

    data["allDice"] = [...storeDice, ...currentDice];
    data["currentDice"] = currentDice;
    rollAvailable--;
    data["rollAvailable"] = rollAvailable;
    io.emit("rollTheDice", data);
  });

  // Listen for Game Start
  socket.on("savePoint", (data) => {
    const user = getCurrentUser(socket.id);
    if (data.player_id == user.id) {
      user.point[data.type] = data.point;
    }
    io.emit("savePoint", data);
  });

  // Reset
  socket.on("endTurn", () => {
    storeDice = [];
    currentDice = [];
    rollableDice = 5;
    rollAvailable = 3;

    let users = getUsers();
    let nextPlayer = {};
    let nextTurn = "";

    for (let i = 0; i < users.length; i++) {
      if (users[i].id == currentTurn) {
        if (users[i + 1] != undefined) {
          nextPlayer = users[i + 1];
          nextTurn = users[i + 1].id;
        } else {
          nextPlayer = users[0];
          nextTurn = users[0].id;
        }
      }
    }
    currentTurn = nextTurn;
    io.emit("endTurn", nextPlayer);
    if (currentTurn == startOrigin) {
      currentRound++;
      io.emit("SetRound", currentRound);
    }
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.name, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    let user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.name} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
