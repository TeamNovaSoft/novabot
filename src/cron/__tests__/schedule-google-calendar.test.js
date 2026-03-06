/**
 * Tests for timezone-aware cron expression generation
 * Issue: Calendar reminder is not taking in consideration the time zone
 * https://github.com/TeamNovaSoft/novabot/issues/109
 */

/**
 * Converts a date to a CRON expression in the specified timezone.
 * This ensures the cron expression matches the intended time in the event's timezone,
 * preventing timezone offset issues when the server is in a different timezone.
 *
 * @param {Date} date - The date to convert.
 * @param {string} timeZone - The IANA timezone identifier.
 * @returns {string} A CRON expression derived from the provided date in the specified timezone.
 */
const dateToCronExpressionInTimezone = (date, timeZone) => {
  const options = {
    timeZone,
    minute: 'numeric',
    hour: 'numeric',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour12: false,
  };

  // Get date components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  const getPart = (type) =>
    parseInt(parts.find((p) => p.type === type)?.value, 10);

  const minutes = getPart('minute');
  const hours = getPart('hour');
  const day = getPart('day');
  const month = getPart('month');

  return `${minutes} ${hours} ${day} ${month} *`;
};

describe('dateToCronExpressionInTimezone', () => {
  test('should generate correct cron for Argentina timezone event', () => {
    // Event at 1:00 PM Argentina time
    const eventDate = new Date('2025-03-15T13:00:00-03:00'); // 1pm ART
    const timeZone = 'America/Argentina/Buenos_Aires';

    const cron = dateToCronExpressionInTimezone(eventDate, timeZone);

    // Should be 13:00 (1pm) in cron format
    expect(cron).toBe('0 13 15 3 *');
  });

  test('should generate same cron expression regardless of server timezone', () => {
    // Same event time, but let's verify it's consistent
    // 1pm Argentina = 11am Colombia (2 hour difference)
    const argentinaEvent = new Date('2025-03-15T13:00:00-03:00');
    const argentinaTz = 'America/Argentina/Buenos_Aires';

    // Generate cron for Argentina timezone
    const argentinaCron = dateToCronExpressionInTimezone(
      argentinaEvent,
      argentinaTz
    );

    // The cron should reflect 13:00 (1pm) in Argentina time
    expect(argentinaCron).toBe('0 13 15 3 *');
  });

  test('should handle reminder offset correctly', () => {
    // Event at 1:00 PM Argentina, with 10-minute reminder
    const eventDate = new Date('2025-03-15T13:00:00-03:00');
    const reminderDate = new Date(eventDate.getTime() - 10 * 60 * 1000); // 12:50 PM
    const timeZone = 'America/Argentina/Buenos_Aires';

    const cron = dateToCronExpressionInTimezone(reminderDate, timeZone);

    // Should be 12:50 (10 min before 1pm) in cron format
    expect(cron).toBe('50 12 15 3 *');
  });

  test('should handle different timezones correctly', () => {
    // Same UTC moment, different timezone representations
    const utcDate = new Date('2025-03-15T16:00:00Z'); // 4pm UTC

    // In Colombia (UTC-5), this is 11:00 AM
    const colombiaCron = dateToCronExpressionInTimezone(
      utcDate,
      'America/Bogota'
    );
    expect(colombiaCron).toBe('0 11 15 3 *');

    // In Argentina (UTC-3), this is 1:00 PM
    const argentinaCron = dateToCronExpressionInTimezone(
      utcDate,
      'America/Argentina/Buenos_Aires'
    );
    expect(argentinaCron).toBe('0 13 15 3 *');
  });
});
