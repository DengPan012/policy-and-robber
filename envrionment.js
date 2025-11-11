const e = require('express');
const { permute, shuffle} = require('./helpers.js');
const { get } = require('http');

class Environment {
  constructor(GRID_ROW) {
    this.GRID_ROW = GRID_ROW;
    this.GRID_NUM = GRID_ROW * GRID_ROW;
    this.HORIZON = GRID_ROW - 1;
    this.PLAYER_NUM = 2;
    this.GOAL_NUM = 2;
    this.REPEAT = 4; // 5
    this.goalValue = [1, 3];
  }

  reset() {
    this.generateSequence();
    this.trial = 0;
    this.update();
  }


  getAvailableLocations(goalPair) {
    const step = goalPair.includes(0) ? this.GRID_ROW - 1 : this.GRID_ROW + 1;
    const start = goalPair.includes(0) ? this.GRID_ROW - 1 : 0;
    return Array.from({ length: this.GRID_ROW }, (_, i) => start + i * step);
  }

  generateSequence() {
    const LocationSequence = [];
    const goalPair1 = [0, this.GRID_NUM - 1];
    const goalPair2 = [this.GRID_ROW - 1, this.GRID_ROW * (this.GRID_ROW - 1)];

    const goalPairs = [goalPair1, goalPair2, [...goalPair1].reverse(), [...goalPair2].reverse()];

    for (const goalPair of goalPairs) {
      const availableLocations = this.getAvailableLocations(goalPair);
      const allPermutations = permute(availableLocations, this.PLAYER_NUM, true);
      for (const perm of allPermutations) {
        LocationSequence.push({
          "goalLocations": goalPair,
          "playerLocations": perm,
        });
      }
    }
    // repeate the LocationSequence
    const REP_TIMES = (this.GRID_ROW === 3) ? this.REPEAT : (this.GRID_ROW === 4) ? 2 : 1;
    this.StateSequence = shuffle(Array.from({length: REP_TIMES}, () => LocationSequence).flat());

  }



  
  update() {
    this.currentState = this.StateSequence[this.trial]
    // update the value map
    this.currentValueMap = Array(this.GRID_NUM).fill(0);
    for (const [i, goal] of this.currentState.goalLocations.entries()) {
      this.currentValueMap[goal] = this.goalValue[i];
    }
  }


  getState() {
    return this.currentState
  }


  step(traj0, traj1) {
    let catchCount = 0;
    let rewards = [0, 0];
    for (let t = 0; t < traj0.length; t++) {
      const loc0 = traj0[t];
      const loc1 = traj1[t];
      catchCount += (loc0 === loc1);
      if (this.currentState.goalLocations.includes(Number(loc0))) {
        rewards[0] += this.currentValueMap[Number(loc0)];
      }
    }
    if (catchCount > 0) {
      rewards = [-2, 2];
    }
    // Update the state
    this.trial += 1;
    if (this.trial < this.StateSequence.length) {
      this.update();
    }
    return rewards;
  }



  PlayerReady(playerIndex) {
    this.currentState.ready[playerIndex] = true;
  }

  checkBothReady() {
    const bothReady = this.currentState.ready.every(status => status === true);
    return bothReady;
  }



}


module.exports = { Environment };