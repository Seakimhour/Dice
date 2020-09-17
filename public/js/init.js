const btnStart = document.getElementById("btnStart");
const btnRoll = document.getElementById('btnRoll');
const btnEndTurn = document.getElementById('btnEndTurn');
const rollCountIcon = document.querySelector('#btnRoll i');
const disabled = document.getElementsByClassName('disabled');
const round = document.getElementById('round');
const selectedDice = document.getElementById("selected-dice");

const setTwoDice = document.getElementById('power-setTwoDice');
const setTwoDiceOne = document.getElementById('power-setTwoDice-1');
const setTwoDiceTwo = document.getElementById('power-setTwoDice-2');
const setTwoDiceThree = document.getElementById('power-setTwoDice-3');
const setTwoDiceFour = document.getElementById('power-setTwoDice-4');
const setTwoDiceFive = document.getElementById('power-setTwoDice-5');
const setTwoDiceSix = document.getElementById('power-setTwoDice-6');
const addOneDice = document.getElementById('power-addOneDice');
const specialDice = document.getElementById('power-specialDice');
const choseAttack = document.getElementById('power-choseAttack');
const randomAttack = document.getElementById('power-randomAttack');

$t.dice.use_true_random = false;

var player_turn_id = "";
var my_turn = false;
var current_dice = '5d6';
var result_value = [];
var storeDice = [];

function resetCurrentDice() {
  current_dice = '5d6';
}

var store = new $t.dice.store_box(selectedDice);

var canvas = $t.id('canvas');
canvas.style.width = canvas.clientWidth + 6 + 'px';
canvas.style.height = canvas.clientHeight + 6 + 'px';
var box = new $t.dice.dice_box(canvas);
box.animate_selector = false;

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
btnStart.addEventListener("click", () => socket.emit('StartGame', {players:players, player:player}));
btnRoll.addEventListener("click", () => socket.emit('rollTheDice', {player:player}));
btnEndTurn.addEventListener("click", () => socket.emit('endTurn', player));

// Throw Dice
// box.bind_mouse(canvas, notation_getter, before_roll, after_roll);

// decide result before roll
function before_roll(vectors, notation, callback) {
  // enter the wanted result, example: callback([2, 2, 2, 2]);
  console.log('before_roll: ' + result_value);
  callback(result_value);
}

// Return dice set and more
function notation_getter() {
  return $t.dice.parse_notation(current_dice);
}

// Get result after roll
function after_roll(notation, result) {
  console.log('after_roll:  ' + result);
  pointCalculation([...result, ...storeDice], player_turn_id);
}

// Get Selected Dice
$t.bind(canvas, ['mouseup', 'touchend'], function(ev) {
  ev.stopPropagation();
  if (!my_turn) return;
  
  let diceIndex = box.search_dice_by_mouse(ev);

  socket.emit('selectPosition', {dice_index:diceIndex, player_id:player.id});
});

// auto resize canvas to match window size
$t.bind(window, 'resize', () => box.reinit(canvas));

function prepareForRoll(storedDice, dices, playerId) {
  current_dice = dices.length + 'd6';
  storeDice = storedDice;
  result_value = dices;
  player_turn_id = playerId;
}

// Power
var power_active = null;

setTwoDiceOne.addEventListener("click", () => socket.emit('powerUsed', {type:'setTwoDice', value:1, player_id:player_turn_id}));
setTwoDiceTwo.addEventListener("click", () => socket.emit('powerUsed', {type:'setTwoDice', value:2, player_id:player_turn_id}));
setTwoDiceThree.addEventListener("click", () => socket.emit('powerUsed', {type:'setTwoDice', value:3, player_id:player_turn_id}));
setTwoDiceFour.addEventListener("click", () => socket.emit('powerUsed', {type:'setTwoDice', value:4, player_id:player_turn_id}));
setTwoDiceFive.addEventListener("click", () => socket.emit('powerUsed', {type:'setTwoDice', value:5, player_id:player_turn_id}));
setTwoDiceSix.addEventListener("click", () => socket.emit('powerUsed', {type:'setTwoDice', value:6, player_id:player_turn_id}));
addOneDice.addEventListener("click", () => socket.emit('powerUsed', {type:'addOneDice', value:1, player_id:player_turn_id}));
specialDice.addEventListener("click", () => socket.emit('powerUsed', {type:'specialDice', value:1, player_id:player_turn_id}));
choseAttack.addEventListener("click", () => socket.emit('powerUsed', {type:'choseAttack', value:1, player_id:player_turn_id}));
randomAttack.addEventListener("click", () => socket.emit('powerUsed', {type:'randomAttack', value:1, player_id:player_turn_id}));

socket.on('powerUsed', power => {

  if (!setTwoDice.classList.contains('disabled')) setTwoDice.className += ' disabled';
  if (!addOneDice.classList.contains('disabled')) addOneDice.className += ' disabled';
  if (!specialDice.classList.contains('disabled')) specialDice.className += ' disabled';
  if (!choseAttack.classList.contains('disabled')) choseAttack.className += ' disabled';
  if (!randomAttack.classList.contains('disabled')) randomAttack.className += ' disabled';

  switch (power.type) {
    case 'setTwoDice': 
      $('#power-setTwoDice i').text(`filter_${power.value}`);
      setTwoDice.classList.remove('disabled');
    break;
    case 'addOneDice': 
      addOneDice.classList.remove('disabled');
    break;
    case 'specialDice': 
      specialDice.classList.remove('disabled');
    break;
    case 'choseAttack': 
      choseAttack.classList.remove('disabled');
    break;
    case 'randomAttack': 
      randomAttack.classList.remove('disabled');
    break;
  }

  document.getElementById('power-' + power.type).className += ' pulse';
  power_active = power;
});

function runThrow(newRoll, player_id, rollAvailable) {
  if (power_active != null) {
    switch (power_active.type) {
      case 'setTwoDice': 
        btnRoll.innerHTML = `ROLL(${rollAvailable})`;
        $('#power-setTwoDice i').text(`filter_none`);
        result_value = [...newRoll.splice(0, newRoll.length - 2), power_active.value, power_active.value];
      break;
      case 'addOneDice': 
        btnRoll.innerHTML = `ROLL(${rollAvailable})`;
        current_dice = (newRoll.length + 1) + 'd6';
        result_value = [...result_value, power_active.newValue];
      break;
      case 'specialDice': 
        current_dice = '1d12';
        storeDice = [0,0,0,0];
        result_value = [power_active.newValue];
        player_turn_id = player_id;
        socket.emit('powerHandler', {player_id:player_id, type:power_active.type});
      break;
      case 'choseAttack': 
        let sum = sumAll(result_value);
        $('.chose-attack-damage').each(function () {
          $(this).text('this player will receive -' + sum + ' point.');
        });
        socket.emit('powerHandler', {player_id:player_id, type:power_active.type});
      break;
      case 'randomAttack': 
        socket.emit('powerHandler', {player_id:player_id, type:power_active.type});
      break;
    }
    
    power_active = null;
    $('.pulse').removeClass('pulse');
  } else {
    btnRoll.innerHTML = `ROLL(${rollAvailable})`;
  }
  box.start_throw(notation_getter, before_roll, after_roll);
}

function powerPointHandler(para) {
  
  socket.emit('powerPointHandler', {para:para, point:sumAll(result_value)});
  
  $('#modal-special-dice').modal('close');
  $('#modal-chose-attack').modal('close');
}