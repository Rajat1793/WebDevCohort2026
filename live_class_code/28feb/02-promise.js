console.log("Rajat");
Promise.resolve("Resolved value").then(
    (value) =>{
        console.log("Microtask");
    }
)
console.log("Ram");

// Higest priority is given to the synchronous code, then to the microtasks, and then to the macrotasks.

function boildwater(ms) {
    return new Promise((res, rej) => {
        console.log("karte hai water boil");
        if (typeof ms !== "number" || ms < 0) {
            rej(new Error("Invalid input"));
        }
        setTimeout(() => {
            res("Ubal gaya")
        }, ms)
    })
}
boildwater(290)
    .then((msg) => console.log("Resolved: ", msg))
    .catch(() => console.log("Rejected: ", err.message))

function grindLeaves(){
    return Promise.resolve("leaves grounded")
}

function steepTea(time){
    return new Promise((res) =>{
        setTimeout(() => res("Steeped tea"), time)
    })
}

function addSugar(spoon){
    return `Added ${spoon} sugar`
}

grindLeaves().then(val)