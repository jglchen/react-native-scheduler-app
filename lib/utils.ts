import * as Localization from 'expo-localization';

export const timezone: string = Localization.timezone;

export function getDateString(dateObj: Date){
    return `${dateObj.toLocaleDateString('en-US')} ${dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;
}
