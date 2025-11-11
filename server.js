const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Environment } = require("./envrionment.js");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;
app.use(express.static('public'))

// Configuration
const GRID_ROW = 3;


// Create rooms each room has one environment with 2 players
const ROOM_NUM = 9;
const PLAYER_PER_ROOM = 2;
const allRoomData = {};
for (let roomIndex = 0; roomIndex < ROOM_NUM; roomIndex++) {
  const roomID = String(roomIndex);
  allRoomData[roomID] = {
    env: new Environment(GRID_ROW),
    players: {},
  };
  allRoomData[roomID].env.reset();
};

// All the subjects
const backEndSubjects = {};
const subjectSocketIDMap = {};
for (let subjectIndex = 0; subjectIndex < ROOM_NUM * PLAYER_PER_ROOM; subjectIndex++) {
  subjectSocketIDMap[subjectIndex] = null;
}




// socket.io connection handling
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    // initialize backEndSubjects entry for this socket
    backEndSubjects[socket.id] = {
        subjectID: null,
        roomID: null,
        roleID: null,
        stage: 'waiting',
        trajectory: null,
        currentReward: 0,
        totalReward: 0,
    };

    // suggest a subjectID that is not taken
    for (let subjectIndex = 0; subjectIndex < ROOM_NUM * PLAYER_PER_ROOM; subjectIndex++) {
        if (subjectSocketIDMap[subjectIndex] === null) {
            io.to(socket.id).emit("suggestSubjectID", { suggestedSubjectID: subjectIndex });
            subjectSocketIDMap[subjectIndex] = socket.id;
            break;
        }
    }
  

    // handle subjectID submission
    socket.on('submitID', ({subjectID}) => {
        // check if subjectID is already taken by checking if subjectSocketIDMap maps to another socket
        if (subjectSocketIDMap[subjectID] !== null && subjectSocketIDMap[subjectID] !== socket.id) {
            // ID taken by someone else
            socket.emit('validateID', false);
            return;
        }

        // Clear old suggested ID if user is picking a different one
        if (subjectSocketIDMap[subjectID] === null) {
            const oldSubjectIDs = Object.keys(subjectSocketIDMap).filter(
                si => subjectSocketIDMap[si] === socket.id && si != subjectID
            );
            oldSubjectIDs.forEach(si => { subjectSocketIDMap[si] = null; });
        }
        socket.emit('validateID', true);
        subjectSocketIDMap[subjectID] = socket.id;
    
        // assign subject to room and role
        const subjectIndex = parseInt(subjectID);
        const roomIndex = Math.floor(subjectIndex / PLAYER_PER_ROOM);
        const roomID = String(roomIndex);
        const roleIndex = subjectIndex % PLAYER_PER_ROOM;
        const roleID = `player${roleIndex}`;
        backEndSubjects[socket.id].subjectIndex = subjectIndex;
        backEndSubjects[socket.id].subjectID = subjectID;
        backEndSubjects[socket.id].roomIndex = roomIndex;
        backEndSubjects[socket.id].roomID = roomID;
        backEndSubjects[socket.id].roleIndex = roleIndex;
        backEndSubjects[socket.id].roleID = roleID;
        allRoomData[roomID].players[roleID] = backEndSubjects[socket.id];

        // join the socket.io room
        socket.join(roomID);
        io.to(roomID).emit("roomStatus", {roomData: allRoomData[roomID], backEndSubjects});

        // console.log(`Game ON for subjectID: ${subjectID} joining room: ${roomID}`);
        // console.log(backEndSubjects);
        // console.log(allRoomData[roomID]);
    })

    // start planning when both players are ready
    socket.on('newTrial', () => {
        const roomID = backEndSubjects[socket.id].roomID;
        const roleID = backEndSubjects[socket.id].roleID;
        const roomData = allRoomData[roomID];
        roomData.players[roleID].stage = 'planning';
        if (Object.values(roomData.players).every(p => p.stage === 'planning')) {
            io.to(roomID).emit("startPlanning", {trial: allRoomData[roomID].env.trial, currentState: allRoomData[roomID].env.getState() });
        }
    });


    // receive planned trajectory from a player
    socket.on('finishPlanning', ({trajectory}) => {
        console.log(`Received trajectory from socket ${socket.id}:`, trajectory);
        const roomID = backEndSubjects[socket.id].roomID;
        const roleID = backEndSubjects[socket.id].roleID;
        
        // Check if player is assigned to a room
        // if (!roomID || !roleID) {
        //     console.error(`Socket ${socket.id} not assigned to room/role yet`);
        //     return;
        // }
        
        const roomData = allRoomData[roomID];
        // if (!roomData) {
        //     console.error(`Room ${roomID} does not exist`);
        //     return;
        // }
        
        roomData.players[roleID].trajectory = trajectory;
        roomData.players[roleID].stage = 'ready';
        const bothReady = Object.values(roomData.players).every(p => p.stage === 'ready');
        // if both players have planned, compute the step and send new state
        if (bothReady) {
            // compute step and get rewards
            const traj0 = roomData.players['player0'].trajectory;
            const traj1 = roomData.players['player1'].trajectory;
            const rewards = roomData.env.step(traj0, traj1);
            roomData.players['player0'].stage = 'outcome';
            roomData.players['player1'].stage = 'outcome';
            roomData.players['player0'].currentReward = rewards[0];
            roomData.players['player1'].currentReward = rewards[1];
            roomData.players['player0'].totalReward += rewards[0];
            roomData.players['player1'].totalReward += rewards[1];
            console.log(`Room ${roomID} rewards:`, rewards);
            // send outcome to both players
            io.to(roomID).emit("showOutcome", {roomPlayers: roomData.players});
        }
    });


    // handle disconnection
    socket.on("disconnect", () => {
        console.log("user disconnected:", socket.id);
        // if backEndSubjects[socket.id] exist
        const roomID = backEndSubjects[socket.id].roomID;
        const roleID = backEndSubjects[socket.id].roleID;
        delete backEndSubjects[socket.id];
        if (roleID !== null) {
            delete allRoomData[roomID].players[roleID];
            io.to(roomID).emit("roomStatus", {roomData: allRoomData[roomID], backEndSubjects});
        }
        // find where in subjectSocketIDMap this socket.id is mapped and clear it
        const oldSubjectIDs = Object.keys(subjectSocketIDMap).filter(si => Object.is(subjectSocketIDMap[si], socket.id));
        oldSubjectIDs.forEach(si => { subjectSocketIDMap[si] = null; });        
    });
  
});









// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); 
});