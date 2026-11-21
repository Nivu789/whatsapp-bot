const conversations = new Map();

const getConversation = (phone) => {
  return conversations.get(phone);
};

const setConversation = (phone, data) => {
  conversations.set(phone, data);
};

const clearConversation = (phone) => {
  conversations.delete(phone);
};

module.exports = {
  getConversation,
  setConversation,
  clearConversation,
};