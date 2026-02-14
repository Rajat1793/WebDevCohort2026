const codeName = "Megnamite";
const backupName = String("Snowlax")
const templateName = `Pikachu ${codeName}` //String Interpolation

let intercepted = "Hello"
intercepted[0] = "h" //Strings are immutable in JavaScript, Silent fail
console.log(intercepted) 

const secretCode = "Omegal-7"
console.log(secretCode.length);
console.log(secretCode.charAt(4));
console.log(secretCode.at(-1));
console.log(secretCode.charAt(99)); //Returns empty string
console.log(secretCode[99]); //Returns undefined

const rawTransmission = "   ThE EaGle HaS LaNdEd   "
console.log(rawTransmission.toLowerCase());
console.log(rawTransmission.toUpperCase());
console.log(rawTransmission.trim());
console.log(rawTransmission.trimStart());
console.log(rawTransmission.trimEnd());

const message = "The drop point is at sector 7G Repeat, sector 7G"
console.log(message.includes("sector 7G"));
console.log(message.indexOf("Sector"));

const orders = "Order1, Order2, Order3"
orderList = orders.split(", ")
console.log(orderList);

console.log("SOS".split(""));

const missionNumber = '7'
console.log(missionNumber.padStart(5, "0"));
console.log(missionNumber.padEnd(5, "0"));

const spellCard = `
+++=======>
Spell Card: ${missionNumber}
=======+++>`
console.log(spellCard);

const profile = `${missionNumber ? "true-value" : "false-value"}`
console.log(profile);

// tagged template literal
 
console.log(void 0); //undefined
console.log(void "rajat"); //undefined void always evaluates to undefined irrespective of whats passed to it. 

const generalStore = {
    name: "General Store",
    items: 3
}
console.log(generalStore);
generalStore = null; //Error: Assignment to constant variable.
console.log(generalStore);