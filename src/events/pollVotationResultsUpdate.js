const { Events, roleMention, userMention } = require('discord.js');
const { VOTE_POINTS } = require('../config');
const { translateLanguage } = require('../languages');

const tagIds = VOTE_POINTS.TAG_IDS;

const getPointType = (questionPart) => {
  const isBoostedPoint = questionPart.includes('boosted');
  return isBoostedPoint ? tagIds.boostedPointTagId : tagIds.addPointTagId;
};

const parseQuestionInput = (questionField) => {
  const questionText = questionField?.text;

  if (!questionText) {
    throw new Error(translateLanguage('votePoints.notFoundPollDescription'));
  }

  const parts = (questionText || '').split('|').map((part) => part.trim());

  if (parts.length < 2) {
    throw new Error(translateLanguage('votePoints.notFoundDescriptionParts'));
  }

  return {
    pointType: parts[0].toLowerCase(),
    userId: parts[1],
  };
};

/**
 * Retrieves the element(s) with the highest 'voteCount' from a question answers collection.
 * In case of a tie, it returns all elements that share the maximum count.
 *
 * @param {Map<any, { id: any, text: string, voteCount: number }>} pollAnswers -
 * The collection of PollAnswer objects (or similar) to analyze. It is expected that the
 * values of the collection are objects with the properties 'id', 'text', and 'voteCount'.
 * @returns {Array<{ id: any, text: string, voteCount: number }>} -
 * An array containing the object(s) with the highest 'voteCount'.
 * Returns an empty array if the collection is empty or null.
 */
function getTopVoted(pollAnswers) {
  if (!pollAnswers || pollAnswers.size === 0) {
    return [];
  }

  let maxVoteCount = 0;
  const topVoted = [];

  for (const pollAnswer of pollAnswers.values()) {
    if (pollAnswer.voteCount > maxVoteCount) {
      maxVoteCount = pollAnswer.voteCount;
      topVoted.length = 0;
      topVoted.push(parseInt(pollAnswer.text, 10));
    } else if (
      pollAnswer.voteCount !== 0 &&
      pollAnswer.voteCount === maxVoteCount
    ) {
      topVoted.push(parseInt(pollAnswer.text, 10));
    }
  }

  return topVoted.length > 0 ? topVoted : [maxVoteCount];
}

const calculatePoints = (topOptions) => {
  if (topOptions.length === 1) {
    return topOptions[0];
  }

  return (
    {
      min: () => Math.min(...topOptions),
      max: () => Math.max(...topOptions),
      round: () =>
        Math.round(topOptions.reduce((a, b) => a + b, 0) / topOptions.length),
    }[VOTE_POINTS.voteDrawMode]() || Math.max(...topOptions)
  );
};

const getFinalResult = (pollAnswers) => {
  const finalResultOptions = getTopVoted(pollAnswers);
  const finalPoints = calculatePoints(finalResultOptions);

  return finalPoints;
};

const sendPointAwardMessages = async ({ pollFields, message }) => {
  const { client, channelId } = message;

  const userInput = parseQuestionInput(pollFields.question);

  if (!userInput) {
    return;
  }

  const { pointType, userId } = userInput;
  const userMentioned = userMention(userId);
  const selectedTagId = roleMention(getPointType(pointType));

  const finalResult = getFinalResult(pollFields.answers);

  if (!finalResult) {
    return await message.reply(translateLanguage('votePoints.invalidResult'));
  }

  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    return await message.reply(translateLanguage(`votePoints.notFindChannel`));
  }

  await Promise.all(
    Array.from({ length: finalResult }).map(async () => {
      await channel.send(`${selectedTagId} ${userMentioned}`);
    })
  );
};

module.exports = {
  name: Events.MessageUpdate,
  async execute(_client, message) {
    try {
      const { author, poll: votationPoll } = message;
      const isCurrentBotAuthor = author?.id === message.client.user.id;
      const havePollData =
        votationPoll?.answers?.size && votationPoll?.question;

      if (!isCurrentBotAuthor || !votationPoll || !havePollData) {
        return;
      }

      const prChannel = await _client.channels.fetch(message.channelId);
      const pollMessage = await prChannel.messages.fetch(message.id);
      const { poll: pollVotation } = pollMessage;

      if (!pollVotation?.resultsFinalized) {
        return;
      }

      await sendPointAwardMessages({ pollFields: pollVotation, message });
    } catch (error) {
      console.error('Error handling event:', error);
      await message.reply({
        content: translateLanguage('votePoints.errorOcurred'),
        ephemeral: true,
      });
    }
  },
};
