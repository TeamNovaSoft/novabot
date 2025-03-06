const { translateLanguage } = require('../languages');

function buildRequestMessage({ user, userMessage, guild, channel }) {
  const escapedUserId = `<@${user.id}>`;
  const threadLink = `https://discord.com/channels/${guild.id}/${channel.id}`;
  return translateLanguage('requestPoint.message', {
    userId: escapedUserId,
    reason: userMessage,
    threadLink,
  });
}
module.exports = {
  buildRequestMessage,
};
