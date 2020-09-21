socket.on('rollTheDice', data => {
  if (data.rollAvailable < 0) return;

  prepareForRoll(data.storeDice, data.newRoll, data.player.id);

  runThrow(data.newRoll, data.player.id, data.rollAvailable);
  
  clearCell();
});

socket.on("selectPosition", data => {
  if (data.dice_index != undefined) {
    let dice_value = box.remove_dice_and_get_value(data.dice_index);
    socket.emit('selectDice', {dice_value:dice_value, player_id:data.player_id});
  }
});

socket.on('showStoreDice', storeDice => {
  store.store_dice(storeDice);
});

socket.on('endTurn', (nextPlayer) => {
  btnRoll.innerHTML = `ROLL(3)`;
  box.clear();
  store.store_dice([]);
  resetCurrentDice();
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
  let el = document.getElementById(data.type).children[data.player_id];
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
    total += player.specialDice - player.minus;
    document.getElementsByClassName(player.id + " total")[0].textContent = total;
  });
});

socket.on('StartGame', data => {
  // generate point cell base on number player
  clickableCell(data.players);
  
  turn(data.player);

  //Hide Game Start Button
  document.getElementById("btnStart").className += " scale-out";
});

function clickableCell(players) {
  let player = getPlayer();

  for (let p = 0; p < players.length; p++) {
    for (let i = 0; i < 17; i++) {
      let tr = document.getElementsByClassName("tr")[i];
      if (i == 0) {
        let div = document.createElement("div");
        div.id = `player-${players[p].name}`;
        div.className = 'th player-name';
        div.innerHTML = players[p].name;
        tr.appendChild(div);
      } else if (i == 7) {
        let div = document.createElement("div");
        div.className = 'th';
        tr.appendChild(div);
      } else if (i == 15) {
        let div = document.createElement("div");
        div.className = `th ${players[p].id} total`;
        div.innerHTML = 0;
        tr.appendChild(div);
      } else if (i == 16) {
        let div = document.createElement("div");
        div.className = `th ${players[p].id}`;
        div.id = players[p].id;
        div.innerHTML = "";
        tr.appendChild(div);
      } else {
        let div = document.createElement("div");
        div.className = "td point";
        div.id = players[p].id;

        if (players[p].id == player.id) {
          div.addEventListener("click", () => savePoint(div, player), false);
        }

        tr.appendChild(div);
      }
    }

    document.getElementById('chose-attack-content').innerHTML += 
    `
      <div class="col s12 m6">
        <a href="#!" onclick="powerPointHandler('${players[p].id}')">
          <div class="card blue-grey darken-1">
            <div class="card-content white-text">
              <span class="card-title">${players[p].name}</span>
              <p class="chose-attack-damage"></p>
            </div>
          </div>
        </a>
      </div>
    `;
  }
}

function turn(nextPlayer) {
  player_turn_id = nextPlayer.id;
  
  let player = getPlayer();

  let playerCell = document.getElementById('player-' + player.name);
  
  playerCell.classList.remove('z-depth-1');
  playerCell.classList.remove('blue');

  my_turn = false;
  if (!btnRoll.classList.contains('disabled')) btnRoll.className += ' disabled';
  if (!btnEndTurn.classList.contains('disabled')) btnEndTurn.className += ' disabled';
  
  if (!setTwoDice.classList.contains('disabled')) setTwoDice.className += ' disabled';
  if (!addOneDice.classList.contains('disabled')) addOneDice.className += ' disabled';
  if (!specialDice.classList.contains('disabled')) specialDice.className += ' disabled';
  if (!choseAttack.classList.contains('disabled')) choseAttack.className += ' disabled';
  if (!randomAttack.classList.contains('disabled')) randomAttack.className += ' disabled';

  if (player.id == nextPlayer.id) {
    my_turn = true;
    btnRoll.classList.remove('disabled');
    btnEndTurn.classList.remove('disabled');
    playerCell.className += ' z-depth-1 blue';
  }

  if (nextPlayer.power.setTwoDice > 0) setTwoDice.classList.remove('disabled');
  if (nextPlayer.power.addOneDice > 0) addOneDice.classList.remove('disabled');
  if (nextPlayer.power.specialDice > 0) specialDice.classList.remove('disabled');
  if (nextPlayer.power.choseAttack > 0) choseAttack.classList.remove('disabled');
  if (nextPlayer.power.randomAttack > 0) randomAttack.classList.remove('disabled');
}

socket.on('SetRound', currentRound => {
  round.innerHTML = `Round ${currentRound}/13`;
});

// Point Calculation
function pointCalculation(result, player_turn_id) {
  let roll_point = {
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
  };
  let pointArray = [0, 0, 0, 0, 0, 0];
  let pointObj = {
    aces: 0,
    twos: 0,
    threes: 0,
    fours: 0,
    fives: 0,
    sixes: 0,
  };

  result.forEach((e) => {
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
    roll_point[property] = numbers * pointObj[property];
    numbers++;
  }

  let zeroCount = pointArray.filter((e) => e == 0).length;
  let maxN = Math.max(...pointArray);

  let connectLength = connect(pointArray);
  console.log(connectLength);

  if (connectLength > 3) roll_point.small_straight = 30;
  if (connectLength > 4) {
    roll_point.small_straight = 30;
    roll_point.large_straight = 40;
  }

  if (maxN == 3) roll_point.three_of_a_kind = sumAll(result);
  if (maxN == 4) {
    roll_point.four_of_a_kind = sumAll(result);
    roll_point.three_of_a_kind = sumAll(result);
  }

  if (maxN == 5) roll_point.yahtzee = 50;

  roll_point.chance = sumAll(result);

  if (zeroCount == 4 && maxN == 3) roll_point.full_house = 25;
  
  for (const property in roll_point) {
    let cell = document.getElementById(property).children[player_turn_id];
    if (!cell.classList.contains("completed") && roll_point[property] > 0) cell.innerHTML = roll_point[property];
  }
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

function sumAll(newRoll) {
  let sum = 0;
  newRoll.forEach((dice) => {
    sum += parseInt(dice);
  });
  return sum;
}

socket.on('powerHandler', (data) => {
  let player = getPlayer();
  setTimeout(() => {
    if (player.id == data.player.id) {
      if (data.type == 'specialDice') {
        powerPointHandler(data.type);
      } else if (data.type == 'choseAttack') {
        $('#modal-chose-attack').modal('open');
      } else if (data.type == 'randomAttack') {
        powerPointHandler(data.type);
      }
    }
    turn(data.player);
    clearCell();
    box.clear();
  }, 3000);
});

socket.on('displayChange', data => {
  let el = document.getElementById('change').children[data.player_id];
  if (data.type == 'green') {
    el.style.color = 'green';
    el.innerHTML = `+${data.change}`;
  } else {
    el.style.color = 'red';
    el.innerHTML = `-${data.change}`;
  }
});