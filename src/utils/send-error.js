require('dotenv').config();
const { translateLanguage } = require('../languages');
const { EmbedBuilder } = require('discord.js');
const { getGitHubIssueURL } = require('./githubIssue');

/**
 * Maximum character length for a Discord embed description.
 *
 * This constant is based on the limit defined by Discord's API.
 * Exceeding this limit will result in an error when attempting to send the embed.
 *
 * @see {@link https://discordjs.guide/popular-topics/embeds.html#embed-limits}
 * @type {number}
 */
const MAX_EMBED_MESSAGE_DESCRIPTION_LENGTH = 4096;

/**
 * Maximum character length for an error message (regular message).
 *
 * This constant defines the upper limit for the length of error messages
 * sent to Discord (regular text messages).
 * It's used to prevent exceeding Discord's normal message size limits and ensure that
 * error reports are delivered successfully.
 *
 * @type {number}
 */
const MAX_ERROR_MESSAGE_LENGTH = 1000;
const GITHUB_IMAGE_LOGO =
  'https://github.githubassets.com/assets/github-mark-57519b92ca4e.png';

function createEmbedMessage(
  title,
  errorStack,
  gitHubIssueURL,
  commandName,
  user,
  additionalInfo
) {
  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`**${title}**\n`)
    .setThumbnail(GITHUB_IMAGE_LOGO)
    .setURL(gitHubIssueURL)
    .setDescription(
      buildEmbedDescription(
        errorStack,
        gitHubIssueURL,
        commandName,
        user,
        additionalInfo
      ).slice(0, MAX_EMBED_MESSAGE_DESCRIPTION_LENGTH)
    );
}

function buildEmbedDescription(
  errorStack,
  gitHubIssueURL,
  commandName,
  user,
  additionalInfo
) {
  return `**${translateLanguage('sendChannelError.commandLabel')}** ${commandName}\n
  ${user !== translateLanguage('sendChannelError.unknownUser') ? `**${translateLanguage('sendChannelError.userLabel')}** ${user}\n` : ''}
  ${additionalInfo.channel ? `**${translateLanguage('sendChannelError.channelLabel')}** ${additionalInfo.channel}\n` : ''}

  **${translateLanguage('sendChannelError.errorLabel')}** \`\`\`js\n${errorStack}\n\`\`\`

  ${gitHubIssueURL ? `\n🔗 **${translateLanguage('sendChannelError.reportIssue')}**: [${translateLanguage('sendChannelError.clickHere')}](${gitHubIssueURL})` : ''}`;
}

function buildErrorMessage({ error, commandName, user, additionalInfo }) {
  const title = `Error: ${error.message.slice(0, 200)}. ${translateLanguage('sendChannelError.errorReport')}`;
  const errorStack = (error.stack || error).toString();
  const gitHubIssueURL = getGitHubIssueURL(errorStack);

  if (errorStack.length >= MAX_ERROR_MESSAGE_LENGTH) {
    return createEmbedMessage(
      title,
      errorStack,
      gitHubIssueURL,
      commandName,
      user,
      additionalInfo
    );
  }
  return buildTextErrorMessage(
    title,
    errorStack,
    gitHubIssueURL,
    commandName,
    user,
    additionalInfo
  );
}

function buildTextErrorMessage(
  title,
  errorStack,
  gitHubIssueURL,
  commandName,
  user,
  additionalInfo
) {
  let message = `**${title}**\n`;
  message += `**${translateLanguage('sendChannelError.commandLabel')}** ${commandName}\n`;
  if (user !== translateLanguage('sendChannelError.unknownUser')) {
    message += `**${translateLanguage('sendChannelError.userLabel')}** ${user}\n`;
  }
  if (additionalInfo.channel) {
    message += `**${translateLanguage('sendChannelError.channelLabel')}** ${additionalInfo.channel}\n`;
  }
  message += `**${translateLanguage('sendChannelError.errorLabel')}** \`\`\`js\n${errorStack}\n\`\`\``;
  if (gitHubIssueURL) {
    message += `\n🔗 **${translateLanguage('sendChannelError.reportIssue')}**: [${translateLanguage('sendChannelError.clickHere')}](${gitHubIssueURL})`;
  }
  return message;
}

async function sendErrorToChannel(source, error, additionalInfo = {}) {
  try {
    const { client, commandName, user, interaction } = extractSourceDetails(
      source,
      additionalInfo
    );
    const errorChannelID = process.env.ERROR_CHANNEL_ID;
    const errorChannel = client.channels.cache.get(errorChannelID);

    if (!errorChannel || !errorChannel.isTextBased()) {
      await notifyUserInteraction(interaction, errorChannelID);
      return;
    }

    const errorMessage = buildErrorMessage({
      error,
      commandName,
      user,
      additionalInfo,
    });
    await sendErrorMessage(errorChannel, errorMessage);

    if (interaction && interaction.isRepliable()) {
      await notifyUserFollowUp(interaction);
    }
  } catch (err) {
    console.error('Failed to send error to channel:', err);
  }
}

async function sendErrorMessage(errorChannel, errorMessage) {
  try {
    await errorChannel.send(
      typeof errorMessage === 'string'
        ? errorMessage
        : { embeds: [errorMessage] }
    );
  } catch (err) {
    console.error(translateLanguage('sendChannelError.couldNotSend'), err);
  }
}

function extractSourceDetails(source, additionalInfo) {
  if (source && source.client && source.commandName) {
    return {
      client: source.client,
      commandName:
        source.commandName ||
        translateLanguage('sendChannelError.unknownCommand'),
      user: source.user
        ? source.user.tag
        : translateLanguage('sendChannelError.unknownUser'),
      interaction: source,
    };
  }
  return {
    client: source,
    commandName:
      additionalInfo.command ||
      translateLanguage('sendChannelError.unknownFunction'),
    user: translateLanguage('sendChannelError.unknownUser'),
    interaction: null,
  };
}

async function notifyUserInteraction(interaction, errorChannelID) {
  if (interaction && interaction.replied === false) {
    try {
      await interaction.reply({
        content: translateLanguage('sendChannelError.channelNotFound'),
        ephemeral: true,
      });
    } catch (err) {
      console.error(
        translateLanguage('sendChannelError.couldNotSendToUser'),
        `Failed to find error channel with ID: ${errorChannelID}`,
        err
      );
    }
  }
}

async function notifyUserFollowUp(interaction) {
  try {
    await interaction.followUp({
      content: translateLanguage('sendChannelError.userMessage'),
      ephemeral: true,
    });
  } catch (err) {
    console.error(
      translateLanguage('sendChannelError.couldNotSendToUser'),
      err
    );
  }
}

module.exports = { sendErrorToChannel };
