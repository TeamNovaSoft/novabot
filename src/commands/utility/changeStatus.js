const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require('discord.js');
const { MAPPED_STATUS_COMMANDS } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const createStatusMenu = (channel) => {
  const selectedChannel = MAPPED_STATUS_COMMANDS[channel] ? channel : 'novabot';

  return new StringSelectMenuBuilder()
    .setCustomId('change_status_select')
    .setPlaceholder(translateLanguage('changeStatus.placeholder'))
    .addOptions(
      Object.keys(MAPPED_STATUS_COMMANDS[selectedChannel]).map((status) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(status)
          .setDescription(status)
          .setValue(status);
      })
    );
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('change-status')
    .setDescription(translateLanguage('changeStatus.description'))
    .setDescriptionLocalizations(keyTranslations('changeStatus.description')),
  async execute(interaction) {
    try {
      const { channel } = interaction;
      const selectMenu = createStatusMenu(channel.name);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: translateLanguage('changeStatus.selectStatus'),
        components: [row],
      });
    } catch (error) {
      console.error(error);
      await sendErrorToChannel(interaction, error);
      await interaction.editReply(translateLanguage('changeStatus.error'));
    }
  },
};

module.exports.handleInteraction = async (interaction) => {
  if (!interaction.isStringSelectMenu()) {
    return;
  }

  if (interaction.customId === 'change_status_select') {
    const selectedStatus = interaction.values[0];

    await interaction.update({
      content: translateLanguage('changeStatus.success', {
        status: selectedStatus,
      }),
      components: [],
    });
  }
};
