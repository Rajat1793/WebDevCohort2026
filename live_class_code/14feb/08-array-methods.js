const kitchenOrders = [
    {dish: "Pizza", price: 10, spicy: false, qty: 2},
    {dish: "Pasta", price: 8, spicy: true, qty: 1},
    {dish: "Burger", price: 5, spicy: false, qty: 3},
    {dish: "Taco", price: 6, spicy: true, qty: 2},
]

const mildReport = kitchenOrders
    .filter(order => !order.spicy)
    .map(order => ({
        dish: order.dish,
        total: order.price * order.qty
    }))
    .toSorted()
    console.log(mildReport);