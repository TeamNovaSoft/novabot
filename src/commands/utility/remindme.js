const { SlashCommandBuilder } = require('discord.js');

const {
  parseDate,
  replyToInteraction,
  buildReminderEmbed,
  buildReminderButtons,
  scheduleCountdown,
  scheduleTimeout,
} = require('../../utils/remindme-functions');
const {
  handleDeleteReminder,
  handleSetInterval,
  handleEditReminder,
  handleEditReminderModal,
} = require('../../utils/remindme-button-functions');
const { translateLanguage, keyTranslations } = require('../../languages');
const { TIME_ZONES } = require('../../config');

const activeReminders = new Map();
let reminderCounter = 0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription(translateLanguage('remindme.commandDescription'))
    .setDescriptionLocalizations(keyTranslations('remindme.commandDescription'))
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription(translateLanguage('remindme.timeOptionDescription'))
        .setDescriptionLocalizations(
          keyTranslations('remindme.timeOptionDescription')
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription(translateLanguage('remindme.messageOptionDescription'))
        .setDescriptionLocalizations(
          keyTranslations('remindme.messageOptionDescription')
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('timezone')
        .setDescription('remindme.timeZone')
        .setRequired(true)
        .addChoices(
          ...TIME_ZONES.map((tz) => ({ name: tz.name, value: tz.value }))
        )
    ),

  async execute(interaction) {
    const timeInput = interaction.options.getString('time');
    const message = interaction.options.getString('message');
    const timezone = interaction.options.getString('timezone');

    const reminderDate = parseDate(timeInput, timezone);

    if (!reminderDate) {
      return replyToInteraction(
        interaction,
        translateLanguage('remindme.invalidFormat'),
        true
      );
    }

    let timeDiff = reminderDate.getTime() - Date.now();
    if (timeDiff <= 0) {
      reminderDate.setDate(reminderDate.getDate() + 1);
      timeDiff = reminderDate.getTime() - Date.now();
    }

    await this.startReminder(interaction, reminderDate, message, timeDiff);
  },

  async startReminder(interaction, reminderDate, message, timeInMsFromNow) {
    const userId = interaction.user.id;
    const reminderId = ++reminderCounter;

    const embed = buildReminderEmbed(reminderDate, message);
    const row = buildReminderButtons(reminderId);
    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    const interval = scheduleCountdown(reply, reminderDate, message);

    const timeout = scheduleTimeout(
      interaction,
      reply,
      message,
      timeInMsFromNow,
      activeReminders,
      userId,
      reminderId
    );

    const reminderObj = {
      id: reminderId,
      interval,
      timeout,
      reminderDate,
      message,
      timeInMsFromNow,
      reply,
    };

    if (activeReminders.has(userId)) {
      activeReminders.get(userId).push(reminderObj);
    } else {
      activeReminders.set(userId, [reminderObj]);
    }
  },
  async buttonHandler(interaction) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) {
      return;
    }
    const userId = interaction.user.id;
    const customId = interaction.customId;
    const parts = customId.split('_');
    const actionKey = parts.includes('modal')
      ? parts.slice(0, 3).join('_')
      : parts.slice(0, 2).join('_');
    const reminderId = parseInt(parts.pop(), 10);
    await this.handleAction(interaction, actionKey, userId, reminderId);
  },

  async handleAction(interaction, actionKey, userId, reminderId) {
    switch (actionKey) {
      case 'delete_reminder':
        await handleDeleteReminder(
          interaction,
          userId,
          reminderId,
          activeReminders
        );
        break;
      case 'set_interval':
        await handleSetInterval(
          interaction,
          userId,
          reminderId,
          activeReminders,
          this.startReminder.bind(this)
        );
        break;
      case 'edit_reminder':
        await handleEditReminder(
          interaction,
          userId,
          reminderId,
          activeReminders
        );
        break;
      case 'edit_reminder_modal':
        await handleEditReminderModal(
          interaction,
          userId,
          reminderId,
          activeReminders,
          this.startReminder.bind(this)
        );
        break;
      default:
        break;
    }
  },
};
