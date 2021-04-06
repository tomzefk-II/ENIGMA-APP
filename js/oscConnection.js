const WebSocket = require("ws");
const osc = require("osc")
const https = require("https")
const fs = require("fs")
let server;
let wss;
let socketPort;
let pwa = {
  ip: null,
  port: null,
  version: null,
  player_id: null,
};

let isUnrealConnectionReady = false;
let isPWAConnectionReady = false;
let isBridgeToUnrealConnectionReady = false;


// Bridge to Unreal
var udpPort = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: 9008
});





openUDPPortToUnreal = function(){
  console.log("Trying to open UDP port");
  udpPort.open();
}

udpPort.on("open", function(){
  console.log("Opened connection to Unreal");
  console.log("Waiting for Unreal to connect...");
});

udpPort.on("message", function(event){
  // console.log(event);
  var messageFromUnreal = event.args[0];
  if(event.address == "/SendToBridge/connection"){
    if(messageFromUnreal == "Connected"){
      console.log("Unreal connected to Bridge!");
      isUnrealConnectionReady = true;
      udpPort.send({
        address: "/SendFromBridge/connection",
        args: [
            {
                type: "s",
                value: "Connected"
            }
        ]
      }, "127.0.0.1", 9007);
      if(isPWAConnectionReady == true){
        udpPort.send({
          address: "/SendFromBridge/pwaConnection",
          args: [
              {
                  type: "s",
                  value: "Connected"
              }
          ]
        }, "127.0.0.1", 9007);
      }
    } else if(messageFromUnreal == "Closing"){
      console.log("Unreal is closing!");
      udpPort.close();
    }
  } else if(event.address == "/SendToBridge/bridgeConnection"){
    if(messageFromUnreal == "Connected"){
      console.log("Bridge connected to Unreal!");
      isBridgeToUnrealConnectionReady = true;
    }
  } else if(event.address == "/SendToBridge/playerPos"){
    // console.log("Received player position");
    if(isPWAConnectionReady == true){
      // console.log("Sending player position to PWA!");
      socketPort.send({
          address: "/SendFromBridge/UnrealPlayerPos",
          args: [event.args[0]]
      }, pwa.ip, pwa.port);
    } else {
      console.log("PWA is not connected!");
    }
  } else if(event.address == "/SendToBridge/playerHint"){
    // console.log("Received player hint");
    if(isPWAConnectionReady == true){
      // console.log("Sending player hint to PWA!");
      socketPort.send({
          address: "/SendFromBridge/playerHint",
          args: [event.args[0]]
      }, pwa.ip, pwa.port);
    } else {
      console.log("PWA is not connected!");
    }
  } else if(event.address == "/SendToBridge/MoveScaleObjsPos"){
    // console.log("Received cube position");
    if(isPWAConnectionReady == true){
      // console.log("Sending cube position to PWA!");
      socketPort.send({
          address: "/SendFromBridge/MoveScaleObjsPos",
          args: [event.args[0]]
      }, pwa.ip, pwa.port);
    } else {
      console.log("PWA is not connected!");
    }

  } else if(event.address == "/SendToBridge/fixedObjsPos"){
    // console.log("Received cube position");
    if(isPWAConnectionReady == true){
      // console.log("Sending cube position to PWA!");
      socketPort.send({
          address: "/SendFromBridge/fixedObjsPos",
          args: [event.args[0]]
      }, pwa.ip, pwa.port);
    } else {
      console.log("PWA is not connected!");
    }

  }
})

udpPort.on("close", function(){
  console.log("Closed the connection between Bridge and Unreal!");
})



let customMap = {
  "author": "tomzefk",
  "creationDate": "02-04-2021",
  "playerStart": {
    "position": {
      "x": 230,
      "y": 500,
      "z": 10,
    },
    "rotation": {
      "z": 45,
    }
  },
  "levelEnd": {
    "position": {
      "x": 1000,
      "y": 1000,
      "z": 400,
    },
    "rotation": {
      "z": 90,
    },
    "scale": {
      "x": 10,
      "y": 10,
      "z": 30,
    }
  },
  "fixedCubes": [
    {
      "position": {
        "x": 250,
        "y": 250,
        "z": 250,
      },
      "rotation": {
        "z": 45,
      },
      "scale": {
        "x": 2,
        "y": 3,
        "z": 5,
      }
    },
    {
      "position": {
        "x": -250,
        "y": -250,
        "z": 250,
      },
      "rotation": {
        "z": 270,
      },
      "scale": {
        "x": 5,
        "y": 5,
        "z": 5,
      }
    }
  ],
  "movableCubes": [
    {
      "position": {
        "x": 70,
        "y": 10,
        "z": 5,
      },
      "rotation": {
        "z": 0,
      },
      "scale": {
        "x": 1,
        "y": 1,
        "z": 1,
      }
    }
  ]
};

testingSwitch = function(){

  console.log(customMap);

  udpPort.send({
    address: "/SendFromBridge/customMap/author",
    args: [
        {
            type: "s",
            value: customMap.author
        }
    ]
  }, "127.0.0.1", 9007);
  udpPort.send({
    address: "/SendFromBridge/customMap/creationDate",
    args: [
        {
            type: "s",
            value: customMap.creationDate
        }
    ]
  }, "127.0.0.1", 9007);
  //
  udpPort.send({
    address: "/SendFromBridge/customMap/playerStart/position",
    args: [
        {
            type: "s",
            value: customMap.playerStart.position.x
        },
        {
          type: "s",
          value: customMap.playerStart.position.y
        },
        {
          type: "s",
          value: customMap.playerStart.position.z
        },
    ]
  }, "127.0.0.1", 9007);
  udpPort.send({
    address: "/SendFromBridge/customMap/playerStart/rotation",
    args: [
        {
            type: "s",
            value: customMap.playerStart.rotation.z
        }
    ]
  }, "127.0.0.1", 9007);
  //
  udpPort.send({
    address: "/SendFromBridge/customMap/levelEnd/position",
    args: [
        {
            type: "s",
            value: customMap.levelEnd.position.x
        },
        {
          type: "s",
          value: customMap.levelEnd.position.y
        },
        {
          type: "s",
          value: customMap.levelEnd.position.z
        },
    ]
  }, "127.0.0.1", 9007);
  udpPort.send({
    address: "/SendFromBridge/customMap/levelEnd/rotation",
    args: [
        {
            type: "s",
            value: customMap.levelEnd.rotation.z
        }
    ]
  }, "127.0.0.1", 9007);
  udpPort.send({
    address: "/SendFromBridge/customMap/levelEnd/scale",
    args: [
      {
          type: "s",
          value: customMap.levelEnd.scale.x
      },
      {
        type: "s",
        value: customMap.levelEnd.scale.y
      },
      {
        type: "s",
        value: customMap.levelEnd.scale.z
      },
    ]
  }, "127.0.0.1", 9007);
  //
  for(i=0; i < customMap.fixedCubes.length; i++){
    udpPort.send({
      address: "/SendFromBridge/customMap/fixedCubes/position",
      args: [
          {
              type: "s",
              value: customMap.fixedCubes[i].position.x
          },
          {
            type: "s",
            value: customMap.fixedCubes[i].position.y
          },
          {
            type: "s",
            value: customMap.fixedCubes[i].position.z
          },
      ]
    }, "127.0.0.1", 9007);
    udpPort.send({
      address: "/SendFromBridge/customMap/fixedCubes/rotation",
      args: [
          {
              type: "s",
              value: customMap.fixedCubes[i].rotation.z
          }
      ]
    }, "127.0.0.1", 9007);
    udpPort.send({
      address: "/SendFromBridge/customMap/fixedCubes/scale",
      args: [
        {
            type: "s",
            value: customMap.fixedCubes[i].scale.x
        },
        {
          type: "s",
          value: customMap.fixedCubes[i].scale.y
        },
        {
          type: "s",
          value: customMap.fixedCubes[i].scale.z
        },
      ]
    }, "127.0.0.1", 9007);
  }
  //
  for(i=0; i < customMap.movableCubes.length; i++){
    udpPort.send({
      address: "/SendFromBridge/customMap/movableCubes/position",
      args: [
          {
              type: "s",
              value: customMap.movableCubes[i].position.x
          },
          {
            type: "s",
            value: customMap.movableCubes[i].position.y
          },
          {
            type: "s",
            value: customMap.movableCubes[i].position.z
          },
      ]
    }, "127.0.0.1", 9007);
    udpPort.send({
      address: "/SendFromBridge/customMap/fixedCubes/rotation",
      args: [
          {
              type: "s",
              value: customMap.movableCubes[i].rotation.z
          }
      ]
    }, "127.0.0.1", 9007);
    udpPort.send({
      address: "/SendFromBridge/customMap/fixedCubes/scale",
      args: [
        {
            type: "s",
            value: customMap.movableCubes[i].scale.x
        },
        {
          type: "s",
          value: customMap.movableCubes[i].scale.y
        },
        {
          type: "s",
          value: customMap.movableCubes[i].scale.z
        },
      ]
    }, "127.0.0.1", 9007);
  }
};






toggleBridge = function(){
  var setting = $("#setting-bridge-connection .setting-toggle path");
  if($(setting).attr("d") == connections.bridge.status.activated.path){
    serverClose();
  } else {
    // Bridge to PWA
    server = https.createServer({
      cert: fs.readFileSync('resources/cert/cert.pem'), // resources/
      key: fs.readFileSync('resources/cert/key.pem')
    });
    wss = new WebSocket.Server({ server });
    server.listen(9010);
    server.maxConnections = 1;

    console.log("Bridge activated");
    wss.on("listening", function () {
      console.log("listening");
      $(setting).attr("d", connections.bridge.status.activated.path);
      updateConnectionStatus("bridge-connection", "warningConnection", null);
    });

    wss.on("connection", function (socket) {
      socketPort = new osc.WebSocketPort({
          socket: socket,
          metadata: false
      });

      pwa.ip = socket._socket.remoteAddress;
      pwa.port = socket._socket.remotePort;
      console.log(pwa);

      console.log("WebSocket Connection received");
      updateConnectionStatus("bridge-connection", "goodConnection", null);

      socketPort.on("message", function (oscMsg) {
        console.log("An OSC Message was received!");
        console.log(oscMsg);
        if(oscMsg.address == "/playerInfo"){
          let receivedPlayerInfo = JSON.parse(oscMsg.args[0]);
          console.log("Received player info");
          console.log(receivedPlayerInfo.player_id);
          if(receivedPlayerInfo.player_id !== playerinfo.player_id){
            var reason = "Connected client has not the same player ID!";
            var errorCode = 4001;
            console.log(errorCode + ": " + reason);
            for(const client of wss.clients){
              client.close(errorCode, reason);
              console.log("Client Kicked!");
            }
            pwa.player_id = null;
          } else {
            console.log("Same player id");
            pwa.player_id = receivedPlayerInfo.player_id;
          }
        } else if(oscMsg.address == "/pwaVersion"){
          var currentVersion = version.innerText;
          var receivedVersion = oscMsg.args[0];
          console.log("Received PWA version info");
          if(receivedVersion !== currentVersion) {
            var reason = "Connected client has not the same app version!";
            var errorCode = 4002;
            console.log(errorCode + ": " + reason);
            for(const client of wss.clients){
              client.close(errorCode, reason);
              console.log("Client Kicked!");
            }
            pwa.version = null;
          } else {
            console.log("Same app version");
            pwa.version = receivedVersion;
          }
        }
        if(pwa.player_id !== null && pwa.version !== null){
          isPWAConnectionReady = true;
          console.log("A Bridge connection to PWA was successfully made!");
          console.log("Preparing for sending PWA ");
          if(isUnrealConnectionReady == false){
            console.log("Unreal is not connected to the Bridge yet. Waiting...");
          } else {
            console.log("Preparing for sending player position to PWA");
            udpPort.send({
              address: "/SendFromBridge/pwaConnection",
              args: [
                  {
                      type: "s",
                      value: "Ready"
                  }
              ]
            }, "127.0.0.1", 9007);
          }

        }
      });

      socketPort.on("close", function(socket){
        pwa.player_id = null
        pwa.version = null
        isPWAConnectionReady = false;
        udpPort.send({
          address: "/SendFromBridge/pwaConnection",
          args: [
              {
                  type: "s",
                  value: "Disconnected"
              }
          ]
        }, "127.0.0.1", 9007);
        console.log("Client disconnected");
        updateConnectionStatus("bridge-connection", "warningConnection", null);
        //
      });

      openUnrealToBridge = function(){
        console.log("Trying to open UDP port");
        var udpPort = new osc.UDPPort({
            localAddress: "127.0.0.1",
            localPort: 9008
        });

        udpPort.open();
        udpPort.on("open", function(){
          console.log("Opened connection to Unreal");
          console.log("Waiting for Unreal to connect...");
        });

        udpPort.on("message", function(event){
          console.log(event);
          if(event.address == "/SendToBridge/playerPos"){
            console.log("Received: " + event.args[0]);
            console.log("Sending player position to PWA!");
            socketPort.send({
                address: "/SendFromBridge/UnrealPlayerPos",
                args: [event.args[0]]
            }, socket._socket.remoteAddress, socket._socket.remotePort);
          } else if(event.address == "/SendToBridge/connection"){
            var messageFromUnreal = event.args[0];
            console.log("Received: " + messageFromUnreal);
            if(messageFromUnreal == "Ready"){
              console.log("A connection between Unreal and Bridge has been established!");
              isUnrealConnectionReady = true;
              socketPort.send({
                  address: "/SendFromBridge/UnrealConnection",
                  args: [messageFromUnreal]
              }, socket._socket.remoteAddress, socket._socket.remotePort);
            };
          }
        })
      }

    });



    serverClose = function(){
      console.log("Bridge disabled");
      $(setting).attr("d", connections.bridge.status.disabled.path);
      console.log(wss.clients);
      var reason = "Server is closing!";
      var errorCode = 4000;
      console.log(errorCode + ": " + reason);
      for(const client of wss.clients){
        client.close(errorCode, reason);
        console.log("Client Kicked!");
      }
      wss.close();
      server.close();
      wss.on("close", function(){
        console.log("wss closed");
      })
      server.on("close", function(){
        console.log("server closed");
      })
      setTimeout(function(){
        wss = undefined;
        server = undefined;
        socketPort = undefined;
        updateConnectionStatus("bridge-connection", "errorConnection", "disabled");
      },500)
    }
  }
}
