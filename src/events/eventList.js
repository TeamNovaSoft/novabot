const guildScheduledEventCreate = require('./guildScheduledEventCreate');
const interactionCreateEvent = require('./interactionCreate');
const pollVotationResultEvent = require('./pollVotationResults');
const qaMetionEvent = require('./qaMention');
const readyEvent = require('./ready');

const eventList = [
  guildScheduledEventCreate,
  interactionCreateEvent,
  pollVotationResultEvent,
  qaMetionEvent,
  readyEvent,
];
module.exports = eventList;
