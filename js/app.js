const { ipcRenderer } = require('electron');
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
var $, jQuery;
$ = jQuery = require('jquery');
var mysql = require('mysql');

let ObjectStores = [
  {
    OSName: "players",
    OSIndex: ["player_id", "player_name", "player_isBetaTester", "player_level"]
  },
  {
    OSName: "quests",
    OSIndex: ["quest_id", "quest_name", "quest_minLevel"]
  },
  {
    OSName: "settings",
    OSIndex: ["setting_id", "theme"]
  }
];

var connection = mysql.createConnection({
  host     : '45.87.81.77', // 45.87.81.77
  user     : 'u501538363_players',
  password : 'Enigma_Players_123',
  database : 'u501538363_enigma'
});

var error;
initLoadingBarValue = function(value){
  var loadingBarPercentage = document.getElementById("loadingBarPercentage");
  var loadingBar = document.getElementById("loadingBar");
  if(error !== 1){
    if(value == "error"){
      error = 1;
      loadingBar.style.width = "90%";
      loadingBar.style.borderColor = "red";
      loadingBarPercentage.innerHTML = "An error occurred!";
    } else if(value == "reloading"){
      loadingBar.style.width = "90%";
      loadingBar.style.borderColor = "orange";
      loadingBarPercentage.innerHTML = "Reloading PWA!";
    } else {
      var value = Math.round(value);
      loadingBar.style.width = (value - 9) + "%";
      loadingBarPercentage.innerHTML = value + "%";
      console.log(loadingBarPercentage.innerHTML.slice(0, -1));
    }
  }
}

openIDBshortcut = function(){
  const dbName = "enigma_db";
  let dbV;
  if(localStorage.hasOwnProperty('IDBV') == false){
    var setdbV = localStorage.setItem('IDBV', 0);
    dbV = setdbV;
  } else {
    var setdbV = parseInt(localStorage.getItem('IDBV'));
    dbV = setdbV;
  };
  dbV = parseInt(localStorage.getItem("IDBV"));
  dbV = ++dbV;
  var openIDB = indexedDB.open(dbName, dbV);
  localStorage.setItem("IDBV", dbV);
  return openIDB;
}

questsStoredIDB = function(init){
  var openIDB = openIDBshortcut();
  var idb_quests = [];
  openIDB.onupgradeneeded = function(evt) {
    var db = evt.target.result;
    setTimeout(function(){
      var request = db.transaction(['quests'], "readonly").objectStore("quests").count();
      request.onsuccess = function(evt){
        console.log(evt);
        db.close();
        if(request.result == 0){
          idb_quests.push(request.result);
        } else {
          idb_quests.push(request.result);
        }
      }
    },10)
  }
  return idb_quests;
};

initPWA = function(){
  initLoadingBarValue(25);
   var openIDB = openIDBshortcut();
   openIDB.onupgradeneeded = function(evt) {
    console.group("Init");
     var db = evt.target.result;
    if(localStorage.hasOwnProperty('isFirstInit') == false){
      console.log(ObjectStores);
      for(i=0; i < ObjectStores.length; i++){
        console.groupCollapsed(ObjectStores[i].OSName + " ObjectStore");
        console.log("Currently creating '" + ObjectStores[i].OSName + "' ObjectStore");
        var currentObjectStore = db.createObjectStore(ObjectStores[i].OSName, {keyPath: ObjectStores[i].OSIndex[0]});
        for(x=0; x < ObjectStores[i].OSIndex.length; x++){
          console.log("Currently creating '" + ObjectStores[i].OSIndex[x] + "' Index");
          if(x == 0){
            currentObjectStore.createIndex(ObjectStores[i].OSIndex[x], ObjectStores[i].OSIndex[x], {unique: true});
          } else {
            currentObjectStore.createIndex(ObjectStores[i].OSIndex[x], ObjectStores[i].OSIndex[x], {unique: false});
          }
          console.log("%cFinished creating '" + ObjectStores[i].OSIndex[x] + "' Index", "color:green");
        }
        console.log("%cFinished creating '" + ObjectStores[i].OSName + "' ObjectStore", "color:green");
        console.groupEnd();
      }
      db.close();
      localStorage.setItem('isFirstInit', 0);
      console.groupEnd();
      console.log("%cFinished creating indexedDB structure", "color: lime");
      console.log("Checking indexedDB structure");
      initPWA();
    } else {
      var errors = 0;
      mainObjectStore: for(i=0; i < ObjectStores.length; i++){
        console.groupCollapsed(ObjectStores[i].OSName + " ObjectStore");
        if(db.objectStoreNames.contains(ObjectStores[i].OSName)){
          console.warn("ObjectStore '" + ObjectStores[i].OSName + "' already exists");
          for(x=0; x < ObjectStores[i].OSIndex.length; x++){
            if(event.target.transaction.objectStore(ObjectStores[i].OSName).indexNames.contains(ObjectStores[i].OSIndex[x])){
              console.warn("Index '" + ObjectStores[i].OSIndex[x] + "' already exists");
            } else {
              console.error("Index '" + ObjectStores[i].OSIndex[x] + "' doesn't exist!");
              errors++;
              console.groupEnd();
              break mainObjectStore;
            }
          }
        } else {
          console.error("ObjectStore '" + ObjectStores[i].OSName + "' doesn't exist!");
          errors++;
          console.groupEnd();
          break;
        }
        console.groupEnd();
      }
      console.groupEnd();
      if(errors == 0){
        db.close();
        console.log("%cCheckup completed!", "color:lime");
        startApp();
      } else {
        db.close();
        console.warn("Errors found during checkup!");
        console.log("%cDeleting current database and creating it again!", "color:orange");
        indexedDB.deleteDatabase('enigma_db');
        localStorage.removeItem("isFirstInit");
        localStorage.removeItem("IDBV");
        console.log("%cDatabase deleted!", "color:orange;");
        initPWA();
      }
    }
  }
}

function startApp(){
  initLoadingBarValue(40);
  console.log("STARTING APP");
  if(navigator.onLine){
    console.group("Getting quests from indexedDB");
    var idb_quests = questsStoredIDB(true);
    console.log(idb_quests);
    console.groupEnd();
    console.group("Getting quests from MySQL database");
    connection.connect(function(err) {
      if(err){
        console.log("Disconnected!");
        throw err;
      }
      console.log("Connected!");
      connection.query("SELECT * FROM quests", function (err, result) {
        if (err) throw err;
        var questsJSON = JSON.stringify(result);
        var quests = JSON.parse(questsJSON);
        console.log(quests);

        var idb_quests = questsStoredIDB(true);
        var openIDB = openIDBshortcut();
        openIDB.onupgradeneeded = function(evt) {
          var db = evt.target.result;
          if(idb_quests == 0){
            console.group("Adding received quests to indexedDB");
              setTimeout(function(){
                for(i=0; i < quests.length; i++){
                  console.groupCollapsed(quests[i].quest_name);
                  var addQuest = db.transaction(['quests'], "readwrite").objectStore("quests").add(quests[i]);
                  console.log(addQuest);
                  addQuest.oncomplete = function(evt){
                    console.log(evt);
                    console.warn(addQuest.error.message);
                    console.warn(addQuest);
                  }
                  console.groupEnd();
                }
                console.log("%cQuests added!", "color: lime");
                setTimeout(function(){
                  console.log("%cApplying changes", "color: orange");
                  initLoadingBarValue("reloading");
                  db.close();
                  console.log("Reloading PWA...");
                  setTimeout(function(){
                    location.reload();
                  },2000);
                },10);
                console.groupEnd();
              },10)
          } else {
            console.group("Checking current quests");
            var lastQuest = quests.length - 1;
            var missingQuests = 0;
            var percentageValue = parseInt(loadingBarPercentage.innerHTML.slice(0, -1));
            var percentageQuests = 20 / quests.length;
            console.log(percentageQuests);
            setTimeout(function(){
              quests.forEach(checkQuestFunc);
              function checkQuestFunc(index, item){
                console.groupCollapsed(index.quest_name);
                console.log(index);
                console.log(item);
                var checkQuest = db.transaction(['quests'], "readwrite").objectStore("quests").get(index.quest_id);
                checkQuest.onsuccess = function(evt){
                  if(evt.target.result == undefined){
                    console.groupCollapsed("Missing quest!");
                    missingQuests++;
                    console.log(evt);
                    console.log(index);
                    var addMissingQuest = db.transaction(['quests'], "readwrite").objectStore("quests").add(index);
                    addMissingQuest.onsuccess = function(){
                      console.log("Missing quest added!");
                      initLoadingBarValue(percentageValue + percentageQuests);
                      percentageValue += percentageQuests;
                    }
                    console.groupEnd();
                  } else {
                    initLoadingBarValue(percentageValue + percentageQuests);
                    percentageValue += percentageQuests;
                  }
                }
                console.groupEnd();
                if(item == lastQuest){
                  setTimeout(function(){
                    if(missingQuests > 0){
                      setTimeout(function(){
                        console.log("%cApplying changes", "color: orange");
                        initLoadingBarValue("reloading");
                        db.close();
                        console.log("Reloading PWA...");
                        setTimeout(function(){
                          location.reload();
                        },2000);
                      },10);
                    } else {
                      console.log("%cQuests checked!", "color: lime");
                      db.close();
                      checkSettings();
                    }
                  },1000)
                }
              }
              console.groupEnd();
            },10);
          }
        }
      });
    });
  } else {
    // Player Offline \\
    console.group("Getting quests from indexedDB");
    var idb_quests = questsStoredIDB(true);
    console.log(idb_quests);
    var openIDB = openIDBshortcut();
    openIDB.onupgradeneeded = function(evt) {
      setTimeout(function(){
        var db = evt.target.result;
        if(idb_quests == 0){
          console.log("There are no quests present on indexedDB");
          console.log("Player can't login");
        } else {
          var checkQuest = db.transaction(['quests'], "readwrite").objectStore("quests").getAll();
          checkQuest.onsuccess = function(evt){
            console.log(evt);
            if(evt.target.result == undefined){
              console.log("Player info not found");
              console.log("Player can't login");
            }
          }
        }
      },500)
    }
  }
}

var currentUserSettings;
checkSettings = function(){
  initLoadingBarValue(parseInt(loadingBarPercentage.innerHTML.slice(0, -1)) + 8);
  console.log("Checking settings...");
  var openIDB = openIDBshortcut();
  openIDB.onupgradeneeded = function(evt){
    var db = evt.target.result;
    setTimeout(function(){
      var request = db.transaction(['settings'], "readonly").objectStore("settings").count();
      request.onsuccess = function(evt){
        if(evt.target.result == 0){
          var defaultSettings = [{
            "setting_id": "2",
            "automatic_login": "0"
          },{
            "setting_id": "3",
            "theme": "0"
          }];
          for(i=0; i < defaultSettings.length; i++){
            initLoadingBarValue(100);
            var request = db.transaction(['settings'], "readwrite").objectStore("settings").add(defaultSettings[i]);
          }
          request.onsuccess = function(){
            console.log("Default settings applied!");
            currentUserSettings = JSON.stringify(defaultSettings);
            localStorage.setItem("UserSettings", currentUserSettings);
            console.log("User Settings saved");
            db.close();
            console.log("Done");
            goToNewWindow();
          }
        } else if(evt.target.result > 1) {
          var request = db.transaction(['settings'], "readwrite").objectStore("settings").getAll();
          request.onsuccess = function(evt){
            var currentSetting = evt.target.result;
            currentSetting.shift();
            currentUserSettings = JSON.stringify(currentSetting);
            console.log(currentUserSettings);
            console.log("User Settings retrieved");
            localStorage.setItem("UserSettings", currentUserSettings);
            console.log("User Settings saved");
            db.close();
            initLoadingBarValue(100);
            console.log("Done");
            goToNewWindow();
          }
        } else {
          throw new Error("Something wrong happened when checking user settings, report to me!");
        }
      }
    },500)
  }
}

checkingPlayerInfo = function(){
  var loginForm = document.getElementById("loginForm");
  var introDiv = document.getElementById("intro");
  var loadingBarDiv = document.getElementById("loadingBar");
  var formTitle = document.getElementById("formTitle");
  var usernameInput = document.getElementById("usernameInput");
  var passwordInput = document.getElementById("passwordInput");
  var formButton = document.getElementsByClassName("formButtons")[0];
  var accText = document.getElementById("accText");
  formTitle.style.opacity = 0;
  formTitle.style.transition = "1s";
  formButton.style.visibility = "hidden";
  formButton.style.opacity = 0;
  formButton.style.transition = "1s";
  accText.style.visibility = "hidden";
  accText.style.opacity = 0;
  accText.style.transition = "1s";
  var openIDB = openIDBshortcut();
  openIDB.onupgradeneeded = function(evt){
    var db = evt.target.result;
    setTimeout(function(){
      var request = db.transaction(['players'], "readonly").objectStore("players").count();
      request.onsuccess = function(evt){
        if(evt.target.result !== 0){
          console.log("Previous player info found.");
          $(accText).attr("data-type", "register");
          var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
          requestPlayerInfo.onsuccess = function(playerInfo){
            console.log(playerInfo);
            $(usernameInput).val(playerInfo.target.result[0].player_name);
            $(passwordInput).val(playerInfo.target.result[0].player_password);
            var automaticLogin = 1;
            $(".formButtons").click(formButtons(automaticLogin));
            db.close();
          }
          formType(formTitle, usernameInput, passwordInput, formButton, accText);
          setTimeout(function(){
            loginForm.style.visibility = "visible";
            loginForm.style.opacity = 1;
          },1000);
        } else {
          console.log("Player info not found.");
          $(accText).attr("data-type", "login");
          formType(formTitle, usernameInput, passwordInput, formButton, accText);
          setTimeout(function(){
            loginForm.style.visibility = "visible";
            loginForm.style.opacity = 1;
          },1000);
        }
      }
    },500)
  }
}

var changingForm = 0;
var formTypeText = ["Already have an account? Login here", "Do not have an account? Register here"];
formType = function(formTitle, usernameInput, passwordInput, formButton, accText){
  if(changingForm == 0){
    if($(accText).attr("data-type") == "login"){
      changingForm = 1;
      $(accText).attr("data-type", "register");
      formButton.disabled = true;
      usernameInput.disabled = true;
      passwordInput.disabled = true;
      formButton.style.opacity = 0;
      formButton.style.visibility = "hidden";
      accText.style.visibility = "hidden";
      accText.style.opacity = 0;
      formTitle.style.opacity = 0;
      setTimeout(function(){
        $(formButton).attr("name", "Register");
        $(formButton).attr("value", "Register");
        $(formButton).attr("id", "Register");
        formButton.style.opacity = 1;
        formButton.style.visibility = "visible";
        accText.innerHTML = formTypeText[0];
        accText.style.visibility = "visible";
        accText.style.opacity = 1;
        formTitle.style.opacity = 1;
        formButton.disabled = false;
        usernameInput.disabled = false;
        passwordInput.disabled = false;
        formTitle.innerHTML = "REGISTER";
        changingForm = 0;
      },1100)
    } else {
      changingForm = 1;
      $(accText).attr("data-type", "login");
      formButton.disabled = true;
      usernameInput.disabled = true;
      passwordInput.disabled = true;
      formButton.style.opacity = 0;
      formButton.style.visibility = "hidden";
      accText.style.visibility = "hidden";
      accText.style.opacity = 0;
      formTitle.style.opacity = 0;
      setTimeout(function(){
        $(formButton).attr("name", "Login");
        $(formButton).attr("value", "Login");
        $(formButton).attr("id", "Login");
        formButton.style.opacity = 1;
        formButton.style.visibility = "visible";
        accText.innerHTML = formTypeText[1];
        accText.style.visibility = "visible";
        accText.style.opacity = 1;
        formTitle.style.opacity = 1;
        formButton.disabled = false;
        usernameInput.disabled = false;
        passwordInput.disabled = false;
        formTitle.innerHTML = "LOGIN";
        changingForm = 0;
      },1100)
    }
  } else {
    console.log("Too soon! Slow down.");
  }
}

function addToInfo(text){
  $("#loginInfo").text(text);
  $("#loginInfo").css("opacity", "1");
  setTimeout(function(){
    $("#loginInfo").css("opacity", "0");
  },5000)
}

$(document).ready(function(){
  $(".formButtons").click(function(){
    formButtons();
  });
  $("#accText").click(function(){
    var formTitle = document.getElementById("formTitle");
    var usernameInput = document.getElementById("usernameInput");
    var passwordInput = document.getElementById("passwordInput");
    var formButton = document.getElementsByClassName("formButtons")[0];
    var accText = document.getElementById("accText");
    formType(formTitle, usernameInput, passwordInput, formButton, accText);
  });

  formButtons = function(automaticLogin){
    var loginForm = document.getElementById("loginForm");
    var formTitle = document.getElementById("formTitle");
    var usernameInput = document.getElementById("usernameInput");
    var passwordInput = document.getElementById("passwordInput");
    var formButton = document.getElementsByClassName("formButtons")[0];
    var accText = document.getElementById("accText");
    var usernameVal = $(usernameInput).val();
    var passwordVal = $(passwordInput).val();
    var sendingXHR = 0;

    console.log(automaticLogin);
    if(automaticLogin == 1){
      $("form").submit(function(event){
        event.preventDefault();
        if(sendingXHR == 0){
            console.log("entered");
            connection.query("SELECT player_name FROM players WHERE player_name = '" + usernameVal + "' AND player_password = '" + passwordVal + "'", function (err, result) {
              if (err) throw err;
              var playerInfoCountJSON = JSON.stringify(result);
              console.log(playerInfoCountJSON);
              var playerInfoCount = JSON.parse(playerInfoCountJSON);
              console.log(playerInfoCount);
              if(playerInfoCount.length == 1){
                connection.query("SELECT * FROM players WHERE player_name = '" + usernameVal + "'", function (err, result) {
                  if (err) throw err;
                  var playerInfoJSON = JSON.stringify(result);
                  console.log(playerInfoJSON);
                  var playerInfo = JSON.parse(playerInfoJSON);
                  console.log(playerInfo);
                  $(accText).off("click");
                  accText.style.opacity = 0;
                  accText.style.visibility = "hidden";
                  formButton.disabled = true;
                  usernameInput.disabled = true;
                  passwordInput.disabled = true;
                  loginForm.style.opacity = 0;
                  loginForm.style.visibility = "hidden";
                  var openIDB = openIDBshortcut();
                  openIDB.onupgradeneeded = function(evt){
                    var db = evt.target.result;
                    setTimeout(function(){
                      var request = db.transaction(['players'], "readwrite").objectStore("players").clear();
                      request.onsuccess = function(evt){
                        console.log(evt);
                        var request = db.transaction(['players'], "readwrite").objectStore("players").add(playerInfo[0]);
                        request.onsuccess = function(evt){
                          console.log(evt);
                          console.log("Player info added!");
                          db.close();
                          goToHome();
                        }
                        request.onerror = function(evt){
                          db.close();
                          console.log(evt);
                          if(evt.target.error.message == "Key already exists in the object store."){
                            goToHome();
                          } else {
                            throw new Error("Something wrong happened when trying to login, report to me!");
                          }
                        }
                      }
                    },500);
                  }
                });
              } else if(playerInfoCount.length == 0){
                addToInfo("Username or password wrong");
              }
            });
        } else {
          console.log("Too soon, slow down!")
        }
      })
      $("form").submit();

    } else {

      if(/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(passwordVal) && usernameVal.length >= 6){
        console.log($(this).attr("name"));
        if($("input#Register").attr("name") == "Register"){
          $("form").submit(function(event){
            event.preventDefault();
            if(sendingXHR == 0){
              if($("input#Register").attr("name") == "Register"){
                sendingXHR++;
                connection.query("SELECT player_name FROM players WHERE player_name = '" + usernameVal + "'", function (err, result) {
                  if (err) throw err;
                  var playerCountJSON = JSON.stringify(result);
                  console.log(playerCountJSON);
                  var playerCount = JSON.parse(playerCountJSON);
                  console.log(playerCount);
                  if(playerCount.length == 0){
                    connection.query("INSERT INTO players(player_name, player_password) VALUES('" + usernameVal + "', MD5('" + passwordVal + "'))", function (err, result){
                      if (err) throw err;
                      $(accText).off("click");
                      accText.style.opacity = 0;
                      accText.style.visibility = "hidden";
                      formButton.disabled = true;
                      usernameInput.disabled = true;
                      passwordInput.disabled = true;
                      formType(formTitle, usernameInput, passwordInput, formButton, accText);
                    });
                  } else if(playerCount.length == 1) {
                    addToInfo("Username já existe!");
                  } else {
                    throw new Error("Something wrong happened when trying to register, report to me!");
                  }
                });
              } else {
                console.log($(this).attr("name"));
              }
            } else {
              console.log("Too soon, slow down!");
            }
          })
          $("form").submit();
        } else if($("input#Login").attr("name") == "Login"){
          $("form").submit(function(event){
            event.preventDefault();
            if(sendingXHR == 0){
              if($("input#Login").attr("name") == "Login"){
                connection.query("SELECT player_name FROM players WHERE player_name = '" + usernameVal + "' AND player_password = MD5('" + passwordVal + "')", function (err, result) {
                  if (err) throw err;
                  var playerInfoCountJSON = JSON.stringify(result);
                  console.log(playerInfoCountJSON);
                  var playerInfoCount = JSON.parse(playerInfoCountJSON);
                  console.log(playerInfoCount);
                  if(playerInfoCount.length == 1){
                    connection.query("SELECT * FROM players WHERE player_name = '" + usernameVal + "'", function (err, result) {
                      if (err) throw err;
                      var playerInfoJSON = JSON.stringify(result);
                      console.log(playerInfoJSON);
                      var playerInfo = JSON.parse(playerInfoJSON);
                      console.log(playerInfo);
                      $(accText).off("click");
                      accText.style.opacity = 0;
                      accText.style.visibility = "hidden";
                      formButton.disabled = true;
                      usernameInput.disabled = true;
                      passwordInput.disabled = true;
                      loginForm.style.opacity = 0;
                      loginForm.style.visibility = "hidden";
                      var openIDB = openIDBshortcut();
                      openIDB.onupgradeneeded = function(evt){
                        var db = evt.target.result;
                        setTimeout(function(){
                          var request = db.transaction(['players'], "readwrite").objectStore("players").clear();
                          request.onsuccess = function(evt){
                            console.log(evt);
                            var request = db.transaction(['players'], "readwrite").objectStore("players").add(playerInfo[0]);
                            request.onsuccess = function(evt){
                              console.log(evt);
                              console.log("Player info added!");
                              db.close();
                              goToHome();
                            }
                            request.onerror = function(evt){
                              db.close();
                              console.log(evt);
                              if(evt.target.error.message == "Key already exists in the object store."){
                                goToHome();
                              } else {
                                throw new Error("Something wrong happened when trying to login, report to me!");
                              }
                            }
                          }
                        },500);
                      }
                    });
                  } else if(playerInfoCount.length == 0){
                    addToInfo("Username or password wrong");
                  }
                });
              }
            } else {
              console.log("Too soon, slow down!")
            }
          })
          $("form").submit();
        } else {
          throw new Error("Something wrong happened when trying to login or register, report to me!");
        }
      } else {
        console.log("Password should contain at least eight characters, one lower and uppercase letter.");
        addToInfo("Password should contain at least eight characters, one lower and uppercase letter.");
      }
    }
  }
});



checkGameDownloadStatus = function(){
  console.log("checking");
  const fs = require('fs');
  var child = require('child_process');
  var exePath = 'gameFiles/package/WindowsNoEditor/SimpleUnrealExample.exe';
  var zipPath = 'package.zip';
  if(fs.existsSync(exePath)){
    //file exists
    //run exe
    console.log(".exe exists");
    $("#playgame-btn h4").text("PLAY GAME");
    $("#playgame-btn").css("opacity", "1");
    $("#playgame-btn").css("visibility", "visible");

  } else if(fs.existsSync(zipPath)){
    console.log(".exe doesnt exist, Checking if .zip exists");

    const decompress = require('decompress');

    $("#playgame-btn h4").text("UNPACKING");
    $("#playgame-btn").css("opacity", "1");
    $("#playgame-btn").css("visibility", "visible");
    decompress(zipPath, 'gameFiles').then(files => {
      console.log('done!');
      $("#playgame-btn").css("opacity", "0");
      setTimeout(function(){
        $("#playgame-btn h4").text("PLAY GAME");
        $("#playgame-btn").css("opacity", "1");
      },800)
    }).catch(error => {
      //zip corrupted
      console.log(".zip is corrupted.");
      fs.unlink('package.zip', (err) => {
      if (err) throw err;
        console.log('package.zip' + ' was deleted');
      });
    });

  } else {
    console.log(".zip doesnt exist.");
    $("#playgame-btn h4").text("DOWNLOAD");
    $("#playgame-btn").css("opacity", "1");
    $("#playgame-btn").css("visibility", "visible");
  }
}
