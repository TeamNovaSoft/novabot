const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require('discord.js');
const { MAPPED_STATUS_COMMANDS } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const novabotStatus = () => {
  return new StringSelectMenuBuilder()
    .setCustomId('starter')
    .setPlaceholder('Make a selection!')
    .addOptions(
      Object.keys(MAPPED_STATUS_COMMANDS.novabot).map((status) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(status)
          .setDescription(status)
          .setValue(status);
      })
    );
};

const i18nStatus = () => {
  return new StringSelectMenuBuilder()
    .setCustomId('starter')
    .setPlaceholder('Make a selection!')
    .addOptions(
      Object.keys(MAPPED_STATUS_COMMANDS['i18n-populator']).map((status) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(status)
          .setDescription(status)
          .setValue(status);
      })
    );
};

const evoStatus = () => {
  return new StringSelectMenuBuilder()
    .setCustomId('starter')
    .setPlaceholder('Make a selection!')
    .addOptions(
      Object.keys(MAPPED_STATUS_COMMANDS['evo-crypter']).map((status) => {
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
      let select = [];
      switch (channel.name) {
        case 'novabot':
          select = novabotStatus();
          break;
        case 'i18n-populator':
          select = i18nStatus();
          break;
        case 'evo-crypter':
          select = evoStatus();
          break;
        default:
          select = novabotStatus();
          break;
      }

      const row = new ActionRowBuilder().addComponents(select);

      await interaction.reply({
        content: 'Choose your starter!',
        components: [row],
      });
    } catch (error) {
      console.error(error);
      await sendErrorToChannel(interaction, error);
      await interaction.editReply(translateLanguage('changeStatus.error'));
    }
  },
};
