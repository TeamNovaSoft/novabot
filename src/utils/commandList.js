const pingCommand = require('../commands/utility/ping');
const assingMeTaskCommand = require('../commands/utility/assignMeTaskThread');
const changeStatusCommand = require('../commands/utility/changeStatus');
const convertTimeCommand = require('../commands/utility/convert-time');
const myPointsCommand = require('../commands/utility/my-points');
const prTemplateCommand = require('../commands/utility/pr-template');
const remindMeCommand = require('../commands/utility/remindme');
const requestPointCommand = require('../commands/utility/requestPoint');
const searchCodeCommand = require('../commands/utility/search-code-review');
const searchMyPointsCommand = require('../commands/utility/search-my-points');
const sendMessageCommand = require('../commands/utility/send-message');
const serverCommand = require('../commands/utility/server');
const userCommand = require('../commands/utility/user');
const votePointsCommand = require('../commands/utility/vote-points');

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
