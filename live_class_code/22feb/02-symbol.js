const aadhar_rajat = Symbol("aadhar_number");
const aadhar_ram = Symbol("aadhar_number");

console.log(typeof aadhar_rajat);
console.log(aadhar_rajat === aadhar_ram); //False, as they are unique

console.log(aadhar_rajat.toString());  //Symbol(aadhar_number)
console.log(aadhar_rajat.description); //Display label

const nonIndian = Symbol();
console.log(nonIndian.description); //undefined, as we have not provided any description

const biometricHash = Symbol("biometric_hash");
const bloodgroup = Symbol("blood_group");

const record = {
    name: "Rajat",
    age: 30,
    [biometricHash]: "abc123",
    [bloodgroup]: "A+"
}

console.log(Object.keys(record)); 
console.log(Object.getOwnPropertyNames(record));
console.log(Object.getOwnPropertySymbols(record));

const rtiQueryBook = {
    queries: ["Infra budget", "Education budget", "Healthcare budget"],
    [Symbol.iterator] () {
        let index = 0;
        const queries = this.queries;
        return {
            next() {
                if (index < queries.length) {
                    return { value: queries[index++], done: false };
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
    }
}

for (const query of rtiQueryBook.queries) {
    console.log(query);
}

// This will throw an error as rtiQueryBook is not iterable, we need to make it iterable by adding a Symbol.iterator method to it
for (const query of rtiQueryBook) {
    console.log(query);
}

const governmentRecords = {
    name: "PM Kisan Yojna",
    people: 50,
    [Symbol.toPrimitive](hint) {
        if (hint === "string") {
            return this.name;
        } else if (hint === "number") {
            return this.people;
        } else {
            return null;
        }
    }
}
console.log();