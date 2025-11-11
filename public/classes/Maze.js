class Maze {
    constructor(GRID_ROW, GRID_SIZE, GRID_GAP) {
        this.GRID_ROW = GRID_ROW;
        this.GRID_NUM = GRID_ROW * GRID_ROW;
        this.GRID_SIZE = GRID_SIZE;
        this.GRID_GAP = GRID_GAP;
        this.HORIZON = GRID_ROW - 1;

        this.myRoleID = null;
        this.myRoleIndex = null;
        this.myColor = null;
        this.opRoleID = null;
        this.opRoleIndex = null;
        this.opColor = null;

        this.myLocation = null;
        this.opLocation = null;
        this.currentLocation = null;

        this.currentStage = null;
        this.hoveredLocation = null;
        this.clickedLocation = null;

        this.goalLocations = [];
        this.resetTrajectory();
        this.resetGrids();
        // Update grid positions on window resize
        window.addEventListener('resize', () => this.resetGridCoordinates());
    }


    resetTrajectory() {
        this.myTrajectory = [];
        this.opTrajectory = [];
        this.myMovements = [];
        this.opMovements = [];
    }


    resetGrids() {
        let grids = {}
        for (let location = 0; location < this.GRID_NUM; location++) {
            grids[location] = {
                x: null,
                y: null,
                color: null,
            }
        }
        this.grids = grids;
        this.resetGridCoordinates();
        this.resetGridColors();
    }

    resetGridCoordinates() {
        const DPR = window.devicePixelRatio || 1;
        const centerX = canvas.width / 2 / DPR;
        const centerY = canvas.height / 2 / DPR;
        
        // Calculate total grid area offset to center it
        const totalWidth = this.GRID_ROW * (this.GRID_SIZE + this.GRID_GAP) - this.GRID_GAP;
        const totalHeight = this.GRID_ROW * (this.GRID_SIZE + this.GRID_GAP) - this.GRID_GAP;
        const offsetX = centerX - totalWidth / 2;
        const offsetY = centerY - totalHeight / 2;
        
        Object.keys(this.grids).forEach(location => {
            const c = location % this.GRID_ROW;
            const r = Math.floor(location / this.GRID_ROW);
            this.grids[location].x = c * (this.GRID_SIZE + this.GRID_GAP) + offsetX;
            this.grids[location].y = r * (this.GRID_SIZE + this.GRID_GAP) + offsetY;
        });
    }

    resetGridColors() {
        Object.keys(this.grids).forEach(location => {
            this.grids[location].color = 'white';
        });
    }


    setRole(myRoleID) {
        this.myRoleID = myRoleID;
        this.myRoleIndex = parseInt(myRoleID.slice(-1));
        this.myColor = roleColors[myRoleID];
        this.opRoleID = myRoleID === 'player0' ? 'player1' : 'player0';
        this.opRoleIndex = parseInt(this.opRoleID.slice(-1));
        this.opColor = roleColors[this.opRoleID];
    }


    updateGoalLocations(newGoalLocations) {
        this.goalLocations = newGoalLocations;
    }


    updatePlayerLocations(newPlayerLocations) {
        this.PlayerLocations = newPlayerLocations;
        this.myLocation = this.PlayerLocations[this.myRoleIndex];
        this.opLocation = this.PlayerLocations[this.opRoleIndex];
        this.currentLocation = this.myLocation;
        this.myTrajectory = [String(this.myLocation)];
        this.opTrajectory = [String(this.opLocation)];
        this.grids[this.myLocation].color = this.setColorTransparency(this.myColor, 1 / (this.HORIZON+1));
    }



    setColorTransparency(hexColor, transparency) {
        const rgbaColor = `rgba(${parseInt(hexColor.slice(1, 3), 16)}, ${parseInt(hexColor.slice(3, 5), 16)}, ${parseInt(hexColor.slice(5, 7), 16)}, ${transparency})`;
        return rgbaColor;
    }

    isAdjacent(current, target) {
        const rowDiff = Math.abs(Math.floor(current / this.GRID_ROW) - Math.floor(target / this.GRID_ROW));
        const colDiff = Math.abs((current % this.GRID_ROW) - (target % this.GRID_ROW));
        // Only 4 cardinal directions: rowDiff + colDiff must equal 1
        return (rowDiff + colDiff === 1);
    };
    
    
    checkMovement(current, target) {
        current = Number(current);
        target = Number(target);
        
        if (!Number.isFinite(current) || !Number.isFinite(target)) return 'wait';
        if (current === target) return 'wait';
        
        const cr = Math.floor(current / this.GRID_ROW), cc = current % this.GRID_ROW;
        const tr = Math.floor(target / this.GRID_ROW), tc = target % this.GRID_ROW;
        
        if (tr < cr) return 'up';
        if (tr > cr) return 'down';
        if (tc < cc) return 'left';
        if (tc > cc) return 'right';
        
        return 'wait';
    };


    handleHover(hoveredLocation) {
        this.hoveredLocation = hoveredLocation;
    }


    handleClick(clickedLocation) {
        this.clickedLocation = clickedLocation;
        if (this.currentStage !== "planning") {return;}
        if (this.clickedLocation === null) {return;}
        if (this.myTrajectory.length <= this.HORIZON && this.isAdjacent(this.currentLocation, this.clickedLocation)) {
            this.myTrajectory.push(this.clickedLocation);
            const currentStep = this.myTrajectory.length;
            this.grids[this.clickedLocation].color = this.setColorTransparency(this.myColor, currentStep / (this.HORIZON+1));

            const movement = this.checkMovement(this.currentLocation, this.clickedLocation);
            this.myMovements.push(movement);

            this.currentLocation = this.clickedLocation;
        }
    }


    drawGrids() {
        Object.entries(this.grids).forEach(([index, grid]) => {
            let gridColor = grid.color;
            if (this.currentStage === "planning" && this.hoveredLocation !== null && this.myTrajectory.length <= this.HORIZON && index === this.hoveredLocation) {
                const futureStep = this.myTrajectory.length + 1;
                if (this.isAdjacent(this.currentLocation, this.hoveredLocation)) {
                    gridColor = this.setColorTransparency(this.myColor, futureStep / (this.HORIZON+1));
                } 
            }
            ctx.fillStyle = gridColor;
            ctx.fillRect(grid.x, grid.y, this.GRID_SIZE, this.GRID_SIZE);
            
            let strokeWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(grid.x, grid.y, this.GRID_SIZE, this.GRID_SIZE);
        });
    }



    drawGoals() {  
        this.goalLocations.forEach((goalLocation, goalIndex) => {
            const grid = this.grids[goalLocation];
            // if (!grid) return;
            const image = goalImages[`goal${goalIndex}`];
            // if (!image) return;
            const drawSize = this.GRID_SIZE / 2;
            const drawX = grid.x + drawSize / 2;
            const drawY = grid.y + drawSize / 2;
            ctx.drawImage(image, drawX, drawY, drawSize, drawSize); 
        });
    }


    drawPlayer(roleID) {
        const roleIndex = parseInt(roleID.slice(-1));
        const image = playerImages[roleID];
        if (!image) return;
        const playerLocation = roleID === this.myRoleID ? this.myLocation : this.opLocation;
        const grid = this.grids[playerLocation];

        const drawSize = this.GRID_SIZE / 2;
        const drawX = grid.x + drawSize * roleIndex;
        const drawY = grid.y + drawSize * roleIndex;
        ctx.drawImage(image, drawX, drawY, drawSize, drawSize);
    }


    drawTrial() {
        const DPR = window.devicePixelRatio || 1;
        const centerX = canvas.width / 2 / DPR;
        const centerY = canvas.height / 2 / DPR;
        // Draw text centered
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Trial ${this.trial}`, centerX, centerY - (this.GRID_SIZE + this.GRID_GAP) * 2);
    }


    drawAll() {
        this.drawGrids();
        this.drawGoals();
        this.drawPlayer(this.myRoleID);
        this.drawPlayer(this.opRoleID);
        this.drawTrial();
    }


}