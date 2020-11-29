const ws = require('ws')
const dgram = require('dgram')
const OSC = require('osc-js')
const osc = new OSC({ plugin: new OSC.WebsocketServerPlugin() })
osc.open({ host: "192.168.1.85", port: 9010 });
osc.on('open', () => {
  console.log("Opened");
})
osc.on('/SendToBridge', message => {
  console.log(message.address);
  console.log(message.args[0]);
  console.log(parseFloat(message.args[0]));

  const oscUDP = new OSC({ plugin: new OSC.DatagramPlugin() })
  oscUDP.open({ port: 9011 })
  oscUDP.on('open', () => {
    const socket = dgram.createSocket('udp4')
    console.log(parseFloat(message.args[0]));
    oscUDP.send(new OSC.Message('/SendToUE4', message.args[0]), { port: 9005 })
  })
})
