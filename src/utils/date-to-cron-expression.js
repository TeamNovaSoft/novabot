const moment = require('moment-timezone');
const { SCHEDULE_MESSAGES } = require('../config');

/**
 * Converts a date string into a CRON expression.
 *
 * @param {string} dateString - An ISO string representing a date.
 * @param {string} eventTimeZone - Event timezone (e.g., 'America/Argentina/Buenos_Aires').
 * @returns {string} A CRON expression derived from the provided date.
 *
 * @example
 * dateToCronExpression('2022-01-22T15:30:00.000Z', 'America/Argentina/Buenos_Aires');
 * // Returns '30 15 22 1 *'
 *
 * @example
 * dateToCronExpression('2022-01-01T00:00:00.000Z');
 * // Returns '0 0 1 1 *'
 */
function dateToCronExpression(dateString, eventTimeZone) {
  const timeZoneTarget = eventTimeZone
    ? eventTimeZone
    : SCHEDULE_MESSAGES.timeZone;
  const date = moment.tz(dateString, timeZoneTarget);

  const minutes = date.minutes();
  const hours = date.hours();
  const day = date.date();
  const month = date.month() + 1;

  return `${minutes} ${hours} ${day} ${month} *`;
}

module.exports = dateToCronExpression;
