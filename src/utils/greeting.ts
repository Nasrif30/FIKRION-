export function getDynamicGreeting(includeStatus = false): string {
  const hour = new Date().getHours();
  let timePeriod = 'morning';
  if (hour >= 12 && hour < 17) timePeriod = 'afternoon';
  else if (hour >= 17 && hour < 21) timePeriod = 'evening';
  else if (hour >= 21 || hour < 5) timePeriod = 'night';

  const conditions = [
    { weather: 'Sunny', temp: 24, action: 'Shall I suggest an outdoor route for you today?' },
    { weather: 'Rainy', temp: 18, action: "I've moved your outdoor tasks indoors." },
    { weather: 'Stormy', temp: 16, action: "Please stay safe—I've postponed all outdoor commitments." },
    { weather: 'Snowy', temp: -2, action: "Shall I preheat your vehicle or adjust the thermostat?" },
    { weather: 'Windy', temp: 12, action: "I've secured your outdoor items. Be cautious." },
    { weather: 'Foggy', temp: 10, action: "Visibility is low—shall I check your commute?" },
    { weather: 'Cloudy', temp: 20, action: "A calm day ahead—perfect for focused work." },
    { weather: 'Clear', temp: 15, action: "Rest well—I'll monitor for any changes." },
  ];

  const c = timePeriod === 'night' ? conditions[7] : conditions[hour % 7];
  const conditionStr = c.weather === 'Clear' || c.weather === 'Sunny' ? `${c.weather.toLowerCase()} skies` : c.weather.toLowerCase();

  const greeting = `Good ${timePeriod === 'night' ? 'evening' : timePeriod}, sir.`;
  const weather = `It's ${c.temp}°C with ${conditionStr} outside.`;
  
  if (includeStatus) {
    return `${greeting} ${weather} ${c.action} System health is excellent. I am ready.`;
  }
  
  return `${greeting} ${weather} ${c.action} How may I assist you?`;
}
