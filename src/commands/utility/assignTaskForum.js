const { SlashCommandBuilder } = require('discord.js');
const { ASSIGN_TASK_FORUM } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const FORUM_TYPE = 15;

async function replyWithError(interaction, translationKey) {
  return await interaction.editReply({
    content: translateLanguage(translationKey),
    ephemeral: true,
  });
}

async function handleError(interaction, error) {
  console.error(error);
  await sendErrorToChannel(interaction, error);
  await interaction.editReply(translateLanguage('assignTaskForum.error'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assign')
    .setDescription(translateLanguage('assignTaskForum.description'))
    .setDescriptionLocalizations(keyTranslations('assignTaskForum.description'))
    .addStringOption((option) =>
      option
        .setName('user')
        .setDescription(translateLanguage('assignTaskForum.userOption'))
        .setDescriptionLocalizations(
          keyTranslations('assignTaskForum.userOption')
        )
        .setRequired(true)
        .addChoices([...ASSIGN_TASK_FORUM.tags.allowedDevelopersTags])
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const { channel, options } = interaction;

      if (!channel.isThread()) {
        return replyWithError(interaction, 'changeStatus.notAThread');
      }

      const forum = channel.parent;
      const assignedUser = options.getString('user');

      if (FORUM_TYPE !== forum.type) {
        return replyWithError(interaction, 'assignTaskForum.isNotForumThread');
      }

      if (channel.appliedTags.includes(assignedUser)) {
        return replyWithError(interaction, 'assignTaskForum.userAssignedTask');
      }

      const forumAvailableTagIds = forum.availableTags.map((tags) => tags.id);

      if (!forumAvailableTagIds.includes(assignedUser)) {
        return replyWithError(
          interaction,
          'assignTaskForum.userTagNotAvailable'
        );
      }

      await channel.setAppliedTags([
        ASSIGN_TASK_FORUM.tags.assignedTagId,
        assignedUser,
      ]);

      await interaction.editReply({
        content: translateLanguage('assignTaskForum.taskAssignedSuccessful'),
      });
    } catch (error) {
      await handleError(interaction, error);
    }
  },
};
