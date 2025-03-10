const { Events } = require('discord.js');
const { translateLanguage } = require('../languages');
const { formatPRMessage } = require('../utils/pr-formatter');
const { DISCORD_SERVER } = require('../config');
const saveErrorLog = require('../utils/log-error');

const headers = {
  Authorization: `token ${DISCORD_SERVER.githubOrganizationPAT}`,
  'Content-Type': 'application/json',
};

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

function extractDataFromPRGitHubUrl(githubURL) {
  if (!githubURL) {
    return githubURL;
  }
  const urlParts = githubURL.split('/');
  const pullNumberPartIndex = urlParts.length - 1;
  const repositoryPartIndex = pullNumberPartIndex - 2;

  return {
    repository: urlParts[repositoryPartIndex],
    pullNumber: urlParts[pullNumberPartIndex],
  };
}

function isPullRequestOpen(prTitle = '') {
  return prTitle.toLowerCase().includes('pull request opened');
}

async function fetchPullRequest(pullRequestMetadata) {
  const owner = pullRequestMetadata.author.name;
  const { repository: repo, pullNumber } = extractDataFromPRGitHubUrl(
    pullRequestMetadata.url
  );
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
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

function formatPullRequestMessage(pullData, prMessageMeta) {
  const pullRequestTitle = pullData.title;
  const pullRequestDescriptionMetadata = extractPRMetadata(pullData.body);
  const { howToTest, ...prRestMetadata } = pullRequestDescriptionMetadata;
  const prOverview = generateOverview(prRestMetadata);

  return formatPRMessage({
    prUrl: prMessageMeta.url,
    requester: prMessageMeta?.author?.name,
    title: pullRequestTitle,
    howToTest: howToTest?.description || '',
    overview: prOverview,
  });
}

async function handleError(error, message) {
  console.error('Error processing the PR:', error);

  if (!message.reply) {
    saveErrorLog({
      message:
        'Could not send the reply due to an error in listenPullRequestOpenMessage',
    });
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

      const pullRequestMeta = message?.embeds[0]?.data;

      if (
        !message.webhookId ||
        !message.author.username.toLowerCase().includes('git') ||
        !isPullRequestOpen(pullRequestMeta.title)
      ) {
        return;
      }

      const pullData = await fetchPullRequest(pullRequestMeta);

      const formattedMessage = formatPullRequestMessage(
        pullData,
        pullRequestMeta
      );

      const channel = await client.channels.fetch(
        DISCORD_SERVER.githubPRReviewChannel
      );

      await channel.send(formattedMessage);
    } catch (error) {
      await handleError(error, message);
    }
  },
};
