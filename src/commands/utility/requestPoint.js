const { SlashCommandBuilder } = require('discord.js');
const { REQUEST_POINT } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

function buildRequestMessage({ user, userMessage, guild, channel }) {
  const escapedUserId = `<@${user.id}>`;
  const threadLink = `https://discord.com/channels/${guild.id}/${channel.id}`;
  return translateLanguage('requestPoint.message', {
    userId: escapedUserId,
    reason: userMessage,
    threadLink,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-point')
    .setDescription(translateLanguage('requestPoint.description'))
    .setDescriptionLocalizations(keyTranslations('requestPoint.description'))
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(translateLanguage('requestPoint.userOption'))
        .setDescriptionLocalizations(keyTranslations('requestPoint.userOption'))
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription(translateLanguage('requestPoint.reasonOption'))
        .setDescriptionLocalizations(
          keyTranslations('requestPoint.reasonOption')
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      const { options, channel, guild } = interaction;
      if (!channel.isThread()) {
        return await interaction.reply({
          content: translateLanguage('requestPoint.notAThread'),
          ephemeral: true,
        });
      }
      const user = options.getUser('user');
      const userMessage = options.getString('reason');
      const message = buildRequestMessage({
        user,
        userMessage,
        guild,
        channel,
      });
      const adminChannel = await interaction.client.channels.fetch(
        REQUEST_POINT.discordAdminPointRequestChannel
      );
      if (adminChannel) {
        await adminChannel.send(message);
      }
      await interaction.reply({
        content: translateLanguage('requestPoint.success'),
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error executing request-point command:', error);
      await sendErrorToChannel(interaction, error);
      await interaction.reply({
        content: translateLanguage('requestPoint.error'),
        ephemeral: true,
      });
    }
  },
};
