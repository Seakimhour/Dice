// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

var players = [];
var player = [];

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
  players = users;
  player = players.find(player => player.name === username);
});

function getPlayer() {
  return player;
}

// add click event to buttton
document.getElementById("btnStart").addEventListener("click", () => socket.emit('StartGame', {players:players, player:player}));
document.getElementById("btnRoll").addEventListener("click", () => socket.emit('rollTheDice', {player:player}));
document.getElementById("btnEndTurn").addEventListener("click", () => socket.emit('endTurn', player));
