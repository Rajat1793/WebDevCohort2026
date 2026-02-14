// Primitives 
// NonPrimitives

const weaponName = "Knife"
console.log("Weapon: ", weaponName, "| Type: ", typeof weaponName);

const attackPower = 50n; // BigInt
const attackUpgrade = 1.5

console.log(typeof attackPower);
console.log(typeof attackUpgrade);

const isLethal = true;
let bonusDamage;
let curseStatus = null;

let weatherApiResponse = null;
console.log(weatherApiResponse); //null datatype is object

// RuneID

const uniqueRuneID = Symbol("rune123");
const anotherRuneID = Symbol("rune123");

console.log(uniqueRuneID === anotherRuneID); // false, symbols are unique even with same description
console.log("Rune: ",uniqueRuneID.toString()); // best practice to always convert symbol to string before logging
console.log("Another Rune: ",anotherRuneID.toString());

console.log(
    "Rune: ", uniqueRuneID.toString(), "|type of ", typeof uniqueRuneID
);

const heroStats = {
    name: "Aria",
    level: 5,
    health: 100,
}
console.log("Hero: ", heroStats, "| Type: ", typeof heroStats);

const inventory = ["Sword", "Shield", "Potion"];
console.log("Inventory: ", inventory, "| Type: ", typeof inventory);

function castSpell() { return "Fireball!"; }
console.log("Spell Cast: ", castSpell(), "| Type: ", typeof castSpell);

console.log(typeof "hello");
console.log(typeof 42);
console.log(typeof true);
console.log(typeof undefined);
console.log(typeof null);
console.log(typeof Symbol());
console.log(typeof BigInt(9007199254740991));
console.log(typeof {});
console.log(typeof []);
console.log(typeof function(){});

let originalXP = 100;
let currentXP = originalXP;
console.log("Original XP: ", originalXP, "| Current XP: ", currentXP);

currentXP += 50;
console.log("After Gaining XP: ", currentXP);

const originalSward = {
    name: "Excalibur",
    damage: 100,
    durability: 80
}

const cloneSward = originalSward; // This creates a reference, not a copy
cloneSward.damage = 120; // Modifying cloneSward also modifies originalSward
console.log("Original Sword: ", originalSward);
console.log("Clone Sword: ", cloneSward);

const armorOriginal = {
    name: "Dragon Scale Armor",
    defense: 150,
    durability: {
        head: 80,
        chest: 100,
        legs: 70
    }
}

console.log("Original Armor: ", armorOriginal);
const armorClone = {...armorOriginal}; // Shallow copy using spread operator
armorClone.durability.head = 60; // Modifying nested object affects original
console.log("Original Armor: ", armorOriginal);
console.log("Cloned Armor: ", armorClone);

const potionOriginal = {
    name: "Health Potion",
    effect: "Restores 50 HP",
    ingredients: {Herb: "Herb", Water: "Water", MagicDust: "Magic Dust"}
}

const potionClone = structuredClone(potionOriginal); // Deep copy using structuredClone
potionClone.ingredients.Herb = "Rare Herb"; // Modifying nested object does not affect original
console.log("Original Potion: ", potionOriginal);
console.log("Cloned Potion: ", potionClone);

typeof null === "object" // this is a known quirk in JavaScript, null is considered an object type but it is actually a primitive value representing the absence of any object value.

