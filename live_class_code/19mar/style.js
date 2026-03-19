const btn = document.getElementById("btn")
// btn.onclick = function () {
//     alert("hello event")
// }

// btn.onclick = function () {
//     alert("Hello World 2")
// }

// We cannot use the onlick with different function on same tag as they will run latest function

btn.addEventListener(onclick, function(){
    console.log("Clicked - 1");
})

btn.addEventListener(onclick, function(){
    console.log("Clicked - 2");
})
// We cannot use multiple eventlistner on same id

// const parent = document.getElementById("parent")
// const child = document.getElementById("child")
// const body = document.body

// parent.addEventListener("click", function(){
//     console.log('Parent Clicked');
// }, true)

// child.addEventListener('click', function(){
//     console.log('Child Clicked');
// }, false)

// body.addEventListener('click', function(){
//     console.log('Body Clicked');
// }, true)


// const items = document.querySelectorAll('li')
// items.forEach((items) => {
//     items.addEventListener("click", () =>{
//         console.log(items.textContent);
//     })
// })

const list = document.getElementById("list")

list.addEventListener("click", (e)=>{
    if(e.target.tagName === 'LI'){
        console.log(e.target.textContent);
    }
})

// closest()
list.closest('click', (e) =>{
    if(e.target.tagName === 'LI'){
        console.log(e.target.textContent);
    }
})