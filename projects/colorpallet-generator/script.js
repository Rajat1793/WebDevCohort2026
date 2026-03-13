const formatSelect = document.getElementById('format');
const toneSelect = document.getElementById('tone');
const generateBtn = document.getElementById('generate');
const pallet = document.getElementById('pallet');
function randomRGB(tone) {
    let min = 0;
    let max = 255;
    
    if (tone === 'light') {
        min = 128; // Light colors have higher RGB values
    } else if (tone === 'dark') {
        max = 128; // Dark colors have lower RGB values
    }
    const r = Math.floor(Math.random() * (max - min + 1)) + min;
    const g = Math.floor(Math.random() * (max - min + 1)) + min;
    const b = Math.floor(Math.random() * (max - min + 1)) + min;
    // console.log(`r: ${r}, g: ${g}, b: ${b}`);
    return `rgb(${r}, ${g}, ${b})`;
}

function randomHEX(tone) {
    let min = 0;
    let max = 255;
    
    if (tone === 'light') {
        min = 128; // Light colors have higher RGB values
    } else if (tone === 'dark') {
        max = 128; // Dark colors have lower RGB values
    }
    const r = Math.floor(Math.random() * (max - min + 1)) + min;
    const g = Math.floor(Math.random() * (max - min + 1)) + min;
    const b = Math.floor(Math.random() * (max - min + 1)) + min;
    // console.log(`r: ${r}, g: ${g}, b: ${b}`);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function generatePallet(){
    pallet.innerHTML = '';
    for(let i=0; i<5; i++){
        const {r, g, b} = randomRGB(toneSelect.value);
        let color;
        if(formatSelect.value === 'hex'){
            color = randomHEX(toneSelect.value);
        } else {
            color = `rgb(${r}, ${g}, ${b})`;
        }
        const div = document.createElement('div');
        div.classList.add('color');
        div.style.backgroundColor = color;
        pallet.appendChild(div);
    }
}

function generateColorPalette(format, tone) {
    // console.log(formatSelect.value, toneSelect.value);
    if (formatSelect.value === 'hex') {
        // console.log(`Generating ${toneSelect.value} color palette in HEX format...`);
        const hex = randomHEX(tone);
        document.body.style.backgroundColor = hex;
        document.body.style.color = 'white';

        // Todo: Implement color palette generation logic here
    } else if (formatSelect.value === 'rgb') {
        // console.log(`Generating ${toneSelect.value} color palette in RGB format...`);
        // Todo: Implement color palette generation logic here
        const rgb = randomRGB(tone);
        document.body.style.backgroundColor = rgb;
        document.body.style.color = 'black';
    }
}
generateBtn.addEventListener('click', () => {
    generateColorPalette(formatSelect.value, toneSelect.value);
});
generateColorPalette()