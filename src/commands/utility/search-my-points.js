const { SlashCommandBuilder } = require('discord.js');
const { VOTE_POINTS } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const tagIds = VOTE_POINTS.TAG_IDS;

function buildDateStrings(year, month) {
  const targetStartDate = new Date(year, month - 1, 0);
  const targetEndDate = new Date(year, month, 1);
  const startDateStr = `${targetStartDate.getFullYear()}-${String(
    targetStartDate.getMonth() + 1
  ).padStart(2, '0')}-${String(targetStartDate.getDate()).padStart(2, '0')}`;
  const endDateStr = `${targetEndDate.getFullYear()}-${String(
    targetEndDate.getMonth() + 1
  ).padStart(2, '0')}-01`;
  return { startDateStr, endDateStr };
}

function buildQueryStrings({
  startDateStr,
  endDateStr,
  channelQueryParts,
  userId,
}) {
  const escapedUserId = `<@${userId}>`;
  return {
    openedPRs: `before: ${endDateStr} after: ${startDateStr} ${channelQueryParts} Author: ${escapedUserId}`,
    taskCompletedQuery: `before: ${endDateStr} after: ${startDateStr} ${channelQueryParts} <@&${tagIds.taskCompletedTagId}> ${escapedUserId}`,
    addPointQuery: `before: ${endDateStr} after: ${startDateStr} ${channelQueryParts} <@&${tagIds.addPointTagId}> ${escapedUserId}`,
    boostedPointQuery: `before: ${endDateStr} after: ${startDateStr} ${channelQueryParts} <@&${tagIds.boostedPointTagId}> ${escapedUserId}`,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('my-points-query')
    .setDescription(translateLanguage('searchMyPoints.description'))
    .setDescriptionLocalizations(keyTranslations('searchMyPoints.description'))
    .addIntegerOption((option) =>
      option
        .setName('year')
        .setDescription(translateLanguage('searchMyPoints.yearOption'))
        .setDescriptionLocalizations(
          keyTranslations('searchMyPoints.yearOption')
        )
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('month')
        .setDescription(translateLanguage('searchMyPoints.monthOption'))
        .setDescriptionLocalizations(
          keyTranslations('searchMyPoints.monthOption')
        )
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(translateLanguage('searchMyPoints.userOption'))
        .setDescriptionLocalizations(
          keyTranslations('searchMyPoints.userOption')
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('channels')
        .setDescription(translateLanguage('searchMyPoints.channelsOption'))
        .setDescriptionLocalizations(
          keyTranslations('searchMyPoints.channelsOption')
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const currentDate = new Date();
      const year =
        interaction.options.getInteger('year') || currentDate.getFullYear();
      const month =
        interaction.options.getInteger('month') || currentDate.getMonth() + 1;
      const user = interaction.options.getUser('user') || interaction.user;
      const channelsInput = interaction.options.getString('channels');
      const channels = channelsInput
        ? channelsInput.split(',').map((channel) => channel.trim())
        : [];
      const channelQueryParts = channels.length
        ? channels.map((channel) => `in:${channel}`).join(' ')
        : '';

      const { startDateStr, endDateStr } = buildDateStrings(year, month);
      const queries = buildQueryStrings({
        startDateStr,
        endDateStr,
        channelQueryParts,
        userId: user.id,
      });

      await interaction.reply({
        content: translateLanguage('searchMyPoints.reply', queries),
        ephemeral: true,
      });
    } catch (error) {
      await sendErrorToChannel(interaction, error);
    }
  },
};
