const { Events } = require('discord.js');
const { translateLanguage } = require('../languages');
const { formatPRMessage } = require('../utils/pr-formatter');
const { DISCORD_SERVER } = require('../config');

function capitalizeText(text) {
  if (!text) {
    return '';
  }
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

function cleanStringArray(arr) {
  return arr.filter((str) => str.trim() !== '');
}

function isPullRequestOpen(prTitle = '') {
  return prTitle.toLowerCase().includes('pull request opened');
}

function extractPRMetadata(description = '') {
  if (typeof description !== 'string' || !description.trim()) {
    return {};
  }

  let lastSectionKey = null;
  const sectionMap = {};
  const lines = cleanStringArray(description.split('\r\n'));

  for (const line of lines) {
    if (line.includes('## ')) {
      const sectionTitle = line.substring(3).trim().toLowerCase();
      const sectionKey = toCamelCase(sectionTitle);
      sectionMap[sectionKey] = {
        title: sectionTitle,
        description: '',
      };
      lastSectionKey = sectionKey;
    } else if (lastSectionKey) {
      sectionMap[lastSectionKey].description += `${line}\n`;
    }
  }

  // clean data and extract url image
  Object.entries(sectionMap).forEach(([sectionKey, section]) => {
    if (!sectionKey.includes('screenshot')) {
      return (section.description = section.description.trim());
    }

    const match = section.description.match(/!\[.*?\]\((.*?)\)/);
    section.description = match ? match[1] : null;
  });

  return sectionMap;
}

function generateOverview(prRestMetadata) {
  const prMetadataKeys = Object.keys(prRestMetadata);
  let prOverview = '';
  prMetadataKeys.forEach((metadataKey, index) => {
    prOverview += `## ${capitalizeText(prRestMetadata[metadataKey].title)}\n${prRestMetadata[metadataKey].description}${prMetadataKeys.length - 1 === index ? '' : '\n'}`;
  });

  return prOverview;
}

async function handleError(error, message) {
  console.error('Error processing the PR:', error);

  if (!message.reply) {
    return console.error(
      'Could not send the reply due to an error in message.reply.'
    );
  }
  await message.reply({
    content: translateLanguage('qaMention.errorProcessingMention'),
    ephemeral: true,
  });
}

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    try {
      if (!message?.author?.bot || !message.guild) {
        return;
      }

      const pullRequestData = message?.embeds[0]?.data;

      if (
        !message.webhookId ||
        !message.author.username.toLowerCase().includes('git') ||
        !isPullRequestOpen(pullRequestData.title)
      ) {
        return;
      }

      const pullRequestTitle = pullRequestData.title.split(':')[1].trim();
      const pullRequestDescriptionMetadata = extractPRMetadata(
        message.embeds[0].data.description
      );
      const { howToTest, ...prRestMetadata } = pullRequestDescriptionMetadata;
      const prOverview = generateOverview(prRestMetadata);
      const formattedMessage = formatPRMessage({
        prUrl: pullRequestData.url,
        requester: pullRequestData?.author?.name,
        title: pullRequestTitle,
        howToTest: howToTest?.description || '',
        overview: prOverview,
      });
      const channel = await client.channels.fetch(
        DISCORD_SERVER.githubPRReviewChannel
      );

      await channel.send(formattedMessage);
    } catch (error) {
      await handleError(error, message);
    }
  },
};
