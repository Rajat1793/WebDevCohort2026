const prithviraj ={
    name: "Prithviraj",
    generation: "grandfather",
    cookTradition(){
        return `${this.name} is cooking traditional dishes.`;
    }
}

const raj = Object.create(prithviraj);
// console.log(raj.name);

raj.name = "Raj";
raj.generation = "father";
raj.runBusiness = function() {
    return `${this.name} is running the family business.`;
}

console.log(raj);
console.log(raj.cookTradition());
console.log(raj.runBusiness());

const ranbir = Object.create(raj);
ranbir.name = "Ranbir";
ranbir.generation = "son";
ranbir.actInMovies = function() {
    return `${this.name} is acting in movies.`;
}

console.log(ranbir);
console.log(ranbir.cookTradition());
console.log(ranbir.runBusiness());
console.log(ranbir.actInMovies());

Array.prototype.last = function() {
    return this[this.length - 1];
}
console.log([1,2,3,4].last());

Array.prototype.mapTo = function(){
    return this.map((item) => item * 2);
}
console.log([1,2,3,4].mapTo());

