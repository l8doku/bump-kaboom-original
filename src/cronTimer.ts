

//  -- Private functions

function checkPositiveInteger(name: string, value: number) {
    if (value < 0) {
        throw `${name} must be a positive number`
    }
}



const updateAfterClock = (clock: Clock, dt: number) => {

    checkPositiveInteger('dt', dt)

    if (clock.running >= clock.time) {
        return true
    }
    
    clock.running = clock.running + dt
    
    if (clock.running >= clock.time) {
        clock.callback(...clock.args)
        return true
    }
    return false
}


const updateEveryClock = (clock: Clock, dt: number) => {

    checkPositiveInteger('dt', dt)

    clock.running = clock.running + dt

    while (clock.running >= clock.time) {
        clock.callback(...clock.args)
        clock.running = clock.running - clock.time
    }
    return false
}
  
class Clock {
    time :number;
    callback: Function;
    args: any[];
    running: number;
    update: (dt:number)=>boolean;

    constructor(time: number, callback: Function, update: (t:Clock, dt:number)=>boolean, ...args: any[]) {
        // checkPositiveInteger(time)
        // console.assert(isCallable(callback), "callback must be a function")

        this.time = time
        this.callback = callback
        this.args = args
        this.running = 0
        this.update = (dt) => {return update(this, dt)}
    }


    reset(running = 0) {
        checkPositiveInteger('running', running)
        this.running = running
    }

}

// type CronTimer = (time: number, callback: Function, ...args: any[]) => Clock;
  
export const cron = {
    after: (time: number, callback: Function, ...args: any[]) => {
        return new Clock(time, callback, updateAfterClock, ...args)
    },
    every: (time: number, callback: Function, ...args: any[]) => {
        return new Clock(time, callback, updateEveryClock, ...args)
    }
}
export type { Clock }