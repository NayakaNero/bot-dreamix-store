module.exports = {
  name: "ban",
  execute(message, args) {
    if (!message.member.permissions.has("BanMembers")) return;

    const user = message.mentions.users.first();
    if (!user) return message.reply("Tag user");

    message.guild.members.ban(user);
    message.channel.send("User diban");
  }
};