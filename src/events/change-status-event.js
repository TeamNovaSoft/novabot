const { Events } = require('discord.js');
const { MAPPED_STATUS_COMMANDS } = require('../config');

const setThreadNameWithStatus = async ({ channel, newStatus }) => {
  const allEmojis = Object.values(MAPPED_STATUS_COMMANDS)
    .flatMap((category) => Object.values(category))
    .join('|');

  const emojisRegExp = new RegExp(`(${allEmojis})`, 'gu');

  const channelName = channel.name.replace(emojisRegExp, '').trim();

  const updatedChannelName = `${newStatus} ${channelName}`;

  await channel.setName(updatedChannelName);
};

const handleStringSelectMenuInteraction = async (interaction) => {
  try {
    if (!interaction.isStringSelectMenu()) {
      return;
    }

    await interaction.deferUpdate();

    const selectedValue = interaction.values[0];
    const { channel } = interaction;

    const newStatus =
      Object.values(MAPPED_STATUS_COMMANDS)
        .flatMap((category) => Object.entries(category))
        .find(([key]) => key === selectedValue)?.[1] || selectedValue;

    await setThreadNameWithStatus({
      channel,
      newStatus,
    });

    await interaction.followUp({
      content: `Status changed to **${selectedValue}**!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error handling select menu interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'There was an error while handling your selection!',
        ephemeral: true,
      });
    }
  }
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(_client, interaction) {
    if (interaction.isStringSelectMenu()) {
      await handleStringSelectMenuInteraction(interaction);
    }
  },
};
