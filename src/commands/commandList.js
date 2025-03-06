const pingCommand = require('./utility/ping');
const assingMeTaskCommand = require('./utility/assignMeTaskThread');
const changeStatusCommand = require('./utility/changeStatus');
const convertTimeCommand = require('./utility/convert-time');
const myPointsCommand = require('./utility/my-points');
const prTemplateCommand = require('./utility/pr-template');
const remindMeCommand = require('./utility/remindme');
const requestPointCommand = require('./utility/requestPoint');
const searchCodeCommand = require('./utility/search-code-review');
const searchMyPointsCommand = require('./utility/search-my-points');
const sendMessageCommand = require('./utility/send-message');
const serverCommand = require('./utility/server');
const userCommand = require('./utility/user');
const votePointsCommand = require('./utility/vote-points');

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
