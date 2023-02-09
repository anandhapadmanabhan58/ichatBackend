const express = require('express');
const { checkJWT } = require('../middlewares/auth');
const {
  registerUser,
  authUser,
  allUsers,
} = require('../controllers/userController');

const router = express.Router();

router.route('/').post(registerUser).get(checkJWT, allUsers);
router.post('/login', authUser);

module.exports = router;
