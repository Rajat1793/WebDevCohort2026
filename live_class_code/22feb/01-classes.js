class Cricketer {
    constructor(name, role) {
        this.name = name;
        this.role = role;
        this.matchesPlayed = 0;
        this.stamina = 100;
    }
    introduce() {
        return `Hi, I am ${this.name} and I am a ${this.role}| matches played: ${this.matchesPlayed} | stamina: ${this.stamina}`;
    }
}

const player1 = new Cricketer("Virat Kohli", "Batsman");
console.log(player1.introduce());
console.log(player1.hasOwnProperty("name"));
console.log(typeof Cricketer);

// Detached mode as we have arrow function
class Debutant {
    constructor(name) {
        this.name = name;
        this.walkOut = () => {
            return `Hi, I am ${this.name} and I am walking out to the field for my debut match.`;
        }
    }
}

const debutant1 = new Debutant("Rohit Sharma");
const somethingFromLastClass = debutant1.walkOut;

const debutant2 = new Debutant("KL Rahul");
console.log(debutant1.walkOut === debutant2.walkOut);

console.log(somethingFromLastClass());