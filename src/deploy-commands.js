const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { DISCORD_SERVER } = require('./config');

function loadCommands(commands, client) {
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}

module.exports = (client) => {
  const commands = [];
  const token = DISCORD_SERVER.discordToken;
  const clientId = DISCORD_SERVER.discordClientId;
  const guildId = DISCORD_SERVER.discordGuildId;

  loadCommands(commands, client);

  const rest = new REST().setToken(token);

  const init = async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
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
};
