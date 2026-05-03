const carriage1 = ['John', 'Jane', 'Jack'];
const emptyCarriage = [];

const threeEmptyCarriages = Array(3)

console.log(threeEmptyCarriages);
console.log(threeEmptyCarriages.length);

const passenger = Array("Ram", "Shyam", "Hari");

const singlePassenger = Array.of(3)
console.log(singlePassenger);

const trainCode = Array.from("TRAIN123"); // it will split the string into individual characters and create an array    
console.log(trainCode);

const tempTrain = ["A", "B", "C", "D", "E"];
tempTrain.length = 3; // it will truncate the array to the specified length
console.log(tempTrain); // Output: ["A", "B", "C"]
tempTrain.length = 5; // it will add empty slots to the array
console.log(tempTrain); // Output: ["A", "B", "C", <2 empty items>]

// push pop shift unshift splice (all these mutate the original array means they change the original array and return the modified array)

// concat slice flat (all these do not mutate the original array means they do not change the original array and return a new array)

const trainCopy = passenger.slice(); // it will create a shallow copy of the array
console.log(trainCopy);

// Searching: indexOf includes, find, findIndex, filter (all these do not mutate the original array)

console.log(typeof []);
console.log(Array.isArray([]));
console.log(Array.isArray("Ram"));

// Key points to remember:
// 1. [] Array(4)
// 2. Array are 0 based indexed
// 3. Mutating methods: pushg, pop,. shift, unshift, splice
// 4. Non mutating methods: concat, slice, flat
// 5. Searching methods: indexOf, includes, find, findIndex, filter

const orders = [
    {dish: "Pizza", price: 10, spicy: false, qty: 2},
    {dish: "Pasta", price: 8, spicy: true, qty: 1},
    {dish: "Burger", price: 5, spicy: false, qty: 3},
    {dish: "Taco", price: 6, spicy: true, qty: 2},
]
const myData =orders.forEach((order, index) =>{
    console.log(` #${index +1}: ${order.qty} x ${order.dish} - $${order.price}`);
})
// console.log(myData);

const recepitLines = orders.map(o => `${o.qty} x ${o.dish} - $${o.price}`)
console.log(recepitLines);

const spicyOrders = orders.filter(o => o.spicy);
console.log(spicyOrders);

// {} i need to return explicitely
// () no need to return anything explicitely

const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.price * order.qty);
}, 0);
console.log(totalRevenue);

// const acc  = {spicy: [], mild: []}

const grouped = orders.reduce((acc, order) => {
    const category = order.spicy ? "spicy" : "mild";
    acc[category].push(order.dish);
    return acc;
}, {spicy: [], mild: []});
console.log(grouped);

const ticketNumbers = [105, 110, 131, 101, 145];
// sort is operated on top of string
const sortedTickets = [...ticketNumbers].sort((a, b) => b - a)
console.log(sortedTickets);

