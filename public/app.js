const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Initialize canvas size
resizectxForHiDPI();
window.addEventListener('resize', resizectxForHiDPI);

// GLOBAL VARIABLES
const GRID_ROW = 3
const GRID_SIZE = 100
const GRID_GAP = 0
const roleNames = {'player0': 'Robber',   'player1': 'Police'}
const roleColors = {'player0': '#F42F49',   'player1': '#00B0F0', "both": "#9411F9" };

let currentMessage = null;
let messageTimeout = null;
let theLoopId = null;
let myRoleID = null;
let opRoleID = null;

// Timings (in ms)
const waitRoomTimeout = 1500;
const bothReadyTimeout = 1500;
const eachMovementTimeout = 1000;
const outcomeTimeout = 3000;


// Initialize Grids and Players
const myMaze = new Maze(GRID_ROW, GRID_SIZE, GRID_GAP);
let playersData = null;


///////////////////////////////// loops ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// Waiting loop - draws message while waiting for players
function waitLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (currentMessage) {showMessage(currentMessage, 1.25);}
  drawRole(myRoleID);
  theLoopId = requestAnimationFrame(waitLoop);
}


// plan loop
function planLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  myMaze.drawAll();
  // Stop the loop if trajectory exceeds HORIZON
  if (myMaze.myTrajectory.length > myMaze.HORIZON) {
    cancelAnimationFrame(theLoopId);
    theLoopId = null;
    console.log("Planning complete. Trajectory:", myMaze.myTrajectory);
    socket.emit('finishPlanning', {trajectory: myMaze.myTrajectory});
    currentMessage = "Ready! Waiting for the other player...";
    // move to ready loop
    myMaze.currentStage = "ready";
    readyLoop();
    return;
  }
  theLoopId = requestAnimationFrame(planLoop);
}


// ready loop after plan submission
function readyLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  myMaze.drawAll();
  if (currentMessage) {showMessage(currentMessage, 2);}
  theLoopId = requestAnimationFrame(readyLoop);
}

// outcome loop after receiving outcome
function outcomeLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  myMaze.drawAll();
  if (currentMessage) {showMessage(currentMessage, 2);}
  theLoopId = requestAnimationFrame(outcomeLoop);
  
}


/////////////////////////////// socket.io //////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// Initialize socket connection
const socket = io();


// Start the waiting loop when socket connects
socket.on("connect", () => {
  console.log("Connected to server");
  // document.querySelector('#subjectIDForm').style.display = 'flex';
});


// at the beginning, match subjects with players and rooms
socket.on("suggestSubjectID", ({ suggestedSubjectID }) => {
  const subjectIDInput = document.getElementById('subjectIDInput');
  subjectIDInput.placeholder = `Suggested ID: ${suggestedSubjectID}`;
});



// room start or waiting for another player
socket.on("roomStatus", ({roomData, backEndSubjects}) => {
  myRoleID = backEndSubjects[socket.id].roleID;  
  opRoleID = myRoleID === 'player0' ? 'player1' : 'player0';
  myMaze.setRole(myRoleID);

  const roomIsFull = Object.keys(roomData.players).length === 2;
  // Clear any existing timeout
  if (messageTimeout) clearTimeout(messageTimeout);
  // Start the waiting loop if not already running
  if (!theLoopId) {waitLoop();}
  if (roomIsFull) {
    // Both players ready
    currentMessage = `Both players joined the room!`;
    messageTimeout = setTimeout(() => {
      if (theLoopId) {
        cancelAnimationFrame(theLoopId);
        theLoopId = null;
      }
      // TODO: Start your actual trial loop here
      socket.emit('newTrial');
    }, waitRoomTimeout);
  } else {
    currentMessage = "Waiting for another player to join...";
  }
});


// start planning phase
socket.on("startPlanning", ({trial, currentState}) => {
  myMaze.currentStage = "planning"
  myMaze.trial = trial;
  myMaze.updateGoalLocations(currentState.goalLocations);
  myMaze.updatePlayerLocations(currentState.playerLocations);
  planLoop();
});



// if both players are ready show trajectories
socket.on("showOutcome", ({roomPlayers}) => {
    playersData = roomPlayers;
    console.log("Both players ready. Showing trajectories...");
    cancelAnimationFrame(theLoopId);
    theLoopId = null;
    ShowTrajectory();
    outcomeLoop();

});






// show trajectories one by one
const ShowTrajectory = async () => {
    currentMessage = null;
    myMaze.opTrajectory = playersData[opRoleID].trajectory;
    for (let seq = 0; seq < myMaze.myTrajectory.length; seq++) {
        myMaze.myLocation = myMaze.myTrajectory[seq];
        myMaze.opLocation = myMaze.opTrajectory[seq];
        //
        if (myMaze.opLocation === myMaze.myLocation) {
            myMaze.grids[myMaze.opLocation].color = myMaze.setColorTransparency(roleColors["both"], (seq+1) / (myMaze.HORIZON+1));
        } else {
            myMaze.grids[myMaze.opLocation].color = myMaze.setColorTransparency(myMaze.opColor, (seq+1) / (myMaze.HORIZON+1));
        }
        // wait for 1000ms
        await new Promise(resolve => setTimeout(resolve, eachMovementTimeout));
    }
    currentMessage = `Your points: ${playersData[myRoleID].currentReward}`;
    await new Promise(resolve => setTimeout(resolve, outcomeTimeout));

    currentMessage = null;
    myMaze.resetGridColors();
    socket.emit('newTrial');
};