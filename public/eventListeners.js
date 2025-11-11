


document.querySelector('#subjectIDForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const subjectIDInput = document.querySelector('#subjectIDInput');
  const subjectID = subjectIDInput.value.trim();

  // Prevent empty input
  if (!subjectID) {
    alert('Please enter a Subject ID');
    return;
  }
  socket.emit('submitID', {subjectID: subjectID});
  // wait until server confirms the subjectID is accepted
  socket.on('validateID', (valid) => {
    if (valid) {
      document.querySelector('#subjectIDForm').style.display = 'none';
    } else {
      alert('Subject ID already taken. Please choose another one.');
    }
  });
});




// hovering effect for grids
addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);
    
    // Find the grid being hovered
    let hoveredLocation = null;
    Object.entries(myMaze.grids).forEach(([index, grid]) => {
        if (x >= grid.x && x <= grid.x + GRID_SIZE &&
            y >= grid.y && y <= grid.y + GRID_SIZE) {
            hoveredLocation = index;
        }
    });
    myMaze.handleHover(hoveredLocation)
});



// click to make a move
addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);

    // Find the grid that was clicked
    let clickedLocation = null;
    Object.entries(myMaze.grids).forEach(([index, grid]) => {
        if (x >= grid.x && x <= grid.x + GRID_SIZE &&
            y >= grid.y && y <= grid.y + GRID_SIZE) {
            clickedLocation = index;
        }
    });
    myMaze.handleClick(clickedLocation);
});





// addEventListener('keydown', (event) => {
//     if (event.code === 'Space' || event.key === ' ') {
//         if (myMaze.myTrajectory && myMaze.myTrajectory.length > myMaze.HORIZON) {
//             event.preventDefault();
//             console.log('Emitting Ready event with clickedLocationSeq:', myMaze.myTrajectory);
//             socket.emit('Ready', { myTrajectory: myMaze.myTrajectory, myMovements: myMaze.myMovements } );
//             // change myStatus to 'ready'
//             roomPlayers[myRole].status = 'ready';

//         }
//     }
// });