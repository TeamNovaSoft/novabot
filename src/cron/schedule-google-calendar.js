const { CronJob } = require('cron');
const { listEvents } = require('../../calendar');
const { EmbedBuilder } = require('discord.js');
const { translateLanguage } = require('../languages');
const dateToCronExpression = require('../utils/date-to-cron-expression');
const convertCronToText = require('../utils/cron-to-text-parser');
const {
  FIREBASE_CONFIG,
  SCHEDULE_CALENDAR,
  SCHEDULE_MESSAGES,
} = require('../config');

let activeCronJobs = [];

const minutesBeforeEvent = 10;

const clearAllCronJobs = () => {
  activeCronJobs.forEach((job) => job.stop());
  activeCronJobs = [];
};

const sendCalendarEventNotification = async (client, event) => {
  const calendarChannel = await client.channels.cache.get(
    FIREBASE_CONFIG.channelCalendarId
  );

  if (!calendarChannel) {
    return console.log(
      translateLanguage('calendarSchedules.errorChannelNotFound')
    );
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(translateLanguage('calendarSchedules.notificationMessage'))
    .setDescription(`**${event.summary}**`)
    .setFooter({
      text: translateLanguage('calendarSchedules.appFooter'),
    });

  if (event?.hangoutLink) {
    embed.addFields({
      name: translateLanguage('calendarSchedules.meetingLinkLabel'),
      value: `[${translateLanguage('calendarSchedules.clickHere')}](${event.hangoutLink})`,
      inline: false,
    });
  }

  calendarChannel.send({ embeds: [embed] });
};

/**
 * Schedules a notification to be sent when an event starts.
 *
 * @param {Object} event - The event object containing details about the event.
 * @param {string} event.summary - The name or description of the event.
 * @param {Object} event.start - The start date object for the event.
 * @param {string} event.start.dateTime - The date and time (ISO string) when the event starts.
 * @param {string} timeZone - The timezone to use for scheduling the notification.
 */
const scheduleEventNotification = async ({ client, event }) => {
  if (
    !client ||
    !event ||
    !event.start ||
    !event.start.dateTime ||
    !event.start.timeZone
  ) {
    throw new Error(
      translateLanguage('calendarSchedules.errorMissingParameters')
    );
  }

  const startDate = new Date(event.start.dateTime);
  startDate.setMinutes(startDate.getMinutes() - minutesBeforeEvent);

  const cronExpression = dateToCronExpression(startDate);
  const job = new CronJob(
    cronExpression,
    async () => {
      await sendCalendarEventNotification();
    },
    null,
    true,
    event.start.timeZone
  );

  job.start();
  activeCronJobs.push(job);
};

/**
 * Schedules multiple notifications for a list of events.
 *
 * @param {Array<{summary: string, start: {dateTime: string, timeZone: string}}>} events - List of event objects.
 */
const scheduleCalendarNotifications = async (client) => {
  const events = await listEvents();

  if (!Array.isArray(events)) {
    return console.log(
      translateLanguage('calendarSchedules.errorInvalidEventsArray')
    );
  }

  clearAllCronJobs();

  events.forEach((event) => {
    scheduleEventNotification({ client, event });
  });
};

/**
 * @description Schedules a cron job to send calendar notifications.
 *
 * @param {Client} client The client (Discord) to use for sending notifications.
 *
 * @returns {void}
 */
const setupCalendarNotifications = async (client) => {
  new CronJob(
    SCHEDULE_CALENDAR.scheduledCalendarInterval,
    () => {
      console.log('Running scheduled calendar notifications...');
      scheduleCalendarNotifications(client);
    },
    null,
    true,
    SCHEDULE_MESSAGES.timeZone
  );
  console.log(convertCronToText(SCHEDULE_CALENDAR.scheduledCalendarInterval));
};

module.exports = { setupCalendarNotifications };
