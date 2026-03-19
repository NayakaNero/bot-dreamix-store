module.exports = {
  name: "clear",
  async execute(message, args) {
    const amount = parseInt(args[0]);

    if (!amount) return;

    await message.channel.bulkDelete(amount);
  }
};