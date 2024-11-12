const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config(); // Load environment variables from .env file

module.exports = {
  data: new SlashCommandBuilder()
    .setName("my-points-query")
    .setDescription(
      "Get the Discord search query to check points for a specific month"
    )

    .addIntegerOption((option) =>
      option.setName("year").setDescription("Year to search").setRequired(false)
    )

    .addIntegerOption((option) =>
      option
        .setName("month")
        .setDescription("Month to search")
        .setRequired(false)
    )

    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to search for")
        .setRequired(false)
    )

    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("Select a specific channel")
        .setRequired(false)
        .addChoices(
          { name: "novabot", value: "novabot" },
          { name: "code-review", value: "code-review" }
        )
    ),

  async execute(interaction) {
    const currentDate = new Date();
    const year =
      interaction.options.getInteger("year") || currentDate.getFullYear();
    const month =
      interaction.options.getInteger("month") || currentDate.getMonth() || 12;
    const user = interaction.options.getUser("user") || interaction.user;
    const selectedChannel = interaction.options.getString("channel");

    const taskCompletedTagId =
      process.env.TASK_COMPLETED_TAG_ID || "1203085046769262592";
    const addPointTagId = process.env.ADD_POINT_TAG_ID || "1258801833191669802";
    const boostedPointTagId =
      process.env.ADD_BOOSTED_POINT_TAG_ID || "1263873487953592381";

    const targetStartDate = new Date(year, month - 1, 1);
    const targetEndDate = new Date(year, month, 1);

    const startDateStr = `${targetStartDate.getFullYear()}-${String(
      targetStartDate.getMonth() + 1
    ).padStart(2, "0")}-01`;
    const endDateStr = `${targetEndDate.getFullYear()}-${String(
      targetEndDate.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const escapedUserId = `<@${user.id}>`;

    const channelQueryPart = selectedChannel ? `in:${selectedChannel} ` : "";

    const taskCompletedQuery = `before: ${endDateStr} after: ${startDateStr} ${channelQueryPart}<@&${taskCompletedTagId}> ${escapedUserId}`;
    const addPointQuery = `before: ${endDateStr} after: ${startDateStr} ${channelQueryPart}<@&${addPointTagId}> ${escapedUserId}`;
    const boostedPointQuery = `before: ${endDateStr} after: ${startDateStr} ${channelQueryPart}<@&${boostedPointTagId}> ${escapedUserId}`;

    await interaction.reply(
      `Here are your search queries:\n\n**Tasks completed:**\n\`\`\`${taskCompletedQuery}\`\`\`\n\n**Points obtained:**\n\`\`\`${addPointQuery}\`\`\`\n\n**Boosted Points obtained:**\n\`\`\`${boostedPointQuery}\`\`\``
    );
  },
};
