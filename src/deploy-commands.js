const { REST, Routes } = require('discord.js');
const { DISCORD_SERVER } = require('./config');

const pingCommand = require('./commands/utility/ping');
const assingMeTaskCommand = require('./commands/utility/assignMeTaskThread');
const changeStatusCommand = require('./commands/utility/changeStatus');
const convertTimeCommand = require('./commands/utility/convert-time');
const myPointsCommand = require('./commands/utility/my-points');
const prTemplateCommand = require('./commands/utility/pr-template');
const remindMeCommand = require('./commands/utility/remindme');
const requestPointCommand = require('./commands/utility/requestPoint');
const searchCodeCommand = require('./commands/utility/search-code-review');
const searchMyPointsCommand = require('./commands/utility/search-my-points');
const sendMessageCommand = require('./commands/utility/send-message');
const serverCommand = require('./commands/utility/server');
const userCommand = require('./commands/utility/user');
const votePointsCommand = require('./commands/utility/vote-points');

const commandList = [
  pingCommand,
  assingMeTaskCommand,
  changeStatusCommand,
  convertTimeCommand,
  myPointsCommand,
  prTemplateCommand,
  remindMeCommand,
  requestPointCommand,
  searchCodeCommand,
  searchMyPointsCommand,
  sendMessageCommand,
  serverCommand,
  userCommand,
  votePointsCommand,
];

function registerCommands(client) {
  const commands = [];

  for (const command of commandList) {
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      client.commands.set(command.data.name, command);
    } else {
      // This stops the execution and alerts that a misconfigured command has been imported.
      throw new Error(
        `The command ${command.name || command} is missing a required "data" or "execute" property.`
      );
    }
  }

  deployCommands(commands);
}

function deployCommands(commands) {
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
