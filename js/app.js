require('dotenv').config({
  path: `${__dirname}/.env`
});
const { ipcRenderer } = require('electron');
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
var $, jQuery;
$ = jQuery = require('jquery');
var mysql = require('mysql');
let internetConnection;
if(navigator.onLine == true){
  internetConnection = true;
} else {
  internetConnection = false;
}

window.addEventListener('offline', function(e) {
  console.log('user offline');
  internetConnection = false;
});

window.addEventListener('online', function(e) {
  console.log('user online');
  internetConnection = true;
});

let connection = mysql.createPool({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME
});

let ObjectStores = [
  {
    OSName: "players",
    OSIndex: ["player_id"]
  },
  {
    OSName: "settings",
    OSIndex: ["setting_id"]
  }
];


var error;
initLoadingBarValue = function(value){
  var loadingBarPercentage = document.getElementById("loadingBarPercentage");
  var loadingBar = document.getElementById("loadingBar");
  if(error !== 1){
    if(value == "error"){
      error = 1;
      loadingBar.style.width = "100%";
      loadingBar.style.borderColor = "red";
      loadingBarPercentage.innerHTML = "An error occurred! Report to me!";
    } else if(value == "reloading"){
      loadingBar.style.width = "100%";
      loadingBar.style.borderColor = "orange";
      loadingBarPercentage.innerHTML = "Reloading PWA!";
    } else if(value == "checkingUpdates"){
      loadingBar.style.width = "100%";
      loadingBar.style.borderColor = "orange";
      loadingBarPercentage.innerHTML = "Checking for updates..."
    } else if(value == "noInternet"){
      loadingBar.style.width = "100%";
      loadingBar.style.borderColor = "orange";
      loadingBarPercentage.innerHTML = "No internet connection..."
    } else {
      var value = Math.round(value);
      loadingBar.style.borderColor = "#dbdbdb";
      loadingBar.style.width = value + "%";
      loadingBarPercentage.innerHTML = value + "%";
      console.log(loadingBarPercentage.innerHTML.slice(0, -1));
    }
  }
}

const dbName = "enigma_db";
openIDBshortcut = function(){
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
        checkSettings();
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
        console.log(evt);
        if(evt.target.result == 0){
          var defaultSettings = [{
            "setting_id": "2",
            "theme": "0"
          }];
          for(i=0; i < defaultSettings.length; i++){
            initLoadingBarValue(100);
            var request = db.transaction(['settings'], "readwrite").objectStore("settings").add(defaultSettings[i]);
          }
          request.onsuccess = function(){
            db.close();
            console.log("Default settings applied!");
            currentUserSettings = JSON.stringify(defaultSettings);
            localStorage.setItem("UserSettings", currentUserSettings);
            console.log("User Settings saved");
            console.log("Done");
            goToNewWindow();
          }
        } else if(evt.target.result >= 1) {
          var request = db.transaction(['settings'], "readwrite").objectStore("settings").getAll();
          request.onsuccess = function(evt){
            db.close();
            var currentSetting = evt.target.result;
            currentSetting.shift();
            currentUserSettings = JSON.stringify(currentSetting);
            console.log(currentUserSettings);
            console.log("User Settings retrieved");
            localStorage.setItem("UserSettings", currentUserSettings);
            console.log("User Settings saved");
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

checkingPlayerInfo = function(internetConnection){
  var loginForm = document.getElementById("loginForm");
  var introDiv = document.getElementById("intro");
  var loadingBarDiv = document.getElementById("loadingBar");
  var formTitle = document.getElementById("formTitle");
  var usernameInput = document.getElementById("usernameInput");
  var passwordInput = document.getElementById("passwordInput");
  var formButton = document.getElementsByClassName("formButtons")[0];
  var accText = document.getElementById("accText");

  var openIDB = openIDBshortcut();
  openIDB.onupgradeneeded = function(evt){
    var db = evt.target.result;
    setTimeout(function(){
      var request = db.transaction(['players'], "readonly").objectStore("players").count();
      request.onsuccess = function(evt){
        if(evt.target.result !== 0){
          console.log("Previous player info found.");
          if(internetConnection == true){
            $(accText).attr("data-type", "register");
            var requestPlayerInfo = db.transaction(['players'], "readwrite").objectStore("players").getAll();
            requestPlayerInfo.onsuccess = function(playerInfo){
              db.close();
              console.log(playerInfo);
              $(usernameInput).val(playerInfo.target.result[0].player_name);
              $(passwordInput).val(playerInfo.target.result[0].player_password);
              var automaticLogin = 1;
              $(".submitForm").click(formButtons(automaticLogin));
            }
            setTimeout(function(){
              loginForm.style.visibility = "visible";
              loginForm.style.opacity = 1;
              formType(formTitle, inputWrapper, usernameInput, passwordInput, formButton, accText);
            },1000)
          } else {
            db.close();
            console.log("Logging in...");
            goToHome();
          }
        } else {
          db.close();
          console.log("Player info not found.");
          if(internetConnection == true){
            $(accText).attr("data-type", "login");
            setTimeout(function(){
              loginForm.style.visibility = "visible";
              loginForm.style.opacity = 1;
              formType(formTitle, inputWrapper, usernameInput, passwordInput, formButton, accText);
            },1000);
          } else {
            console.log("User offline, cannot register or login!");
            throw new Error("User offline, no way to validate credentials");
          }
        }
      }
    },500)
  }
}

var changingForm = 0;
var formTypeText = ["Already have an account? Login here", "Do not have an account? Register here"];
formType = function(formTitle, inputWrapper, usernameInput, passwordInput, formButton, accText){
  if(changingForm == 0){
    formButton.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true;
    changingForm = 1;

    inputWrapper.style.opacity = 0;
    inputWrapper.style.visibility = "hidden";
    setTimeout(function(){
      $("#submitError").text("");
      formTitle.style.opacity = 0;
      loginForm.style.maxHeight = "140px";
      if($(accText).attr("data-type") == "login"){
        $(accText).attr("data-type", "register");
        setTimeout(function(){
          $(formButton).attr("name", "Register");
          $(formButton).attr("value", "Register");
          $(formButton).attr("id", "Register");
          formTitle.innerHTML = "REGISTER";
          accText.innerHTML = formTypeText[0];
          formButton.disabled = false;
          usernameInput.disabled = false;
          passwordInput.disabled = false;
          formTitle.style.opacity = 1;
          formTitle.style.visibility = "visible";
          loginForm.style.boxShadow = "0px 10px 16px 0px rgba(0,0,0,0.5)";
          loginForm.style.backgroundColor = "var(--blackMedium)";
          setTimeout(function(){
            loginForm.style.maxHeight = "502px";
            setTimeout(function(){
              inputWrapper.style.opacity = 1;
              inputWrapper.style.visibility = "visible";
              loginForm.style.maxHeight = "700px";
              changingForm = 0;
            },1000)
          },1000)
        },1100)
      } else {
        changingForm = 1;
        $(accText).attr("data-type", "login");
        setTimeout(function(){
          $(formButton).attr("name", "Login");
          $(formButton).attr("value", "Login");
          $(formButton).attr("id", "Login");
          formTitle.innerHTML = "LOGIN";
          accText.innerHTML = formTypeText[1];
          formTitle.style.opacity = 1;
          formButton.style.opacity = 1;
          formTitle.style.visibility = "visible";
          formButton.disabled = false;
          usernameInput.disabled = false;
          passwordInput.disabled = false;
          loginForm.style.boxShadow = "0px 10px 16px 0px rgba(0,0,0,0.5)";
          loginForm.style.backgroundColor = "var(--blackMedium)";
          setTimeout(function(){
            loginForm.style.maxHeight = "502px";
            setTimeout(function(){
              inputWrapper.style.opacity = 1;
              inputWrapper.style.visibility = "visible";
              loginForm.style.maxHeight = "700px";
              changingForm = 0;
            },1000)
          },1000)
        },1100)
      }
    },1000)
  } else {
    console.log("Too soon! Slow down.");
  }
}

$(document).ready(function(){
  $(".submitForm").click(function(){
    formButtons();
  });
  $("#accText").click(function(){
    var formTitle = document.getElementById("formTitle");
    var inputWrapper = document.getElementById("inputWrapper");
    var usernameInput = document.getElementById("usernameInput");
    var passwordInput = document.getElementById("passwordInput");
    var formButton = document.getElementsByClassName("formButtons")[0];
    var accText = document.getElementById("accText");
    formType(formTitle, inputWrapper, usernameInput, passwordInput, formButton, accText);
  });

  formButtons = function(automaticLogin){
    var loginForm = document.getElementById("loginForm");
    var formTitle = document.getElementById("formTitle");
    var inputWrapper = document.getElementById("inputWrapper");
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
            console.log("entered boas");
            connection.query("SELECT player_name FROM players WHERE player_name = '" + usernameVal + "' AND player_password = '" + passwordVal + "'", function (err, result) {
              if (err) throw err;
              console.log(result);
              var playerInfoCountJSON = JSON.stringify(result);
              console.log(playerInfoCountJSON);
              var playerInfoCount = JSON.parse(playerInfoCountJSON);
              console.log(playerInfoCount);
              if(playerInfoCount.length == 1){
                connection.query("SELECT * FROM players WHERE player_name = '" + usernameVal + "'", function (err, result) {
                  if (err) throw err;
                  var playerBasicInfoJSON = JSON.stringify(result);
                  console.log(playerBasicInfoJSON);
                  var playerBasicInfo = JSON.parse(playerBasicInfoJSON);
                  console.log(playerBasicInfo);
                  var playerSkillsAcquired;
                  var playerPhrasesDecoded;
                  var playerHintUsed;
                  connection.query("SELECT * FROM skills_acquired WHERE skillsAcquired_player_id = '" + playerBasicInfo[0].player_id + "'", function (err, result) {
                    if (err) throw err;
                    var playerSkillsAcquiredJSON = JSON.stringify(result);
                    console.log(playerSkillsAcquiredJSON);
                    playerSkillsAcquired = JSON.parse(playerSkillsAcquiredJSON);
                    console.log(playerSkillsAcquired);

                    connection.query("SELECT * FROM phrases_decoded WHERE phrasesDecoded_player_id = '" + playerBasicInfo[0].player_id + "'", function (err, result) {
                      if (err) throw err;
                      var playerPhrasesDecodedJSON = JSON.stringify(result);
                      console.log(playerPhrasesDecodedJSON);
                      playerPhrasesDecoded = JSON.parse(playerPhrasesDecodedJSON);
                      console.log(playerPhrasesDecoded);

                      connection.query("SELECT * FROM hints_used WHERE hintUsed_player_id = '" + playerBasicInfo[0].player_id + "'", function (err, result) {
                        if (err) throw err;
                        var playerHintUsedJSON = JSON.stringify(result);
                        console.log(playerHintUsedJSON);
                        playerHintUsed = JSON.parse(playerHintUsedJSON);
                        console.log(playerHintUsed);

                        var countPlayerPlusInfo = {
                          "player_skillAcquired": playerSkillsAcquired.length,
                          "player_phrasesDecoded": playerPhrasesDecoded.length,
                          "player_hintsUsed": playerHintUsed.length,
                        }
                        var playerInfo = $.extend(playerBasicInfo[0], countPlayerPlusInfo);
                        console.log(playerInfo);

                        inputWrapper.style.opacity = 0;
                        inputWrapper.style.visibility = "hidden";
                        formButton.disabled = true;
                        usernameInput.disabled = true;
                        passwordInput.disabled = true;
                        var openIDB = openIDBshortcut();
                        openIDB.onupgradeneeded = function(evt){
                          var db = evt.target.result;
                          setTimeout(function(){
                            var request = db.transaction(['players'], "readwrite").objectStore("players").clear();
                            request.onsuccess = function(evt){
                              console.log(evt);
                              var request = db.transaction(['players'], "readwrite").objectStore("players").add(playerInfo);
                              request.onsuccess = function(evt){
                                db.close();
                                console.log(evt);
                                console.log("Player info added!");
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
                    });
                  });
                });
              } else if(playerInfoCount.length == 0){
                $("#submitError").text("Username or password wrong");
              }
            });
            console.log("done");
        } else {
          console.log("Too soon, slow down!")
        }
      })
      $("form").submit();
    } else {
      if(usernameVal.length >= 6){
        if(/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(passwordVal)){
          console.log($("input#Register").attr("name"));
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
                      connection.query("INSERT INTO players(player_code, player_name, player_password) VALUES('" + CryptoJS.MD5(usernameVal).toString().substring(0, 20) + "', '" + usernameVal + "', MD5('" + passwordVal + "'))", function (err, result){
                        if (err) throw err;
                        formButton.disabled = true;
                        usernameInput.disabled = true;
                        passwordInput.disabled = true;
                        formType(formTitle, inputWrapper, usernameInput, passwordInput, formButton, accText);
                      });
                    } else if(playerCount.length == 1) {
                      $("#submitError").text("Username já existe!");
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
            });
            $("#usernameError").text("");
            $("#passwordError").text("");
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
                        var playerBasicInfoJSON = JSON.stringify(result);
                        console.log(playerBasicInfoJSON);
                        var playerBasicInfo = JSON.parse(playerBasicInfoJSON);
                        console.log(playerBasicInfo);
                        var playerSkillsAcquired;
                        var playerPhrasesDecoded;
                        var playerHintUsed;
                        connection.query("SELECT * FROM skills_acquired WHERE skillsAcquired_player_id = '" + playerBasicInfo[0].player_id + "'", function (err, result) {
                          if (err) throw err;
                          var playerSkillsAcquiredJSON = JSON.stringify(result);
                          console.log(playerSkillsAcquiredJSON);
                          playerSkillsAcquired = JSON.parse(playerSkillsAcquiredJSON);
                          console.log(playerSkillsAcquired);

                          connection.query("SELECT * FROM phrases_decoded WHERE phrasesDecoded_player_id = '" + playerBasicInfo[0].player_id + "'", function (err, result) {
                            if (err) throw err;
                            var playerPhrasesDecodedJSON = JSON.stringify(result);
                            console.log(playerPhrasesDecodedJSON);
                            playerPhrasesDecoded = JSON.parse(playerPhrasesDecodedJSON);
                            console.log(playerPhrasesDecoded);

                            connection.query("SELECT * FROM hints_used WHERE hintUsed_player_id = '" + playerBasicInfo[0].player_id + "'", function (err, result) {
                              if (err) throw err;
                              var playerHintUsedJSON = JSON.stringify(result);
                              console.log(playerHintUsedJSON);
                              playerHintUsed = JSON.parse(playerHintUsedJSON);
                              console.log(playerHintUsed);

                              var countPlayerPlusInfo = {
                                "player_skillAcquired": playerSkillsAcquired.length,
                                "player_phrasesDecoded": playerPhrasesDecoded.length,
                                "player_hintsUsed": playerHintUsed.length,
                              }
                              var playerInfo = $.extend(playerBasicInfo[0], countPlayerPlusInfo);
                              console.log(playerInfo);
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
                                    var request = db.transaction(['players'], "readwrite").objectStore("players").add(playerInfo);
                                    request.onsuccess = function(evt){
                                      db.close();
                                      console.log(evt);
                                      console.log("Player info added!");
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
                            })
                          })
                        })
                      });
                    } else if(playerInfoCount.length == 0){
                      $("#submitError").text("Username or password wrong");
                    }
                  });
                }
              } else {
                console.log("Too soon, slow down!")
              }
            });
            $("#usernameError").text("");
            $("#passwordError").text("");
            $("form").submit();
          } else {
            throw new Error("Something wrong happened when trying to login or register, report to me!");
          }
        } else {
          console.log("Password should contain at least eight characters, one lower and uppercase letter.");
          $("#passwordError").text("Password should contain at least eight characters, one lower and uppercase letter.");
          $("#usernameError").text("");
        }
      } else {
        console.log("Username should contain at least six characters.");
        $("#usernameError").text("Username should contain at least six characters.");
        $("#passwordError").text("");
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
        $("#playgame-btn h4").text("DOWNLOAD");
        $("#playgame-btn").css("opacity", "1");
        $("#playgame-btn").css("visibility", "visible");
      });
    });

  } else {
    console.log(".zip doesnt exist.");
    console.log(internetConnection);
    if(internetConnection == false){
      console.log("User offline, cannot download the game!");
      $("#playgame-btn").prop("disabled", true);
    } else {
      console.log("User online, can now download the game!");
      $("#playgame-btn").prop("disabled", false);
    }
    $("#playgame-btn h4").text("DOWNLOAD");
    $("#playgame-btn").css("opacity", "1");
    $("#playgame-btn").css("visibility", "visible");
  }
}
