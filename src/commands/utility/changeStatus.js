const { SlashCommandBuilder } = require('discord.js');
const { MAPPED_STATUS_COMMANDS } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const COMMAND_KEYS = Object.keys(MAPPED_STATUS_COMMANDS);

const setThreadNameWithStatus = async ({ channel, newStatus }) => {
  const emojisRegExp = new RegExp(
    `(${Object.values(MAPPED_STATUS_COMMANDS).join('|')})`,
    'ig'
  );

  const channelName = channel.name.replace(emojisRegExp, '').trim();

  const updatedChannelName = `${newStatus} ${channelName}`;
  await channel.setName(updatedChannelName);
};

const updateThreadStatus = async (interaction) => {
  const { options, channel, user } = interaction;
  const status = options.getString('status');
  const message = options.getString('message');
  const newStatus = MAPPED_STATUS_COMMANDS[status];

  if (!newStatus) {
    return await interaction.editReply(
      translateLanguage('changeStatus.invalidStatus')
    );
  }

  await setThreadNameWithStatus({ channel, newStatus });

  if (message) {
    const markdownMessage =
      `# ${newStatus} ${status.replaceAll('-', ' ')}\n\n` +
      `${message}\n\n` +
      `> ${user}`;
    await channel.send(markdownMessage);
  }

  await interaction.editReply(
    translateLanguage('changeStatus.updatedStatus', {
      status: status.replaceAll('-', ' '),
    })
  );
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('change-status')
    .setDescription(translateLanguage('changeStatus.description'))
    .setDescriptionLocalizations(keyTranslations('changeStatus.description'))
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription(translateLanguage('changeStatus.statusOption'))
        .setDescriptionLocalizations(
          keyTranslations('changeStatus.statusOption')
        )
        .setRequired(true)
        .addChoices(
          COMMAND_KEYS.map((command) => ({
            name: command.replaceAll('pr-', '').replaceAll('-', ' '),
            value: command,
          }))
        )
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription(translateLanguage('changeStatus.messageOption'))
        .setDescriptionLocalizations(
          keyTranslations('changeStatus.messageOption')
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.channel.isThread()) {
        return await interaction.editReply({
          content: translateLanguage('changeStatus.notAThread'),
          ephemeral: true,
        });
      }

      await updateThreadStatus(interaction);
    } catch (error) {
      console.error(error);
      await sendErrorToChannel(interaction, error);
      await interaction.editReply(translateLanguage('changeStatus.error'));
    }
  },
};
