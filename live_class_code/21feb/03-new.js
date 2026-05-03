function TataCar(chassis, modelName) {
    // Step 1: empty object { }
    // Step 2: set 'this' to point to the new object
    // Step 3: execute the constructor function body
    // Step 4: explicitly return the new object 
    this.chassis = chassis;
    this.modelName = modelName;
    this.fuelType = 100;
}

TataCar.prototype.status = function() {
    return `The ${this.modelName} with chassis number ${this.chassis} has fuel level at ${this.fuelType}.`;
}

const tataNexon = new TataCar("TN1234", "Nexon");
console.log(tataNexon.status());

const tataHarrier = new TataCar("TH5678", "Harrier");
console.log(tataHarrier.status());


// This is not same as above
// Each instance will have its own copy of the CreateAuto method
// Also called as factory function pattern

function CreateAuto(id, route){
    return {
        id, 
        route,
        run(){
            return `Auto with id ${this.id} is running on route ${this.route}`;
        }
    }
}

const auto1 = CreateAuto("A123", "Route 1");
console.log(auto1.run());

const auto2 = CreateAuto("A456", "Route 2");
console.log(auto2.run());