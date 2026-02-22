// console.log(this);

function myFunc() {
    return typeof this;
}

console.log(myFunc());

function myFunc2() {
    return this;
}

console.log(myFunc2());

const myObj = {
    name: 'My Object',
    lead: "Rajat",
    introduce(){
        return `Hi, I am ${this.name} and my lead is ${this.lead}`;
    }
};
console.log(myObj.introduce());

const filmDirector = {
    name: 'Christopher Nolan',
    movies: ['Inception', 'Interstellar', 'Dunkirk'],
    announceMovie(movie) {
        this.movies.forEach((actor) => {
            console.log(`${actor} is in ${movie} directed by ${this.name}`);
        });
    }
}

filmDirector.announceMovie()

const filmSet = {
    crew: "Spot Boys",
    prepareProps(){
        console.log(`outer this.crew: ${this.crew}`);

        function arrangeChairs() {
            console.log(`inner this.crew: ${this.crew}`);
        }
    arrangeChairs()
    const arrangeLights = () => {
        console.log(`arrow this.crew: ${this.crew}`);
    }
    arrangeLights()
}
}

filmSet.prepareProps()

// Detched mode
const actor = {
    name: 'Leonardo DiCaprio',
    introduce() {
        console.log(`${this.name} takes a bow!`);
    }
};

// This will not work as expected because 'this' is not bound to the actor object. 
const introduceFunc = actor.introduce;
console.log(introduceFunc());
