const artifacts = {
    name: "Ancient Vase",
    origin: "Greece",
    age: 2000,
    material: "Clay",
}

const keys = Object.keys(artifacts);
console.log(keys);

const values = Object.values(artifacts);
console.log(values);

const entries = Object.entries(artifacts);
console.log(entries);

// we mostly use for of loop to iterate over arrays, but we can also use it to iterate over objects using Object.entries()

// Created array of arrays from object
for(const [key, value] of Object.entries(artifacts)) {
    console.log(`${key}: ${value}`);
}

const priceList = [
    ["Ancient Vase", 1000],
    ["Old Coin", 500],
    ["Ancient Statue", 2000],
]
// we can also convert array of arrays to object using Object.fromEntries()
const priceObject = Object.fromEntries(priceList);
console.log(priceObject);

const displayCase = {
    artifacts: "Obsidian Dagger",
    location: "Museum of Natural History",
    locked: true,
}

Object.freeze(displayCase)
delete displayCase.location; // this will not work because the object is frozen
displayCase.locked = false; // this will not work because the object is frozen
displayCase.newProp = "test"
console.log(displayCase);

const catalog = {
    id: "Art-01",
    description: "A collection of ancient artifacts",
    verified: true
}

Object.seal(catalog);
delete catalog.verified; // this will not work because the object is sealed
catalog.description = "A collection of ancient artifacts from around the world"; // this will work because we can modify existing properties in a sealed object
catalog.verified = false; // this will work because we can modify existing properties in a sealed object
catalog.newProp = "test" // this will not work because we cannot add new properties to a sealed object
console.log(catalog);

const secureArtificts = { name: "Golden Mask" }
Object.defineProperty(secureArtificts, "catalogNumber", {
    value: "GM-001",
    writable: true,
    enumerable: true,
    configurable: false,
})
console.log(secureArtificts.catalogNumber);
secureArtificts.catalogNumber = "GM-002"; // this will not work because writable is false
console.log(secureArtificts.catalogNumber);

for (const [key, value] of Object.entries(secureArtificts)) {
    console.log(`${key}: ${value}`);
}

const desc = Object.getOwnPropertyDescriptor(secureArtificts, "catalogNumber");
console.log(desc);

// loop key points
// 1. for loop is most optimized for arrays
// 2. while loop based on condition
// 3. do-while loop will execute at least once
// 4. for-in loop is used to iterate over object properties
// 5. for-of loop is used to iterate over iterable objects like arrays, strings, maps, sets, etc.
// 6. map, forEach, filter, reduce are array methods that can be used to iterate over arrays and perform operations on them
