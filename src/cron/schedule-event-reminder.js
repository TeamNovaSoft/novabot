const { CronJob } = require('cron');
const { translateLanguage } = require('../languages/index');
const dateToCronExpression = require('../utils/date-to-cron-expression');
const {
  SCHEDULE_MESSAGES,
  DISCORD_SERVER,
  SCHEDULE_CALENDAR,
} = require('../config');
const saveErrorLog = require('../utils/log-error');
const { sendErrorToChannel } = require('../utils/send-error');

const HOURS_IN_MILLISECONDS = 60 * 60 * 1000;
const DAYS_IN_MILLISECONDS = 24 * HOURS_IN_MILLISECONDS;

let activeCronJobs = [];

const clearAllCronJobs = () => {
  activeCronJobs.forEach((job) => job.stop());
  activeCronJobs = [];
};

const generateReminderCronExpression = (event) => {
  const now = new Date();
  const eventEndTimeDate = new Date(event.scheduledEndTimestamp);
  const timeDifference = eventEndTimeDate - now;
  const reminderTime = new Date(
    timeDifference > DAYS_IN_MILLISECONDS
      ? eventEndTimeDate - DAYS_IN_MILLISECONDS
      : eventEndTimeDate - HOURS_IN_MILLISECONDS
  );

  if (reminderTime < now) {
    throw new Error(
      translateLanguage('calendarSchedules.eventAlreadyEndedError')
    );
  }

  return dateToCronExpression(reminderTime);
};

const sentEventReminder = async (event, eventAnnouncementChannel) => {
  if (eventAnnouncementChannel) {
    await eventAnnouncementChannel.send(
      translateLanguage('calendarSchedules.reminderDiscordEvent', {
        eventName: event.name,
      })
    );
  } else {
    console.log(translateLanguage('calendarSchedules.errorChannelNotFound'));
  }
};

/**
 * @typedef {import('discord.js').Client} Client
 */

/**
 * Schedules a reminder for an event to be sent to a Discord channel at a specific time.
 *
 * @param {Client} client - The Discord.js client instance.
 * @param {Object} event - The event object containing its name, startTime, and endTime.
 * @param {string} channelId - The ID of the channel where the reminder will be sent.
 * @param {string} timeZone - The timezone to use for scheduling the reminder.
 */
const scheduleEventReminder = ({ client, event, channelId, timeZone }) => {
  try {
    const cronExpression = generateReminderCronExpression(event);

    if (!cronExpression) {
      return;
    }

    const job = new CronJob(
      cronExpression,
      async () => {
        try {
          const eventAnnouncementChannel =
            await client.channels.fetch(channelId);
          await sentEventReminder(event, eventAnnouncementChannel);
        } catch (error) {
          saveErrorLog(
            `Error sending event reminder in channel - '${channelId}': ${error.message}`
          );
          sendErrorToChannel(client, error);
        }
      },
      null,
      true,
      timeZone
    );

    job.start();
    activeCronJobs.push(job);
  } catch (error) {
    saveErrorLog(
      `Error sending event reminder in channel - '${channelId}': ${error.message}`
    );
    sendErrorToChannel(client, error);
  }
};

/**
 * Schedules reminders for multiple events to be sent to a Discord channel.
 *
 * @param {Client} client - The Discord.js client instance.
 */
const scheduledEventNotifications = async (client) => {
  const guild = await client.guilds.fetch(DISCORD_SERVER.discordGuildId);
  const events = await guild.scheduledEvents.fetch();

  if (events.size === 0) {
    return console.log(
      translateLanguage('calendarSchedules.errorInvalidEventsArray')
    );
  }

  clearAllCronJobs();

  events.forEach((event) => {
    scheduleEventReminder({
      client,
      event,
      timeZone: SCHEDULE_MESSAGES.timeZone,
      channelId: DISCORD_SERVER.discordAnnouncementsChannel,
    });
  });
};

/**
 * @description Enables scheduled event notifications by creating a cron job
 *
 * @param {Client} client The client (Discord) to use for sending notifications.
 *
 * @returns {void}
 */
const scheduleDiscordEventNotifications = async (client) => {
  new CronJob(
    SCHEDULE_CALENDAR.scheduledCalendarInterval,
    () => {
      console.log('Running scheduled event notifications...');
      scheduledEventNotifications(client);
    },
    null,
    true,
    SCHEDULE_MESSAGES.timeZone
  );
};

module.exports = { scheduleDiscordEventNotifications };
