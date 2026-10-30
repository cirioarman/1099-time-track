export function billableHours(hours:number){if(!Number.isFinite(hours)||hours<0)throw Error('Invalid hours');return Math.ceil(hours*4)/4;}
export function durationHours(start:Date,end:Date){const hours=(end.getTime()-start.getTime())/3600000;if(!Number.isFinite(hours)||hours<=0||hours>24)throw Error('Duration must be between 0 and 24 hours');return hours;}
export function money(value:number){return Math.round((value+Number.EPSILON)*100)/100;}
