function prepareOrderCB(dish, cb){
    setInterval(() => cb(null, {dish, status: "prepared"}),100);
}
function pickupOrderCB(order, cb){
    setInterval(() => cb(null, {...order, status: "picked up"}),100);
}
function deliverCB(order, cb){
    setInterval(() => cb(null, {...order, status: "delivered"}),100);
}

// old way of doing things with callbacks
prepareOrderCB("pizza", (err, order) => {
    if (err) return console.log(err);
    pickupOrderCB(order, (err, order) => {
        if (err) return console.log(err);
        deliverCB(order, (err, order) => {
            if (err) return console.log(err);
            console.log(`${order.dish}: ${order.status}`);
        })
    })
})

// Promises, fulfill or reject
function prepareOrder(dish){
    return new Promise((resolve, reject) =>{
        setTimeout(() => {
            if(!dish) return reject(new Error("No dish provided"));
            console.log(`${dish} is prepared`);
            resolve({dish, status: "prepared"});
        }, 100);
    })
}
function pickupOrder(order){
    return new Promise((resolve, reject) =>{
        setTimeout(() => {
            if(!order) return reject(new Error("No order provided"));
            console.log(`${order.dish} is picked up`);
            resolve({...order, status: "picked up"});
        }, 100);
    })
}
function deliverOrder(order){
    return new Promise((resolve, reject) =>{
        setTimeout(() => {
            if(!order) return reject(new Error("No order provided"));
            console.log(`${order.dish} is delivered`);
            resolve({...order, status: "delivered"});
        }, 100);
    })
}

prepareOrder("pizza")
    .then(order => pickupOrder(order))
    .then(order => deliverOrder(order))
    .catch(err => console.log(err));