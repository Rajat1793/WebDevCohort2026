const playerHeath = 40;
const hasShield = true;
const hasSward = false;

if (playerHeath > 50) {
    console.log('Player is healthy');
} else if (playerHeath > 20 && hasShield) {
    console.log('Player is injured');
} else {
    console.log('Player is critical');
}

const isLoggedIn = true;
const hasPremiumAccount = false;

if (isLoggedIn && hasPremiumAccount) {
    console.log('Access to premium content granted');
} else if (isLoggedIn) {
    console.log('Access to basic content granted');
} else {
    console.log('Please log in to access content');
}

const chosenPath = "right";

switch (chosenPath) {
    case "left":
        console.log("You encounter a friendly merchant.");
        break;
    case "right":
        console.log("You face a fierce dragon.");
        break;
    case "straight":
        console.log("You find a hidden treasure.");
        break;
    default:
        console.log("Invalid path chosen.");
}