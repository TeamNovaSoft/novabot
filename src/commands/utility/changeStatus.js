const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require('discord.js');
const { MAPPED_STATUS_COMMANDS } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const createStatusMenu = (category) => {
  return new StringSelectMenuBuilder()
    .setCustomId('status_select')
    .setPlaceholder('Make a selection!')
    .addOptions(
      Object.keys(MAPPED_STATUS_COMMANDS[category]).map((status) => {
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
      let selectMenu;

      switch (channel.name) {
        case 'novabot':
          selectMenu = createStatusMenu('novabot');
          break;
        case 'i18n-populator':
          selectMenu = createStatusMenu('i18n-populator');
          break;
        case 'evo-crypter':
          selectMenu = createStatusMenu('evo-crypter');
          break;
        default:
          selectMenu = createStatusMenu('evo-crypter');
          break;
      }

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: 'Choose your status!',
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

  if (interaction.customId === 'status_select') {
    const selectedStatus = interaction.values[0];

    await interaction.update({
      content: `You selected: **${selectedStatus}**`,
      components: [],
    });
  }
};
