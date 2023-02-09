const express = require('express');
const { checkJWT } = require('../middlewares/auth');
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require('../controllers/chatControllers');
const router = express.Router();

router.route('/').post(checkJWT, accessChat).get(checkJWT, fetchChats);
router.route('/group').post(checkJWT, createGroupChat);
router.route('/rename').patch(checkJWT, renameGroup);
router.route('/removegroup').patch(checkJWT, removeFromGroup);
router.route('/groupadd').patch(checkJWT, addToGroup);

module.exports = router;
