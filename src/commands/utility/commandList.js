const pingCommand = require('./ping');
const assingMeTaskCommand = require('./assignMeTaskThread');
const changeStatusCommand = require('./changeStatus');
const convertTimeCommand = require('./convert-time');
const myPointsCommand = require('./my-points');
const prTemplateCommand = require('./pr-template');
const remindMeCommand = require('./remindme');
const requestPointCommand = require('./requestPoint');
const searchCodeCommand = require('./search-code-review');
const searchMyPointsCommand = require('./search-my-points');
const sendMessageCommand = require('./send-message');
const serverCommand = require('./server');
const userCommand = require('./user');
const votePointsCommand = require('./vote-points');

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
module.exports = commandList;
