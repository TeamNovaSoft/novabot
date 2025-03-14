const { CronJob } = require('cron');
const { ChannelType } = require('discord.js');
const { translateLanguage } = require('../languages');
const saveErrorLog = require('../utils/log-error');
const { sendErrorToChannel } = require('../utils/send-error');

const {
  MAPPED_STATUS_COMMANDS,
  DISCORD_SERVER,
  CRON_STATUS_REMINDER,
} = require('../config');

const STATUS_KEY = 'pr-request-review';

const flatMappedStatusCommands = Object.entries(MAPPED_STATUS_COMMANDS).reduce(
  (acc, [, statuses]) => ({ ...acc, ...statuses }),
  {}
);

/**
 * Gets the mapped status text.
 * @param {string} key - Status key.
 * @returns {string|null} - Mapped text or null if not found.
 */
const getMappedStatusText = (key) => {
  const statusText = flatMappedStatusCommands[key];
  if (!statusText) {
    console.error(`Mapped status for ${key} not found.`);
    return null;
  }
  return statusText;
};

/**
 * Processes threads in a given channel for a specific status.
 * @param {Channel} channel - Discord text channel.
 * @param {string} statusText - Text to search in thread names.
 * @param {object} statusConfig - Configuration object.
 */
const matchedThreads = async (channel, statusText, statusConfig) => {
  try {
    const threads = await channel.threads.fetchActive();
    const pendingThreads = threads.threads.filter((thread) =>
      thread.name.includes(statusText)
    );
    const now = Date.now();
    const messageContent = [];
    pendingThreads.forEach((thread) => {
      const lastActivity =
        thread.lastMessage?.createdTimestamp || thread.createdTimestamp || 0;
      if (lastActivity === 0) {
        console.warn(
          `Skipping thread "${thread.name}" due to missing timestamps.`
        );
        return;
      }
      if (now - lastActivity >= statusConfig.rememberAfterMs) {
        const translatedMessage = translateLanguage(
          statusConfig.messageTranslationKey
        )
          .replace('{{threadName}}', thread.name)
          .replace('{{threadUrl}}', thread.url);
        messageContent.push(translatedMessage);
      }
    });
    if (messageContent.length > 0) {
      await channel.send({ content: messageContent.join('\n') });
    }
  } catch (error) {
    saveErrorLog(error);
  }
};

/**
 * Checks threads with a specific status and sends reminders if necessary.
 * @param {Client} client - Instance of the Discord.js client.
 * @param {string} statusText - Mapped status text to search in thread names.
 * @param {object} statusConfig - Status configuration.
 */
const checkThreadsForStatus = async (client, statusText, statusConfig) => {
  try {
    const guild = await client.guilds.fetch(DISCORD_SERVER.discordGuildId);
    if (!guild) {
      console.error(
        `Guild with ID ${DISCORD_SERVER.discordGuildId} not found.`
      );
      return;
    }
    const channels = await guild.channels.fetch();
    const textChannels = channels.filter(
      (channel) => channel.type === ChannelType.GuildText
    );
    if (textChannels.size === 0) {
      console.error('No text channels found.');
      return;
    }
    for (const channel of textChannels.values()) {
      await matchedThreads(channel, statusText, statusConfig);
    }
  } catch (error) {
    saveErrorLog(error);
    sendErrorToChannel(client, error);
  }
};

/**
 * Schedules cron jobs for all statuses defined in the configuration.
 * @param {Client} client - Instance of the Discord.js client.
 */
const scheduleAllStatusChecks = (client) => {
  Object.entries(CRON_STATUS_REMINDER.statusScheduleRemember).forEach(
    ([key, config]) => {
      try {
        const isValidConfig =
          config?.scheduleConfig &&
          config?.rememberAfterMs &&
          config?.messageTranslationKey;
        const statusText = getMappedStatusText(key);

        if (!isValidConfig || !statusText) {
          throw new Error(`No configuration found for status: ${key}`);
        }

        const schedule = config.scheduleConfig;

        new CronJob(
          schedule,
          () => checkThreadsForStatus(client, statusText, config),
          null,
          true,
          CRON_STATUS_REMINDER.timeZone
        );
      } catch (error) {
        console.error('Failed to create CronJob:', error.message);
        sendErrorToChannel(client, error);
      }
    }
  );
};

module.exports = { scheduleAllStatusChecks, getMappedStatusText, STATUS_KEY };
