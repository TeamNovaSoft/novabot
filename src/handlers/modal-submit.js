const { formatPRMessage } = require('../utils/pr-formatter');
const { formatSendMessage } = require('../utils/send-message-formatter');
const { translateLanguage } = require('../languages');

async function handleModalSubmit(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (interaction.customId.startsWith('pr-template-modal-')) {
    await prTemplateModal(interaction);
  } else if (interaction.customId.startsWith('send-message-modal-')) {
    await sendMessageModal(interaction);
  }
}

async function prTemplateModal(interaction) {
  const channelId = interaction.customId.replace('pr-template-modal-', '');
  const prUrl = interaction.fields.getTextInputValue('urlInput');
  const title = interaction.fields.getTextInputValue('titleInput');
  const overview = interaction.fields.getTextInputValue('overviewInput');
  const howToTest = interaction.fields.getTextInputValue('howToTestInput');

  const formattedMessage = formatPRMessage({
    prUrl,
    title,
    overview,
    howToTest,
    requester: interaction.user,
  });

  await sendMessageToChannel(
    interaction,
    channelId,
    formattedMessage,
    'prTemplate.modal'
  );
}

async function sendMessageModal(interaction) {
  const result = interaction.customId.replace('send-message-modal-', '');
  const [channelId, userName] = result.split('-');
  const title = interaction.fields.getTextInputValue('titleInput');
  const description = interaction.fields.getTextInputValue('descriptionInput');

  const formattedMessage = formatSendMessage({
    title,
    description,
    userName,
  });

  await sendMessageToChannel(
    interaction,
    channelId,
    formattedMessage,
    'sendMessage.modal'
  );
}

async function sendMessageToChannel(
  interaction,
  channelId,
  message,
  translationKey
) {
  try {
    const channel = await interaction.client.channels.fetch(channelId);

    if (!channel) {
      await interaction.editReply({
        content: translateLanguage(`${translationKey}.channelNotFound`),
        ephemeral: true,
      });
      return;
    }

    const permissions = channel.permissionsFor(interaction.client.user);
    if (!permissions || !permissions.has('SendMessages')) {
      await interaction.editReply({
        content: translateLanguage(`${translationKey}.noPermissions`),
        ephemeral: true,
      });
      return;
    }

    await channel.send(message);
    await interaction.editReply({
      content: translateLanguage(`${translationKey}.postSuccess`, {
        channel: channel.toString(),
      }),
      ephemeral: true,
    });
  } catch (error) {
    console.error(`Error sending message for ${translationKey}:`, error);
    await interaction.editReply({
      content: translateLanguage(`${translationKey}.postError`),
      ephemeral: true,
    });
  }
}

module.exports = { handleModalSubmit };
