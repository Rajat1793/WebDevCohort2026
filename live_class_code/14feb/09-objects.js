const ranger = {
    name: "Rajat",
    agility: 80,
    stealth: undefined,
}

console.log("name" in ranger);
console.log("stealth" in ranger);
console.log("toString" in ranger);

console.log(ranger.hasOwnProperty);