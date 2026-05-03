function bootNavigation(mapLoaded) {
    try{
        console.log(`Is Navigation Loaded: ${mapLoaded}`);
        if (!mapLoaded) {
            throw new Error("Navigation failed to load");
        }
        return "Navigation is ready to use";
    } catch (error) {
        console.log(error);
        console.error(`Error loading navigation: ${error.message}`);
    } finally {
        console.log("Boot process completed");
    }
}

const status1 = bootNavigation(false);
console.log(status1);