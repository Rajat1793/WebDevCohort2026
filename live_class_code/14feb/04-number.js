const crewMember = 40
const fuelTons = 133.45
const light_speed = 186000

const infiniteRange  = Infinity
const negativeInfiniteRange = -Infinity

const notANumber = NaN

console.log(crewMember)
console.log(fuelTons)
console.log(light_speed)

console.log(infiniteRange)
console.log(negativeInfiniteRange)
console.log(notANumber)

console.log(1/0);
console.log(-1/0);

console.log(Number.MAX_SAFE_INTEGER);
console.log(Number.MIN_SAFE_INTEGER);
console.log(Number.EPSILON);
console.log(Number.isNaN(notANumber));

const fuelReading = "1430.75 tons"
const sectorCode = "0xA3"
const countDown = "009"

console.log(parseInt(countDown));
console.log(parseFloat(fuelReading));

const thrustForce = 45.545
console.log(Math.round(thrustForce));
console.log(Math.floor(thrustForce));
console.log(Math.ceil(thrustForce));
console.log(Math.trunc(thrustForce));

const temps = [-23.5, 19.8, -30.2, 5.6]
console.log(Math.max(...temps));
console.log(Math.min(temps));

console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);

function areEqual(num1, num2) {
    return Math.abs(num1 - num2) < Number.EPSILON;
}

console.log(areEqual(0.1 + 0.2, 0.3));