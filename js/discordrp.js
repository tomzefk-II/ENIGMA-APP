const client = require('discord-rich-presence/browser')('782375096009359390');

updateDiscord = function(state, details, startTimestamp, endTimestamp, largeImageKey, smallImageKey, instance){
  client.on('connected', () => {
    console.log('connected!');
    client.updatePresence({
      state: state,
      details: details,
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      largeImageKey: largeImageKey,
      smallImageKey: smallImageKey,
      instance: instance,
    });
  });
}
