const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { translateLanguage } = require('../languages');
const moment = require('moment-timezone');
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
function parseDate(timeInput, timezone = 'UTC') {
  const fullDatePattern = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
  const timeOnlyPattern = /^\d{2}:\d{2}$/;
  let reminderMoment;

  if (fullDatePattern.test(timeInput)) {
    const [datePart, timePart] = timeInput.split(' ');
    const [day, month, year] = datePart.split('-');
    reminderMoment = moment.tz(
      `${year}-${month}-${day} ${timePart}`,
      'YYYY-MM-DD HH:mm',
      timezone
    );
  } else if (timeOnlyPattern.test(timeInput)) {
    const [hour, minute] = timeInput.split(':').map(Number);
    reminderMoment = moment
      .tz(timezone)
      .set({ hour, minute, second: 0, millisecond: 0 });
    if (reminderMoment.isBefore(moment.tz(timezone))) {
      reminderMoment.add(1, 'day');
    }
  } else {
    return null;
  }

  return reminderMoment.toDate();
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

function buildReminderEmbed(reminderDate) {
  const exactTime = `<t:${Math.floor(reminderDate.getTime() / 1000)}:F>`;
  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(translateLanguage('remindme.reminderCreatedTitle'))
    .setDescription(
      `**${translateLanguage('remindme.remindingAt')}:** ${exactTime}\n⏳ **${translateLanguage('remindme.updatingCountdown')}**`
    )
    .setFooter({ text: translateLanguage('remindme.dmNotice') });
}

function buildReminderButtons(reminderId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`set_interval_${reminderId}`)
      .setLabel(translateLanguage('remindme.resetReminder'))
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`edit_reminder_${reminderId}`)
      .setLabel(translateLanguage('remindme.editReminder'))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`delete_reminder_${reminderId}`)
      .setLabel(translateLanguage('remindme.cancelReminder'))
      .setStyle(ButtonStyle.Danger)
  );
}

function scheduleCountdown(reply, reminderDate, message) {
  const exactTime = `<t:${Math.floor(reminderDate.getTime() / 1000)}:F>`;
  return setInterval(() => {
    updateCountdownEmbed(reply, reminderDate, message, exactTime);
  }, 1000);
}

function scheduleTimeout(
  interaction,
  reply,
  message,
  timeInMsFromNow,
  activeReminders,
  userId,
  reminderId
) {
  return setTimeout(async () => {
    await disableReminderButtons(reply);
    try {
      await interaction.user.send(
        translateLanguage('remindme.reminderMessage').replace(
          '{{message}}',
          message
        )
      );
    } catch (error) {
      console.log(error);
    }
    cancelReminder(activeReminders, userId, reminderId);
  }, timeInMsFromNow);
}

module.exports = {
  parseDate,
  cancelReminder,
  replyToInteraction,
  disableReminderButtons,
  updateCountdownEmbed,
  resetReminder,
  formatReminderDate,
  buildReminderEmbed,
  buildReminderButtons,
  scheduleCountdown,
  scheduleTimeout,
};
