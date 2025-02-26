const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { translateLanguage } = require('../languages');
const { EmbedBuilder } = require('discord.js');

async function updateCountdownEmbed(reply, reminderDate, message, exactTime) {
  const timeLeft = reminderDate.getTime() - Date.now();
  if (timeLeft <= 0) {
    return;
  }

  const countdown = new Date(timeLeft).toISOString().substr(11, 8);
  const updatedEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(translateLanguage('remindme.reminderUpdatedTitle'))
    .setDescription(
      `**${translateLanguage('remindme.remindingAt')}:** ${exactTime}\n${translateLanguage('remindme.timeLeft')}: ${countdown}`
    )
    .setFooter({ text: translateLanguage('remindme.dmNotice') });

  await reply.edit({ embeds: [updatedEmbed] });
}

function parseDate(timeInput) {
  const fullDatePattern = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
  const timeOnlyPattern = /^\d{2}:\d{2}$/;
  let reminderDate;

  if (fullDatePattern.test(timeInput)) {
    const [datePart, timePart] = timeInput.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    reminderDate = new Date(year, month - 1, day, hour, minute);
  } else if (timeOnlyPattern.test(timeInput)) {
    const [hour, minute] = timeInput.split(':').map(Number);
    reminderDate = new Date();
    reminderDate.setHours(hour, minute, 0, 0);
    if (reminderDate.getTime() < Date.now()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
  } else {
    return null;
  }

  return reminderDate;
}

function cancelReminder(activeReminders, userId, reminderId) {
  if (activeReminders.has(userId)) {
    const userReminders = activeReminders.get(userId);
    const index = userReminders.findIndex((r) => r.id === reminderId);
    if (index !== -1) {
      const { interval, timeout } = userReminders[index];
      clearInterval(interval);
      clearTimeout(timeout);
      userReminders.splice(index, 1);
      if (userReminders.length === 0) {
        activeReminders.delete(userId);
      }
    }
  }
}

async function replyToInteraction(interaction, message, ephemeral = false) {
  if (!interaction.replied && !interaction.deferred) {
    return interaction.reply({ content: message, ephemeral });
  } else {
    return interaction.followUp({ content: message, ephemeral });
  }
}

function disableReminderButtons(target) {
  const message = target.message ?? target;

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('disabled_set_interval')
      .setLabel(translateLanguage('remindme.resetReminder'))
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('disabled_edit_reminder')
      .setLabel(translateLanguage('remindme.editReminder'))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('disabled_delete_reminder')
      .setLabel(translateLanguage('remindme.cancelReminder'))
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  return message.edit({ components: [disabledRow] });
}

async function resetReminder(
  interaction,
  activeReminders,
  userId,
  reminderId,
  newReminderDate,
  message,
  timeInMsFromNow,
  startReminder
) {
  cancelReminder(activeReminders, userId, reminderId);
  await disableReminderButtons(interaction);
  await startReminder(interaction, newReminderDate, message, timeInMsFromNow);
}
function formatReminderDate(reminderDate) {
  const formattedDate = `${String(reminderDate.getDate()).padStart(2, '0')}-${String(reminderDate.getMonth() + 1).padStart(2, '0')}-${reminderDate.getFullYear()} ${String(reminderDate.getHours()).padStart(2, '0')}:${String(reminderDate.getMinutes()).padStart(2, '0')}`;

  return formattedDate;
}

module.exports = {
  parseDate,
  cancelReminder,
  replyToInteraction,
  disableReminderButtons,
  updateCountdownEmbed,
  resetReminder,
  formatReminderDate,
};
