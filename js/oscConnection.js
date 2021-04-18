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
      var openIDB = openIDBshortcut();
      openIDB.onupgradeneeded = function(evt){
        var db = evt.target.result;
        setTimeout(function(){
          var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
          requestPlayerInfo.onsuccess = function(playerInfo){
            db.close();
            udpPort.send({
              address: "/SendFromBridge/playerName",
              args: [
                  {
                      type: "s",
                      value: playerInfo.target.result[0].player_name
                  }
              ]
            }, "127.0.0.1", 9007);
          }
        },500);
      }
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
  } else if(event.address == "/SendToBridge/customMap/Save"){
    console.log(event.args[0]);
    var tempMapData = JSON.parse(event.args[0]);
    console.log(JSON.parse(event.args[0])); // UPDATE `communitymaps` SET `cm_mapData` = '{\"name\":\"BoasVover9000\",\"author\":\"tomzefk\",\"creationDate\":\"2021-3-4\"}' WHERE `communitymaps`.`cm_id` = 10;
    var openIDB = openIDBshortcut();
    openIDB.onupgradeneeded = function(evt){
      var db = evt.target.result;
      setTimeout(function(){
        var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
        requestPlayerInfo.onsuccess = function(playerInfo){
          db.close();
          connection.query("UPDATE communitymaps SET cm_mapData = '" + event.args[0] + "' WHERE cm_name = '" + tempMapData.levelName + "' AND cm_player_id = '" + playerInfo.target.result[0].player_id + "'", function (err, result) {
            console.log("Level Saved");
            console.log(result);
          });
        }
      },500)
    }
  } else if(event.address == "/SendToBridge/communitymaps/load/public"){
    var openIDB = openIDBshortcut();
    openIDB.onupgradeneeded = function(evt){
      var db = evt.target.result;
      setTimeout(function(){
        var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
        requestPlayerInfo.onsuccess = function(playerInfo){
          db.close();
          connection.query("SELECT cm_name, cm_code, player_name, cm_published FROM communitymaps LEFT JOIN players ON cm_player_id = player_id WHERE player_name != '" + playerInfo.target.result[0].player_name + "' LIMIT 10", function (err, result) {
            console.log(result);
            for (var i = 0; i < result.length; i++) {
              console.log(result[i]);
              udpPort.send({
                address: "/SendFromBridge/communitymaps/load/public",
                args: [
                    {
                        type: "s",
                        value: result[i].cm_name,
                    },
                    {
                        type: "s",
                        value: result[i].cm_code,
                    },
                    {
                        type: "s",
                        value: result[i].cm_published,
                    },
                    {
                        type: "s",
                        value: result[i].player_name,
                    }
                ]
              }, "127.0.0.1", 9007);
            }
          });
        }
      },500)
    }
  } else if(event.address == "/SendToBridge/communitymaps/load/private"){
    var openIDB = openIDBshortcut();
    openIDB.onupgradeneeded = function(evt){
      var db = evt.target.result;
      setTimeout(function(){
        var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
        requestPlayerInfo.onsuccess = function(playerInfo){
          db.close();
          connection.query("SELECT cm_name, cm_code, player_name, cm_published FROM communitymaps LEFT JOIN players ON cm_player_id = player_id WHERE player_name = '" + playerInfo.target.result[0].player_name + "' LIMIT 10", function (err, result) {
            console.log(result);
            for (var i = 0; i < result.length; i++) {
              console.log(result[i]);
              udpPort.send({
                address: "/SendFromBridge/communitymaps/load/public",
                args: [
                    {
                        type: "s",
                        value: result[i].cm_name,
                    },
                    {
                        type: "s",
                        value: result[i].cm_code,
                    },
                    {
                        type: "s",
                        value: result[i].cm_published,
                    },
                    {
                        type: "s",
                        value: result[i].player_name,
                    }
                ]
              }, "127.0.0.1", 9007);
            }
          });
        }
      },500)
    }
  } else if(event.address == "/SendToBridge/communitymaps/request"){
    console.log(event.args[0]);
    connection.query("SELECT cm_mapData FROM communitymaps WHERE cm_code = '" + event.args[0] + "'", function (err, result) {
      console.log(result);
      var customMap = JSON.parse(result[0].cm_mapData);
      udpPort.send({
        address: "/SendFromBridge/customMap/load/levelName",
        args: [
            {
                type: "s",
                value: customMap.levelName
            }
        ]
      }, "127.0.0.1", 9007);
      udpPort.send({
        address: "/SendFromBridge/customMap/load/levelAuthor",
        args: [
            {
                type: "s",
                value: customMap.levelAuthor
            }
        ]
      }, "127.0.0.1", 9007);
      udpPort.send({
        address: "/SendFromBridge/customMap/load/creationDate",
        args: [
            {
                type: "s",
                value: customMap.creationDate
            }
        ]
      }, "127.0.0.1", 9007);
      udpPort.send({
        address: "/SendFromBridge/customMap/load/nameCode",
        args: [
            {
                type: "s",
                value: customMap.levelName + "#" + event.args[0]
            }
        ]
      }, "127.0.0.1", 9007);
      //
      if(customMap.levelOpen){
        udpPort.send({
          address: "/SendFromBridge/customMap/load/levelOpen/position",
          args: [
              {
                  type: "s",
                  value: customMap.levelOpen.position.x
              },
              {
                type: "s",
                value: customMap.levelOpen.position.y
              },
              {
                type: "s",
                value: customMap.levelOpen.position.z
              },
          ]
        }, "127.0.0.1", 9007);
        udpPort.send({
          address: "/SendFromBridge/customMap/load/levelOpen/rotation",
          args: [
              {
                  type: "s",
                  value: customMap.levelOpen.rotation.x
              },
              {
                type: "s",
                value: customMap.levelOpen.rotation.y
              },
              {
                type: "s",
                value: customMap.levelOpen.rotation.z
              },
          ]
        }, "127.0.0.1", 9007);
      }
      //
      if(customMap.levelGoal){
        udpPort.send({
          address: "/SendFromBridge/customMap/load/levelGoal/position",
          args: [
              {
                  type: "s",
                  value: customMap.levelGoal.position.x
              },
              {
                type: "s",
                value: customMap.levelGoal.position.y
              },
              {
                type: "s",
                value: customMap.levelGoal.position.z
              },
          ]
        }, "127.0.0.1", 9007);
        udpPort.send({
          address: "/SendFromBridge/customMap/load/levelGoal/rotation",
          args: [
              {
                  type: "s",
                  value: customMap.levelGoal.rotation.x
              },
              {
                type: "s",
                value: customMap.levelGoal.rotation.y
              },
              {
                type: "s",
                value: customMap.levelGoal.rotation.z
              },
          ]
        }, "127.0.0.1", 9007);
        udpPort.send({
          address: "/SendFromBridge/customMap/load/levelGoal/scale",
          args: [
            {
                type: "s",
                value: customMap.levelGoal.scale.x
            },
            {
              type: "s",
              value: customMap.levelGoal.scale.y
            },
            {
              type: "s",
              value: customMap.levelGoal.scale.z
            },
          ]
        }, "127.0.0.1", 9007);
      }
      //
      if(customMap.movableCubes){
        for(i=0; i < customMap.movableCubes.length; i++){
          udpPort.send({
            address: "/SendFromBridge/customMap/load/movableCubes/position",
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
            address: "/SendFromBridge/customMap/load/movableCubes/rotation",
            args: [
                {
                    type: "s",
                    value: customMap.movableCubes[i].rotation.x
                },
                {
                  type: "s",
                  value: customMap.movableCubes[i].rotation.y
                },
                {
                  type: "s",
                  value: customMap.movableCubes[i].rotation.z
                },
            ]
          }, "127.0.0.1", 9007);
          udpPort.send({
            address: "/SendFromBridge/customMap/load/movableCubes/scale",
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
      }
      //
      if(customMap.fixedCubes){
        for(i=0; i < customMap.fixedCubes.length; i++){
          console.log(customMap.fixedCubes[i].position.z);
          udpPort.send({
            address: "/SendFromBridge/customMap/load/fixedCubes/position",
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
            address: "/SendFromBridge/customMap/load/fixedCubes/rotation",
            args: [
                {
                    type: "s",
                    value: customMap.fixedCubes[i].rotation.x
                },
                {
                  type: "s",
                  value: customMap.fixedCubes[i].rotation.y
                },
                {
                  type: "s",
                  value: customMap.fixedCubes[i].rotation.z
                },
            ]
          }, "127.0.0.1", 9007);
          udpPort.send({
            address: "/SendFromBridge/customMap/load/fixedCubes/scale",
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
      }
    })
  } else if(event.address == "/SendToBridge/communitymaps/create"){
    var openIDB = openIDBshortcut();
    openIDB.onupgradeneeded = function(evt){
      var db = evt.target.result;
      setTimeout(function(){
        var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
        requestPlayerInfo.onsuccess = function(playerInfo){
          db.close();
          connection.query("SELECT cm_name, cm_code, player_name FROM communitymaps LEFT JOIN players ON cm_player_id = player_id WHERE cm_name = '" + event.args[0] + "' AND player_name = '" + playerInfo.target.result[0].player_name + "'", function (err, result) {
            console.log(result);
            if(result.length == 0){
              var date = new Date();
              var newMapData = {
                "levelName": event.args[0],
                "levelAuthor": playerInfo.target.result[0].player_name,
                "creationDate": date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
              };
              connection.query("INSERT INTO communitymaps (cm_code, cm_name, cm_player_id, cm_creationDate, cm_mapData, cm_published) VALUES ('" + CryptoJS.MD5(playerInfo.target.result[0].player_name + event.args[0]).toString().substring(0, 6) + "', '" + event.args[0] + "', '" + playerInfo.target.result[0].player_id + "', '" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "', '" + JSON.stringify(newMapData) + "', '0')", function (err, result) {
                console.log(result);
                udpPort.send({
                  address: "/SendFromBridge/communitymaps/created",
                  args: [
                      {
                          type: "s",
                          value: CryptoJS.MD5(playerInfo.target.result[0].player_name + event.args[0]).toString().substring(0, 6)
                      }
                  ]
                }, "127.0.0.1", 9007);
              })
            } else {
              console.log("Map already exists");
              udpPort.send({
                address: "/SendFromBridge/communitymaps/error",
                args: [
                    {
                        type: "s",
                        value: "Map already exists"
                    }
                ]
              }, "127.0.0.1", 9007);
            }
          })
        }
      },500);
    }
  } else if(event.address == "/SendToBridge/communitymaps/delete"){ //
    connection.query("DELETE FROM communitymaps WHERE cm_code = '" + event.args[0] + "'", function (err, result) {
      console.log(result);
      console.log("Map deleted");
    })
  } else if(event.address == "/SendToBridge/communitymaps/publish"){ //
    var openIDB = openIDBshortcut();
    openIDB.onupgradeneeded = function(evt){
      var db = evt.target.result;
      setTimeout(function(){
        var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
        requestPlayerInfo.onsuccess = function(playerInfo){
          db.close();
          connection.query("UPDATE communitymaps SET cm_published = '1' WHERE cm_code = '" + event.args[0] + "' AND cm_player_id = '" + playerInfo.target.result[0].player_id + "'", function (err, result) {
            console.log("Level Published");
            console.log(result);
          });
        }
      },500)
    }
  } else if(event.address == "/SendToBridge/communitymaps/search"){ //
    var search = event.args[0];
    console.log(search);
    if(search.length > 3){
      if(search.includes("#")){
        var searchCode = search.substring(search.indexOf("#") + 1, 7);
        console.log(searchCode);
        connection.query("SELECT cm_name, cm_code, player_name, cm_published FROM communitymaps LEFT JOIN players ON cm_player_id = player_id WHERE cm_code = '" + searchCode + "'", function (err, result) {
          console.log(result);
          if(result.length == 1){
            udpPort.send({
              address: "/SendFromBridge/communitymaps/search/result",
              args: [
                  {
                      type: "s",
                      value: result[0].cm_name,
                  },
                  {
                      type: "s",
                      value: result[0].cm_code,
                  },
                  {
                      type: "s",
                      value: result[0].cm_published,
                  },
                  {
                      type: "s",
                      value: result[0].player_name,
                  }
              ]
            }, "127.0.0.1", 9007);
          }
        });
      } else {
        console.log(search);
        connection.query("SELECT cm_name, cm_code, player_name, cm_published FROM communitymaps LEFT JOIN players ON cm_player_id = player_id WHERE cm_name LIKE '%" + search + "%' LIMIT 10", function (err, result) {
          console.log(err);
          console.log(result);
          for (var i = 0; i < result.length; i++) {
            console.log(result[i]);
            udpPort.send({
              address: "/SendFromBridge/communitymaps/search/result",
              args: [
                  {
                      type: "s",
                      value: result[i].cm_name,
                  },
                  {
                      type: "s",
                      value: result[i].cm_code,
                  },
                  {
                      type: "s",
                      value: result[i].cm_published,
                  },
                  {
                      type: "s",
                      value: result[i].player_name,
                  }
              ]
            }, "127.0.0.1", 9007);
          }
        });
      }
    }
  }
})

udpPort.on("close", function(){
  console.log("Closed the connection between Bridge and Unreal!");
})




// let customMap = {
//   "name": "ExampleMap",
//   "author": "tomzefk",
//   "creationDate": "11-04-2021",
//   "levelOpen": {
//     "position": {
//       "x": 230,
//       "y": 500,
//       "z": 10,
//     },
//     "rotation": {
//       "x": 45,
//       "y": 45,
//       "z": 45,
//     }
//   },
//   "levelGoal": {
//     "position": {
//       "x": 1000,
//       "y": 1000,
//       "z": 400,
//     },
//     "rotation": {
//       "x": 0,
//       "y": 0,
//       "z": 90,
//     },
//     "scale": {
//       "x": 10,
//       "y": 10,
//       "z": 30,
//     }
//   },
//   "movableCubes": [
//     {
//       "position": {
//         "x": 70,
//         "y": 10,
//         "z": 5,
//       },
//       "rotation": {
//         "x": 0,
//         "y": 0,
//         "z": 0,
//       },
//       "scale": {
//         "x": 1,
//         "y": 1,
//         "z": 1,
//       }
//     }
//   ],
//   "fixedCubes": [
//     {
//       "position": {
//         "x": -200,
//         "y": -200,
//         "z": -200,
//       },
//       "rotation": {
//         "x": 45,
//         "y": 270,
//         "z": 90,
//       },
//       "scale": {
//         "x": 4,
//         "y": 4,
//         "z": 1,
//       }
//     },
//     {
//       "position": {
//         "x": 800,
//         "y": 800,
//         "z": 800,
//       },
//       "rotation": {
//         "x": 45,
//         "y": 45,
//         "z": 45,
//       },
//       "scale": {
//         "x": 2,
//         "y": 2,
//         "z": 1,
//       }
//     }
//   ]
// };
//
// testingSwitch = function(){
//
//   console.log(customMap);
//
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/name",
//     args: [
//         {
//             type: "s",
//             value: customMap.name
//         }
//     ]
//   }, "127.0.0.1", 9007);
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/author",
//     args: [
//         {
//             type: "s",
//             value: customMap.author
//         }
//     ]
//   }, "127.0.0.1", 9007);
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/creationDate",
//     args: [
//         {
//             type: "s",
//             value: customMap.creationDate
//         }
//     ]
//   }, "127.0.0.1", 9007);
//   //
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/levelOpen/position",
//     args: [
//         {
//             type: "s",
//             value: customMap.levelOpen.position.x
//         },
//         {
//           type: "s",
//           value: customMap.levelOpen.position.y
//         },
//         {
//           type: "s",
//           value: customMap.levelOpen.position.z
//         },
//     ]
//   }, "127.0.0.1", 9007);
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/levelOpen/rotation",
//     args: [
//         {
//             type: "s",
//             value: customMap.levelOpen.rotation.x
//         },
//         {
//           type: "s",
//           value: customMap.levelOpen.rotation.y
//         },
//         {
//           type: "s",
//           value: customMap.levelOpen.rotation.z
//         },
//     ]
//   }, "127.0.0.1", 9007);
//   //
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/levelGoal/position",
//     args: [
//         {
//             type: "s",
//             value: customMap.levelGoal.position.x
//         },
//         {
//           type: "s",
//           value: customMap.levelGoal.position.y
//         },
//         {
//           type: "s",
//           value: customMap.levelGoal.position.z
//         },
//     ]
//   }, "127.0.0.1", 9007);
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/levelGoal/rotation",
//     args: [
//         {
//             type: "s",
//             value: customMap.levelGoal.rotation.x
//         },
//         {
//           type: "s",
//           value: customMap.levelGoal.rotation.y
//         },
//         {
//           type: "s",
//           value: customMap.levelGoal.rotation.z
//         },
//     ]
//   }, "127.0.0.1", 9007);
//   udpPort.send({
//     address: "/SendFromBridge/customMap/load/levelGoal/scale",
//     args: [
//       {
//           type: "s",
//           value: customMap.levelGoal.scale.x
//       },
//       {
//         type: "s",
//         value: customMap.levelGoal.scale.y
//       },
//       {
//         type: "s",
//         value: customMap.levelGoal.scale.z
//       },
//     ]
//   }, "127.0.0.1", 9007);
//   //
//   for(i=0; i < customMap.movableCubes.length; i++){
//     udpPort.send({
//       address: "/SendFromBridge/customMap/load/movableCubes/position",
//       args: [
//           {
//               type: "s",
//               value: customMap.movableCubes[i].position.x
//           },
//           {
//             type: "s",
//             value: customMap.movableCubes[i].position.y
//           },
//           {
//             type: "s",
//             value: customMap.movableCubes[i].position.z
//           },
//       ]
//     }, "127.0.0.1", 9007);
//     udpPort.send({
//       address: "/SendFromBridge/customMap/load/movableCubes/rotation",
//       args: [
//           {
//               type: "s",
//               value: customMap.movableCubes[i].rotation.x
//           },
//           {
//             type: "s",
//             value: customMap.movableCubes[i].rotation.y
//           },
//           {
//             type: "s",
//             value: customMap.movableCubes[i].rotation.z
//           },
//       ]
//     }, "127.0.0.1", 9007);
//     udpPort.send({
//       address: "/SendFromBridge/customMap/load/movableCubes/scale",
//       args: [
//         {
//             type: "s",
//             value: customMap.movableCubes[i].scale.x
//         },
//         {
//           type: "s",
//           value: customMap.movableCubes[i].scale.y
//         },
//         {
//           type: "s",
//           value: customMap.movableCubes[i].scale.z
//         },
//       ]
//     }, "127.0.0.1", 9007);
//   }
//   for(i=0; i < customMap.fixedCubes.length; i++){
//     udpPort.send({
//       address: "/SendFromBridge/customMap/load/fixedCubes/position",
//       args: [
//           {
//               type: "s",
//               value: customMap.fixedCubes[i].position.x
//           },
//           {
//             type: "s",
//             value: customMap.fixedCubes[i].position.y
//           },
//           {
//             type: "s",
//             value: customMap.fixedCubes[i].position.z
//           },
//       ]
//     }, "127.0.0.1", 9007);
//     udpPort.send({
//       address: "/SendFromBridge/customMap/load/fixedCubes/rotation",
//       args: [
//           {
//               type: "s",
//               value: customMap.fixedCubes[i].rotation.x
//           },
//           {
//             type: "s",
//             value: customMap.fixedCubes[i].rotation.y
//           },
//           {
//             type: "s",
//             value: customMap.fixedCubes[i].rotation.z
//           },
//       ]
//     }, "127.0.0.1", 9007);
//     udpPort.send({
//       address: "/SendFromBridge/customMap/load/fixedCubes/scale",
//       args: [
//         {
//             type: "s",
//             value: customMap.fixedCubes[i].scale.x
//         },
//         {
//           type: "s",
//           value: customMap.fixedCubes[i].scale.y
//         },
//         {
//           type: "s",
//           value: customMap.fixedCubes[i].scale.z
//         },
//       ]
//     }, "127.0.0.1", 9007);
//   }
// };






toggleBridge = function(){
  var setting = $("#setting-bridge-connection .setting-toggle path");
  if($(setting).attr("d") == connections.bridge.status.activated.path){
    serverClose();
  } else {
    // Bridge to PWA
    server = https.createServer({
      cert: fs.readFileSync('cert/cert.pem'), // resources/
      key: fs.readFileSync('cert/key.pem')
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

        // udpPort.open();
        // udpPort.on("open", function(){
        //   console.log("Opened connection to Unreal");
        //   console.log("Waiting for Unreal to connect...");
        // });

        // udpPort.on("message", function(event){
        //   console.log(event);
        //   if(event.address == "/SendToBridge/playerPos"){
        //     console.log("Received: " + event.args[0]);
        //     console.log("Sending player position to PWA!");
        //     socketPort.send({
        //         address: "/SendFromBridge/UnrealPlayerPos",
        //         args: [event.args[0]]
        //     }, socket._socket.remoteAddress, socket._socket.remotePort);
        //   } else if(event.address == "/SendToBridge/connection"){
        //     var messageFromUnreal = event.args[0];
        //     console.log("Received: " + messageFromUnreal);
        //     if(messageFromUnreal == "Ready"){
        //       console.log("A connection between Unreal and Bridge has been established!");
        //       isUnrealConnectionReady = true;
        //       socketPort.send({
        //           address: "/SendFromBridge/UnrealConnection",
        //           args: [messageFromUnreal]
        //       }, socket._socket.remoteAddress, socket._socket.remotePort);
        //     };
        //   }
        // })
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
