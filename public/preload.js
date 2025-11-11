const player1Image = new Image(); player1Image.src = '/src/player1.png';
const player0Image = new Image(); player0Image.src = '/src/player0.png';

const goal0Image = new Image(); goal0Image.src = '/src/goal0.png';
const goal1Image = new Image(); goal1Image.src = '/src/goal1.png';

const playerImages = {
    'player0': player0Image,
    'player1': player1Image
};

const goalImages = {
    'goal0': goal0Image,
    'goal1': goal1Image
};

// Ensure all images are loaded (both player and movement images)
let imagesLoaded = false;
const allImages = [
    ...Object.values(playerImages),
    ...Object.values(goalImages)
];
allImages.forEach(img => {
    img.onload = () => {
        imagesLoaded = allImages.every(i => i.complete);
    };
});