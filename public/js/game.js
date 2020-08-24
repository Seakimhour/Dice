const btnRoll = document.getElementById('btnRoll');
const btnEndTurn = document.getElementById('btnEndTurn');
const disabled = document.getElementsByClassName('disabled');

const round = document.getElementById('round');
const selectedDice = document.getElementById("selected-dice");
const diceRoll = document.getElementById("dice-roll");

socket.on('rollTheDice', data => {
  if (data.rollAvailable >= 0) {

    btnRoll.innerHTML = `ROLL DICE (${data.rollAvailable})`;
    diceRoll.innerHTML = "";

    let output = "", json = "";
  
    for (i = 1; i <= data.currentDice.length; i++) {
      output = `<img src="assets/dice-${data.currentDice[i-1]}.png" alt="">`;
      json = JSON.stringify({dice_index:i, player_id:data.player.id});
      diceRoll.innerHTML += `<a href="#" onClick=selectDice('${json}') class="dice dice-${i}" id="${data.currentDice[i-1]}">${output}</a>`;
    }
  
    clearCell();
    pointCalculation(data.allDice, data.player);
    // socket.emit('playerPoint');
  }
});

function selectDice(data) {
  data = JSON.parse(data);
  socket.emit('selectDice', data);
};

socket.on('selectDice', data => {
  let element = document.getElementsByClassName("dice-" + data.dice_index)[0];
  let dice = parseInt(element.id);
  element.remove();
  socket.emit('showStoreDice', {dice:dice, player_id:data.player_id});
});

socket.on('showStoreDice', storeDice => {
  selectedDice.innerHTML = "";
  storeDice.forEach(dice => {
    let output = `<img src="assets/dice-${dice}.png" alt="">`;
    selectedDice.innerHTML += `<a class="dice">${output}</a>`;
  });
});

socket.on('endTurn', (nextPlayer) => {
  btnRoll.innerHTML = `ROLL DICE (3)`;
  diceRoll.innerHTML = "";
  selectedDice.innerHTML = "";
  clearCell();
  turn(nextPlayer);
  socket.emit('playerPoint');
});

function savePoint(el, player) {
  if (!el.classList.contains("completed") && el.textContent != 0 && el.textContent != "") {
    for (const property in player.point) {
      if (property == el.parentNode.id) {
        socket.emit('savePoint', {player_id:player.id, type:property, point:parseInt(el.textContent)});
        socket.emit('endTurn');
      }
    }
  }
}

socket.on('savePoint', data => {
  let el = document.getElementById(data.type);
  el = el.querySelector("#" + data.player_id);
  el.className += " z-depth-1 completed";
});

function clearCell() {
  let pointBox = document.getElementsByClassName("point");
  for (let i = 0; i < pointBox.length; i++) {
    if (!pointBox[i].classList.contains('completed')) {
      pointBox[i].innerHTML = "";
    }
  }
}

socket.on('playerPoint', (players) => {
  players.forEach(player => {
    let total = 0;
    let point = player.point;
    for (const property in point) {
      if (point[property] > 0) {
        let cell = document.getElementById(property).children[player.id];
        cell.innerHTML = point[property];
        total += point[property];
      }
    }
    document.getElementsByClassName(player.id + " total")[0].textContent = total;
  });
});

socket.on('StartGame', data => {
  
  // generate point cell base on number player
  clickableCell(data.players);
  
  turn(data.player);

  //Show game stage
  document.getElementsByClassName('stage')[0].className += " flex";
});

function clickableCell(players) {

  let player = getPlayer();

  for (let p = 0; p < players.length; p++) {
    for (let i = 0; i < 16; i++) {
      let tr = document.getElementsByTagName("tr")[i];
      if (i == 0) {
        let th = document.createElement("th");
        th.id = `player-${players[p].name}`;
        th.innerHTML = players[p].name;
        tr.appendChild(th);
      } else if (i == 7) {
        let th = document.createElement("th");
        tr.appendChild(th);
      } else if (i == 15) {
        let th = document.createElement("th");
        th.className = `${players[p].id} total`;
        th.innerHTML = 0;
        tr.appendChild(th);
      } else {
        let td = document.createElement("td");
        td.id = players[p].id;
        td.className = "point";

        if (players[p].id == player.id) {
          td.addEventListener("click", () => savePoint(td, player), false);
        }

        tr.appendChild(td);
      }
    }
  }
}

function turn(nextPLayer) {

  let player = getPlayer();
  // let playerName = docuemnt.getElementById('player-' + player.name);
  
  if (!btnRoll.classList.contains('disabled') && !btnEndTurn.classList.contains('disabled')) {
    btnRoll.className += ' disabled';
    btnEndTurn.className += ' disabled';
  }

  if (player.id == nextPLayer.id) {
    btnRoll.classList.remove('disabled');
    btnEndTurn.classList.remove('disabled');
  }
}

socket.on('SetRound', currentRound => {
  round.innerHTML = `Round ${currentRound}/13`;
});

// Point Calculation
function pointCalculation(currentDice, player) {
  let pointArray = [0, 0, 0, 0, 0, 0];
  let pointObj = {
    aces: 0,
    twos: 0,
    threes: 0,
    fours: 0,
    fives: 0,
    sixes: 0,
  };

  currentDice.forEach((e) => {
    if (e == 1) {
      pointObj.aces++;
      pointArray[0]++;
    } else if (e == 2) {
      pointObj.twos++;
      pointArray[1]++;
    } else if (e == 3) {
      pointObj.threes++;
      pointArray[2]++;
    } else if (e == 4) {
      pointObj.fours++;
      pointArray[3]++;
    } else if (e == 5) {
      pointObj.fives++;
      pointArray[4]++;
    } else if (e == 6) {
      pointObj.sixes++;
      pointArray[5]++;
    }
  });

  let numbers = 1;
  for (const property in pointObj) {
    let type = document.getElementById(property).children[player.id];
    if (pointObj[property] > 0 && !type.classList.contains("completed")) type.innerHTML = numbers * pointObj[property];
    numbers++;
  }

  let zeroCount = pointArray.filter((e) => e == 0).length;
  let maxN = Math.max(...pointArray);

  let three_of_a_kind = document.getElementById("three_of_a_kind").children[player.id];
  let four_of_a_kind = document.getElementById("four_of_a_kind").children[player.id];
  let full_house = document.getElementById("full_house").children[player.id];
  let small_straight = document.getElementById("small_straight").children[player.id];
  let large_straight = document.getElementById("large_straight").children[player.id];
  let yahtzee = document.getElementById("yahtzee").children[player.id];
  let chance = document.getElementById("chance").children[player.id];

  if (zeroCount == 1 && maxN == 1) {
    if (connect(pointArray) > 3 && !small_straight.classList.contains("completed")) small_straight.innerHTML = 30;
    if (connect(pointArray) > 4 && !large_straight.classList.contains("completed")) large_straight.innerHTML = 40;
  }
  if (zeroCount == 2 && maxN == 2 && connect(pointArray) > 3 && !small_straight.classList.contains("completed")) small_straight.innerHTML = 30;
  if (zeroCount == 3 && maxN == 3 && !three_of_a_kind.classList.contains("completed")) three_of_a_kind.innerHTML = sumAll(currentDice);
  if (zeroCount == 4 && maxN == 3 && !full_house.classList.contains("completed")) full_house.innerHTML = 25;
  if (zeroCount == 4 && maxN == 4 && !four_of_a_kind.classList.contains("completed")) four_of_a_kind.innerHTML = sumAll(currentDice);
  if (zeroCount == 5 && maxN == 5 && !yahtzee.classList.contains("completed")) yahtzee.innerHTML = 50;
  if (!chance.classList.contains("completed")) chance.innerHTML = sumAll(currentDice);
}

function connect(pointArray) {
  let count = 0;
  let max = 0;
  pointArray.forEach((e) => {
    if (e != 0) {
      count++;
      if (count > max) {
        max++;
      }
    } else {
      count = 0;
    }
  });
  return max;
}

function sumAll(currentDice) {
  let sum = 0;
  currentDice.forEach((dice) => {
    sum += parseInt(dice);
  });
  return sum;
}