const moment = require('moment-timezone');

/**
 * Converts a date string into a CRON expression.
 *
 * @param {string} dateString - A string representing a date.
 * @param {string} dateString - Event timezone.
 * @returns {string} A CRON expression derived from the provided date.
 *
 * @example
 * dateToCronExpression('2022-01-22T15:30:00', eventTimeZone);
 * // Returns '30 15 22 1 *'
 *
 * @example
 * dateToCronExpression('2022-01-01T00:00:00');
 * // Returns '0 0 1 1 *'
 */
function dateToCronExpression(dateString, eventTimeZone = 'America/Bogota') {
  const date = moment.tz(dateString, eventTimeZone);

  const minutes = date.minutes();
  const hours = date.hours();
  const day = date.date();
  const month = date.month() + 1;

  return `${minutes} ${hours} ${day} ${month} *`;
}

module.exports = dateToCronExpression;
