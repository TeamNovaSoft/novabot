const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { translateLanguage, keyTranslations } = require('../../languages');
const {
  getMappedStatusText,
  STATUS_KEY,
} = require('../../cron/schedule-code-review');
const { sendErrorToChannel } = require('../../utils/send-error');

const buildPendingReviewReminder = (pendingReviews) => {
  const reminders = [];

  // Create reminders for each pending review thread
  for (const thread of pendingReviews.values()) {
    reminders.push(
      translateLanguage('checkReview.threadNotReviewed')
        .replace('{{threadName}}', thread.name)
        .replace('{{threadUrl}}', thread.url)
    );
  }

  return reminders.join('\n\n');
};

const buildNoPendingReviewsMessage = (channel) => {
  const channelName = channel.name;
  const noPRMessage = translateLanguage('checkReview.noPendingReviews').replace(
    '{{channelName}}',
    channelName
  );

  return noPRMessage;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check-review')
    .setDescription(translateLanguage('checkReview.description'))
    .setDescriptionLocalizations(keyTranslations('checkReview.description'))
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription(translateLanguage('checkReview.channelOption'))
        .setDescriptionLocalizations(
          keyTranslations('checkReview.channelOption')
        )
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel('channel');
      if (!channel) {
        await interaction.reply({
          content: translateLanguage('checkReview.noChannels'),
          ephemeral: true,
        });
        return;
      }

      const statusText = getMappedStatusText(STATUS_KEY);
      if (!statusText) {
        throw new Error('Mapped status for pr-request-review not found.');
      }

      const activeThreads = await channel.threads.fetchActive();

      // Filter threads where the title contains the desired status text
      const pendingReviews = activeThreads.threads.filter((thread) =>
        thread.name.includes(statusText)
      );
      const pendingReviewMessage =
        pendingReviews.size > 0
          ? buildPendingReviewReminder(pendingReviews)
          : buildNoPendingReviewsMessage(channel);

      await interaction.editReply({
        content: pendingReviewMessage,
        ephemeral: true,
      });
    } catch (error) {
      console.error(`Error in check-review command: ${error}`);
      await sendErrorToChannel(interaction, error);
      await interaction.editReply({
        content: translateLanguage('checkReview.error'),
        ephemeral: true,
      });
    }
  },
};
