// promise state
// pending, fulfilled, rejected

// promise is a class
// promise constructor takes a function as an argument
// the function takes two arguments, resolve and reject

// const promise = new Promise((res, rej) => {
//     // res("Promise is resolved");
//     setTimeout(() => {
//         // res("Promise is resolved");
//         rej("Promise is rejected");
//     }, 2000);
// })
// console.log(promise);

// setTimeout(() => {
//     console.log(promise);
// }, 3000);

// promise.then((value) => {
//     console.log(value);
// })

// .then can pass the value of promise to the next then, and if there is an error, it will be caught by the catch block
// promise.then(
//     (data) => {
//         const newdata = data.toUpperCase();
//         return newdata;
//     },
//     (err) => console.log(err)
// ).catch((err) => {
//     console.log(err);
// })

// promise.catch((err) => {
//     console.log(err);
// })

// promise
//     .then((data) => {
//         newdata = data.toUpperCase();
//         return newdata;
//     })
//     .then((data) => {
//         return data + ".com";
//     })
//     .then(console.log)
//     .catch((err) => {
//         console.log(err);
//         return "Chain is broken";
//     }) 
//     .then((data) => {
//         console.log(data);
//     })

// fetch returns a promise (reference)
// fetch creates a object
// object = {
//     state = pending | response | rejected,
//     thenArray[function]
//     catchArray[function]
// }

const turant = Promise.resolve("Turant is resolved");
console.log(turant);

const allPromise = Promise.allSettled([
    Promise.resolve("Promise 1 is resolved"),
    Promise.resolve("Promise 2 is resolved"),
    Promise.resolve("Promise 3 is resolved"),
    Promise.reject("Promise 4 is rejected"),
])

// allPromise.then(console.log)

const hPromise = new Promise((res, rej) => {
    setTimeout(() => {
        // res("Promise is resolved");
        rej(new Error ("Error is raised"))
    }, 2000);
})

async function nice(){
    try{
        const result = await hPromise
        console.log(result);
    }
    catch (error){
        console.log("Error aa gya ji", error.message);
    }
}
nice()

// we can use the await globally now
const newResult = await hPromise
console.log(newResult);