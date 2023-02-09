const express = require('express');
const { checkJWT } = require('../middlewares/auth');
const {
  sendMessage,
  allMessages,
} = require('../controllers/messageControllers');

const router = express.Router();

router.route('/').post(checkJWT, sendMessage);
router.route('/:chatId').get(checkJWT, allMessages);

module.exports = router;
