const { SlashCommandBuilder } = require('discord.js');
const { sendErrorToChannel } = require('../../utils/send-error');
const { VOTE_POINTS, ADMIN_ROLE_ID } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const tagIds = VOTE_POINTS.TAG_IDS;
const adminRoleId = ADMIN_ROLE_ID.adminRole;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assign-points')
    .setDescription(translateLanguage('assignPoints.description'))
    .setDescriptionLocalizations(keyTranslations('assignPoints.description'))
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(translateLanguage('assignPoints.userOption'))
        .setDescriptionLocalizations(keyTranslations('assignPoints.userOption'))
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('point-type')
        .setDescription(translateLanguage('assignPoints.pointTypeOption'))
        .setDescriptionLocalizations(
          keyTranslations('assignPoints.pointTypeOption')
        )
        .setRequired(true)
        .addChoices(
          { name: 'Normal Points', value: 'normal' },
          { name: 'Boosted Points', value: 'boosted' }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName('quantity')
        .setDescription(translateLanguage('assignPoints.quantityOption'))
        .setDescriptionLocalizations(
          keyTranslations('assignPoints.quantityOption')
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription(translateLanguage('assignPoints.reasonOption'))
        .setDescriptionLocalizations(
          keyTranslations('assignPoints.reasonOption')
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({
        content: translateLanguage('assignPoints.noPermission'),
        ephemeral: true,
      });
    }
    const targetUser = interaction.options.getUser('user'),
      pointType = interaction.options.getString('point-type'),
      quantity = interaction.options.getInteger('quantity'),
      reason = interaction.options.getString('reason'),
      tagId =
        pointType === 'boosted'
          ? tagIds.boostedPointTagId
          : tagIds.addPointTagId,
      roleMention = `<@&${tagId}>`;
    try {
      await interaction.reply({
        content: translateLanguage('assignPoints.orderReceived', {
          quantity,
          pointType,
          target: targetUser.tag,
        }),
        ephemeral: true,
      });

      const pointsLines = Array.from(
        { length: quantity },
        () => `${roleMention} ${targetUser}`
      ).join('\n');
      const fullMessage = `${pointsLines}\n\n${translateLanguage('assignPoints.reasonLabel')}\n${reason}\n\nBy ${interaction.user}`;

      await interaction.channel.send(fullMessage);
    } catch (error) {
      await sendErrorToChannel(interaction, error);
      return interaction.reply({
        content: translateLanguage('assignPoints.errorAssigning'),
        ephemeral: true,
      });
    }
  },
};
