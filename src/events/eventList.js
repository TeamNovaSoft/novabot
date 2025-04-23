const guildScheduledEventCreate = require('./guildScheduledEventCreate');
const interactionCreateEvent = require('./interactionCreate');
const listenPullRequestOpenMessage = require('./listenPullRequestOpenMessage');
const pollVotationResultUpdateEvent = require('./pollVotationResultsUpdate');
const qaMetionEvent = require('./qaMention');
const readyEvent = require('./ready');
const changeStatusEvent = require('./change-status-event');

const eventList = [
  guildScheduledEventCreate,
  interactionCreateEvent,
  pollVotationResultUpdateEvent,
  qaMetionEvent,
  readyEvent,
  changeStatusEvent,
  listenPullRequestOpenMessage,
];
module.exports = eventList;
