// High-DPI canvas setup
const resizectxForHiDPI = () => {
    const DPR = window.devicePixelRatio || 1;
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;

    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    canvas.width = Math.floor(cssWidth * DPR);
    canvas.height = Math.floor(cssHeight * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
};




// Helper function to show/update waiting message on canvas
function showMessage(message, scaleY) {
  // Clear canvas (use the full resolution, not CSS size)
  const DPR = window.devicePixelRatio || 1;
  const centerX = canvas.width / 2 / DPR;
  const centerY = canvas.height / 2 / DPR;
  
  // Draw text centered
  ctx.fillStyle = 'black';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, centerX, centerY + GRID_SIZE * scaleY);
}


// draw the role image and text
const drawRole = (roleID) => {
    const DPR = window.devicePixelRatio || 1;
    const centerX = canvas.width / 2 / DPR;
    const centerY = canvas.height / 2 / DPR;

    const image = playerImages[roleID];
    if (!image) return;
    ctx.drawImage(image, centerX - GRID_SIZE, centerY - GRID_SIZE, GRID_SIZE * 2, GRID_SIZE * 2);

    // Draw text centered
    ctx.fillStyle = roleColors[roleID];
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    roleText = `Your role is: ${roleNames[roleID]}`;
    ctx.fillText(roleText, centerX, centerY - 1.2 * GRID_SIZE);
}

