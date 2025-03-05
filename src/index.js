require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { DISCORD_SERVER } = require('./config');
const deployEvents = require('./events/deploy-events');
const deployCommands = require('./commands/deploy-commands');
const saveErrorLog = require('./utils/log-error');
const { sendErrorToChannel } = require('./utils/send-error');
const { scheduleJobs } = require('./schedule-jobs');

async function startClientBot(client) {
  client.commands = new Collection();
  deployCommands(client);
  deployEvents(client);

  await client.login(token);
  scheduleJobs(client);
}

function handleCriticalError(error) {
  saveErrorLog(error);
  sendErrorToChannel(client, error);
}

const token = DISCORD_SERVER.discordToken;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});
client.commands = new Collection();

process.on('uncaughtException', (error) => {
  handleCriticalError(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  handleCriticalError(reason);
});

startClientBot(client);
