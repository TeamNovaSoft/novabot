const { REST, Routes } = require('discord.js');
const { DISCORD_SERVER } = require('./config');
const commandList = require('./utils/commandList');

function registerCommands(client) {
  // Build the array of commands using reduce
  const commands = commandList.reduce((acc, command) => {
    if (!command?.data || !command?.execute) {
      throw new Error(
        `The command ${command.name || command} is missing a required "data" or "execute" property.`
      );
    }
    acc.push(command.data.toJSON());
    return acc;
  }, []);

  // Delegate both the deployment to Discord and the assignment of commands to the client
  deployCommands(client, commandList, commands);
}

function deployCommands(client, commandList, commands) {
  // Assign each command to the client's collection
  commandList.forEach((command) => {
    client.commands.set(command.data.name, command);
  });

  const rest = new REST().setToken(DISCORD_SERVER.discordToken);

  const init = async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );
      const data = await rest.put(
        Routes.applicationGuildCommands(
          DISCORD_SERVER.discordClientId,
          DISCORD_SERVER.discordGuildId
        ),
        { body: commands }
      );
      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      console.error(error);
    }
  };

  init();
}

module.exports = registerCommands;
