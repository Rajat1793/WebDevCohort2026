// console.log(brewPotion("healing Herbs", 3));
function brewPotion(ingredient, quantity) {
    return `Brewing ${quantity} units of ${ingredient} potion.`;
}

const mixElixer = function(ingredient) {
    return `Mixing ${ingredient} elixir.`;
}
// console.log(mixElixer("Mana Dust", 5));

// no own 'this' no 'arguments' object
const distilessence = (ingredient) => {
    return `Distilling ${ingredient} distillessence.`;
}
// console.log(distilessence("Essence of Night", 2));

function oldBrewingMethod() {
    console.log("type: ", typeof arguments);
    console.log("Is Array: ",Array.isArray(arguments));
    const argsArray = Array.from(arguments);
    console.log(arguments);
    console.log("Arguments as Array: ", argsArray);
}
oldBrewingMethod("Sage", "Rosemary", "Thyme");

const arrowBrew = () => {
    try {
        console.log(arguments);
    } 
    catch (error) {
        console.log("Error accessing arguments in arrow function:", error.message);
    }
    console.log(arguments);
}
arrowBrew()
console.log("Program Continued");


let globalCount = 0;
function brewAndCount(name) {
    globalCount++;
}

// IIFE - Immediately Invoked Function Expression
