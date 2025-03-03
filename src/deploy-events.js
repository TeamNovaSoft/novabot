const guildScheduledEventCreate = require('./events/guildScheduledEventCreate');
const interactionCreateEvent = require('./events/interactionCreate');
const pollVotationResultEvent = require('./events/pollVotationResults');
const qaMetionEvent = require('./events/qaMention');
const readyEvent = require('./events/ready');

const eventList = [
  guildScheduledEventCreate,
  interactionCreateEvent,
  pollVotationResultEvent,
  qaMetionEvent,
  readyEvent,
];

module.exports = (client) => {
  for (const event of eventList) {
    const eventHandler = (...args) => event.execute(client, ...args);

    if (event.once) {
      client.once(event.name, eventHandler);
    } else {
      client.on(event.name, eventHandler);
    }
  }
};
