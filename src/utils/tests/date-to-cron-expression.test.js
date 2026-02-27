const moment = require('moment-timezone');

// Mock the config module
jest.mock('../config', () => ({
  SCHEDULE_MESSAGES: {
    timeZone: 'America/Bogota', // Default bot timezone (Colombia)
  },
}));

const dateToCronExpression = require('../date-to-cron-expression');

describe('dateToCronExpression', () => {
  test('should convert date to cron expression with default timezone', () => {
    const dateString = '2025-03-15T10:30:00.000Z';
    const result = dateToCronExpression(dateString);
    
    // The result should be in the default timezone (America/Bogota)
    const expected = moment.tz(dateString, 'America/Bogota');
    expect(result).toBe(`${expected.minutes()} ${expected.hours()} ${expected.date()} ${expected.month() + 1} *`);
  });

  test('should convert date to cron expression with event timezone (Argentina)', () => {
    const dateString = '2025-03-15T13:00:00.000Z'; // 1pm UTC
    const eventTimeZone = 'America/Argentina/Buenos_Aires';
    
    const result = dateToCronExpression(dateString, eventTimeZone);
    
    // Should convert to Argentina timezone
    const expected = moment.tz(dateString, eventTimeZone);
    expect(result).toBe(`${expected.minutes()} ${expected.hours()} ${expected.date()} ${expected.month() + 1} *`);
    
    // Argentina is UTC-3, so 13:00 UTC = 10:00 Argentina
    expect(result).toContain('10 15'); // 10 is hours, 15 is day (minutes would be 0)
  });

  test('should handle timezone difference correctly', () => {
    // Create an event at 1pm Argentina time
    const argentinaTime = moment.tz('2025-03-15T13:00:00', 'America/Argentina/Buenos_Aires');
    const isoString = argentinaTime.toISOString();
    
    // When converted to Colombia time (UTC-5), it should be 11am same day
    const result = dateToCronExpression(isoString, 'America/Argentina/Buenos_Aires');
    
    // Parse the cron expression
    const [minutes, hours, day, month] = result.split(' ').map(Number);
    
    // Should be 1pm Argentina time = 13:00
    expect(hours).toBe(13);
    expect(minutes).toBe(0);
    expect(day).toBe(15);
    expect(month).toBe(3);
  });

  test('should handle minute subtraction correctly', () => {
    const dateString = '2025-03-15T10:30:00.000Z';
    const eventTimeZone = 'America/Bogota';
    
    const result = dateToCronExpression(dateString, eventTimeZone);
    
    // Parse the cron expression
    const [minutes, hours] = result.split(' ').map(Number);
    
    // Bogota is UTC-5, 10:30 UTC = 5:30 Bogota
    expect(hours).toBe(5);
    expect(minutes).toBe(30);
  });
});
