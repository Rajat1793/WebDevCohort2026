// function init() {
//     let name = "rajat";
//     function displayName() {
//         console.log(name);
//     }
//     displayName();
// }
// init();

// function makeFunc() {
//     const name = "rajat";
//     function displayName() {
//         console.log(name);
//     }
//     return displayName;
// }
// let myFunc = makeFunc();
// myFunc();


// [[SCOPE]] -> closure are scope which we cannot touch directly

function startCompany(){
    function ca(name){
        return `Name of the company is ${name}`;
    }
    return ca;
}
const getCompany = startCompany(); // reference of startcompany will be stored which will hold reference of ca function

console.log(getCompany("Google")); // since getCompany as access to CA function so we can pass the argument

function eternal(guest){
    const guestName = guest
    let count = 0

    function zomato(){
        console.log(`Hi ${guestName}, from Zomato`);
    }
    function blinkit() {
        if (count == 1) return 
        console.log(`Hi ${guestName}, from blinkit`);
        count ++
    }
    return {
        zomato, blinkit
    }
}
const rajat = eternal('rajat')
const jaiswal = eternal("jaiswal")
rajat.blinkit()
rajat.blinkit()
rajat.blinkit()
jaiswal.blinkit()
jaiswal.blinkit()
