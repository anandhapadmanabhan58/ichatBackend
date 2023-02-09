const asyncHandler = require('express-async-handler');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');

const accessChat = asyncHandler(async (req, res, next) => {
  const { userID } = req.body;

  if (!userID) {
    console.log('userID not send');
    return res.sendStatusCode(400);
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user.id } } },
      { users: { $elemMatch: { $eq: userID } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name email pic',
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    let chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user.id, userID],
    };

    try {
      const createdChat = await Chat.create(chatData);

      const Fullchat = await Chat.findOne({ _id: createdChat._id }).populate(
        'users',
        '-password'
      );
      res.status(200).send(Fullchat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

const fetchChats = asyncHandler(async (req, res, next) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name email pic',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createGroupChat = asyncHandler(async (req, res, next) => {
  if (!req.body.users || !req.body.name) {
    res.status(400).send({
      message: 'fill the details',
    });
  }

  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    res.send(400).send({ message: 'more than 2 users required' });
  }

  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fetchedGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fetchedGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const renameGroup = asyncHandler(async (req, res, next) => {
  const { chatId, chatName } = req.body;

  const updateGroupName = await Chat.findByIdAndUpdate(
    { _id: chatId },
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');
  if (!updateGroupName) {
    res.status(400).json({
      message: 'No chat',
    });
    return;
  }
  res.status(200).json(updateGroupName);
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const groupAdd = await Chat.findByIdAndUpdate(
    {
      _id: chatId,
    },
    {
      $addToSet: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!groupAdd) {
    res.send(400).json({ message: 'Invalid' });
    return;
  }
  res.status(200).json(groupAdd);
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removeUser = await Chat.findByIdAndUpdate(
    {
      _id: chatId,
    },
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');
  if (!removeUser) {
    res.status(400).json({ message: 'user not removed' });
    return;
  }
  res.status(200).json(removeUser);
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
