const { Events, roleMention, userMention } = require('discord.js');
const { VOTE_POINTS } = require('../config');
const { translateLanguage } = require('../languages');

const tagIds = VOTE_POINTS.TAG_IDS;

const getPointType = (questionPart) => {
  const isBoostedPoint = questionPart.includes('boosted');
  return isBoostedPoint ? tagIds.boostedPointTagId : tagIds.addPointTagId;
};

const parseQuestionInput = (questionFields) => {
  const questionField = questionFields.find(
    (field) => field.name === 'poll_question_text'
  );

  if (!questionField) {
    throw new Error(translateLanguage('votePoints.notFoundPollDescription'));
  }

  const parts = (questionField.value || '')
    .split('|')
    .map((part) => part.trim());

  if (parts.length < 2) {
    throw new Error(translateLanguage('votePoints.notFoundDescriptionParts'));
  }

  return {
    pointType: parts[0].toLowerCase(),
    userId: parts[1],
  };
};

const getFinalResult = (questionFields) => {
  const finalResultField = questionFields.find(
    (field) => field.name === 'victor_answer_text'
  );

  if (!finalResultField?.value) {
    throw new Error(translateLanguage('votePoints.notFinalResultFound'));
  }

  const finalResult = parseInt(finalResultField.value || '0', 10);

  return !finalResult || isNaN(finalResult) ? null : finalResult;
};

const sendPointAwardMessages = async ({ questionFields, message }) => {
  const { client, channelId } = message;

  const userInput = parseQuestionInput(questionFields);
  if (!userInput) {
    return;
  }

  const { pointType, userId } = userInput;
  const userMentioned = userMention(userId);
  const selectedTagId = roleMention(getPointType(pointType));

  if (questionFields.length <= 3) {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      return await channel.send(
        translateLanguage(`votePoints.drawNotSupported`)
      );
    }
  }

  const finalResult = getFinalResult(questionFields);

  if (!finalResult) {
    return await message.reply(translateLanguage('votePoints.invalidResult'));
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel) {
    return await message.reply(
      translateLanguage(`votePoints.notFindChanne: ${channelId}`)
    );
  }

  await Promise.all(
    Array.from({ length: finalResult }).map(async () => {
      await channel.send(`${selectedTagId} ${userMentioned}`);
    })
  );
};

module.exports = {
  name: Events.MessageCreate,
  async execute(_client, message) {
    try {
      const { embeds, author } = message;
      const isCurrentBotAuthor = author?.id === message.client.user.id;
      const isTypePoll = embeds?.[0]?.data?.type === 'poll_result';
      const questionFields = embeds[0]?.fields;
      const havePollData = Array.isArray(questionFields);

      if (!isCurrentBotAuthor || !isTypePoll || !havePollData) {
        return;
      }

      await sendPointAwardMessages({ questionFields, message });
    } catch (error) {
      console.error('Error handling event:', error);
      await message.reply({
        content: translateLanguage('votePoints.errorOccurred'),
        ephemeral: true,
      });
    }
  },
};
