const { SlashCommandBuilder } = require('discord.js');
const { ASSIGN_TASK_FORUM } = require('../../config');
const { translateLanguage, keyTranslations } = require('../../languages');
const { sendErrorToChannel } = require('../../utils/send-error');

const CHANNEL_TYPES = {
  FORUM: 15,
};

async function replyWithError(interaction, translationKey) {
  return await interaction.editReply({
    content: translateLanguage(translationKey),
    ephemeral: true,
  });
}

function getUserTagForAssignment(forum, assignedUser, channel) {
  if (CHANNEL_TYPES.FORUM !== forum.type) {
    return { reply: 'assignTaskForum.isNotForumThread' };
  }

  const forumAvailableTag = forum.availableTags;
  const userTag = forumAvailableTag.find(
    (tag) => tag.name.toLowerCase() === assignedUser
  );

  if (!userTag) {
    return { reply: 'assignTaskForum.userTagNotAvailable' };
  }

  if (channel.appliedTags.includes(userTag.id)) {
    return { reply: 'assignTaskForum.userAssignedTask' };
  }

  return { userTag };
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
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(translateLanguage('assignTaskForum.userOption'))
        .setDescriptionLocalizations(
          keyTranslations('assignTaskForum.userOption')
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const { channel, options, user } = interaction;

      if (!channel.isThread()) {
        return replyWithError(interaction, 'changeStatus.notAThread');
      }

      const forum = channel.parent;
      const assignedUser = (
        options.getUser('user')?.username || user.username
      ).toLowerCase();
      const { userTag, reply } = getUserTagForAssignment(
        forum,
        assignedUser,
        channel
      );

      if (reply) {
        return replyWithError(interaction, reply);
      }

      await channel.setAppliedTags([
        ASSIGN_TASK_FORUM.tags.assignedTagId,
        userTag.id,
      ]);

      await interaction.editReply({
        content: translateLanguage('assignTaskForum.taskAssignedSuccessful'),
      });
    } catch (error) {
      await handleError(interaction, {
        ...error,
        message: `${error.message.slice(0, 100)}... assignedTagId: ${ASSIGN_TASK_FORUM.tags.assignedTagId}`,
      });
    }
  },
};
