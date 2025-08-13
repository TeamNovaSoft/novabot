const { Events } = require('discord.js');
const { translateLanguage } = require('../languages');
const { formatPRMessage } = require('../utils/pr-formatter');
const { GITHUB_PUBLISH_OPENED_PR } = require('../config');
const saveErrorLog = require('../utils/log-error');

const headers = {
  Authorization: `token ${GITHUB_PUBLISH_OPENED_PR.githubOrganizationPAT}`,
  'Content-Type': 'application/json',
};

function toCamelCase(str) {
  if (!str) {
    return '';
  }

  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

function camelCaseToNormal(camelCaseString) {
  const words = camelCaseString
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ');
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractSectionTitle(line) {
  const match = line.trim().match(/^#+\s*(.*)/);
  if (match && match[1]) {
    return match[1].trim().toLowerCase();
  }
  return null;
}

function cleanStringArray(arr) {
  return arr.filter((str) => str.trim() !== '');
}

function extractDataFromPRGitHubUrl(githubURL) {
  if (!githubURL) {
    return;
  }

  const [organization, repository, type, pullNumber] = new URL(
    githubURL
  ).pathname
    .split('/')
    .slice(1);

  return {
    organization,
    repository,
    type,
    pullNumber,
  };
}

function isPullRequestOpen(prTitle = '') {
  return /pull request opened/i.test(prTitle);
}

async function fetchPullRequest(pullRequestMetadata) {
  const {
    repository: repo,
    pullNumber,
    organization,
  } = extractDataFromPRGitHubUrl(pullRequestMetadata.url);

  if (!repo || !pullNumber) {
    throw new Error(
      translateLanguage('pullRequestOpen.errorExtractDataFromURL')
    );
  }

  const url = `https://api.github.com/repos/${organization}/${repo}/pulls/${pullNumber}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      translateLanguage('pullRequestOpen.errorFetchPR', {
        status: response.status,
        prURL: url,
      })
    );
  }

  const data = await response.json();
  return data;
}

function extractPRMetadata(description = '') {
  if (typeof description !== 'string' || !description.trim()) {
    return {};
  }

  let lastSectionKey = 'description';
  const sectionMap = {
    description: '',
  };
  const lines = cleanStringArray(description.split('\r\n'));

  for (const line of lines) {
    if (line.includes('## ')) {
      const sectionTitle = extractSectionTitle(line);
      const sectionKey = toCamelCase(sectionTitle);
      sectionMap[sectionKey] = '';
      lastSectionKey = sectionKey;
    } else if (lastSectionKey) {
      sectionMap[lastSectionKey] += `${line}\n`;
    }
  }

  // clean data and extract url image
  Object.entries(sectionMap).forEach(([sectionKey, section]) => {
    if (!sectionKey.includes('screenshot')) {
      return (section = section.trim());
    }

    const match = section.match(/!\[.*?\]\((.*?)\)/);
    section = match ? match[1] : null;
  });

  return sectionMap;
}

function generateOverview(prRestMetadata) {
  const prMetadataKeys = Object.keys(prRestMetadata);
  const prOverview = prMetadataKeys.reduce((overview, metadataKey, index) => {
    if (!prRestMetadata[metadataKey]) {
      return overview;
    }

    return `${overview}## ${camelCaseToNormal(metadataKey)}\n${prRestMetadata[metadataKey]}${prMetadataKeys.length - 1 === index ? '' : '\n'}`;
  }, '');

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
    howToTest: howToTest || '',
    overview: prOverview,
  });
}

async function startPRThread(client, pullData, formattedMessage) {
  const channel = await client.channels.fetch(
    GITHUB_PUBLISH_OPENED_PR.githubPRReviewChannel
  );
  const prMessage = await channel.send(formattedMessage);

  prMessage.startThread({
    name:
      pullData.head.ref ||
      translateLanguage('pullRequestOpen.newPrThreadName', {
        pullNumber: pullData.number,
      }),
  });
}

async function handleError(error, message) {
  console.error('Error processing the PR:', error);
  saveErrorLog(error);

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
      if (!GITHUB_PUBLISH_OPENED_PR.githubPRPublishEnabled) {
        return;
      }

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

      await startPRThread(client, pullData, formattedMessage);
    } catch (error) {
      await handleError(error, message);
    }
  },
};
