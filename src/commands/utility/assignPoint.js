const { SlashCommandBuilder } = require('discord.js');
const { sendErrorToChannel } = require('../../utils/send-error');
const { VOTE_POINTS, ADMIN_ROLE_ID } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');

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
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID.adminRole)) {
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
          ? VOTE_POINTS.TAG_IDS.boostedPointTagId
          : VOTE_POINTS.TAG_IDS.addPointTagId,
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

      for (let i = 0; i < quantity; i++) {
        await interaction.channel.send(`${roleMention} ${targetUser}`);
      }

      await interaction.channel.send(
        `${translateLanguage('assignPoints.reasonLabel')}\n${reason}\n\nBy ${interaction.user}`
      );
    } catch (error) {
      await sendErrorToChannel(interaction, error);
      return interaction.reply({
        content: translateLanguage('assignPoints.errorAssigning'),
        ephemeral: true,
      });
    }
  },
};
