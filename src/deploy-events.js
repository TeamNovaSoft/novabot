const eventList = require('./utils/eventList');

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
