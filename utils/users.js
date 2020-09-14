const users = [];

// Join user to chat
function userJoin(id, username, room) {
  const user = {
    id: id,
    name: username,
    room: room,
    point: {
      aces: 0,
      twos: 0,
      threes: 0,
      fours: 0,
      fives: 0,
      sixes: 0,
      three_of_a_kind: 0,
      four_of_a_kind: 0,
      full_house: 0,
      small_straight: 0,
      large_straight: 0,
      yahtzee: 0,
      chance: 0,
    },
    specialDice: 0,
    minus: 0,
    power: {
      setTwoDice:1,
      addOneDice:1,
      specialDice:1,
      choseAttack:1,
      randomAttack:1,
    }
  };

  users.push(user);

  return user;
}

// Get all users
function getUsers() {
  return users;
}

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

module.exports = {
  userJoin,
  getUsers,
  getCurrentUser,
  userLeave,
  getRoomUsers
};
