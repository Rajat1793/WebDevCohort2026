// call and apply => basic chef (kitchen analogy)
// bind => return a new function

function cookDish(ingredient, style){
    return `${this.name} is cooking ${ingredient} in ${style} style.`;
}

const sharmaKitchen = {
    name: 'Sharma Kitchen'
};
const guptaKitchen = {
    name: 'Gupta Kitchen'
};
// Using call
console.log(cookDish.call(sharmaKitchen, "paneer and spices", "muglai"));

const guptaOrder = ["chicken and herbs", "tandoori"]

// Using apply 
console.log(cookDish.apply(guptaKitchen, guptaOrder));

// Using bind
function reportdelivery(location, status){
    return `${this.name} at ${location} and the status is ${status}.`;
}

const deliveryPerson = {
    name: 'Ravi Kumar'
};

console.log("Call: ",reportdelivery.call(deliveryPerson, "Delhi", "On Time"));
console.log("Apply: ",reportdelivery.apply(deliveryPerson, ["UP", "picked up"]));
// console.log("Bind: ",reportdelivery.bind(deliveryPerson, "bangalore", "ordered"));

// 1st way
// const bindReport = reportdelivery.bind(deliveryPerson, "bangalore", "ordered");
// console.log("Bind Report: ", bindReport());

// 2nd way
// const bindReport = reportdelivery.bind(deliveryPerson, "bangalore");
// console.log("Bind Report with status: ", bindReport("delayed"));

// 3rd way
const bindReport = reportdelivery.bind(deliveryPerson);
console.log("Bind Report: ", bindReport("bangalore", "ordered"));