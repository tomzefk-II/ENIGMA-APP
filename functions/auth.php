<?php
require("../includes/connect.php");

if($_POST) {
  $username = $_POST["username"];
  $password = $_POST["password"];
  $auth = $_POST["auth"];
  if($auth == "Login") {
    $loginQuery = "SELECT player_name FROM players WHERE player_name = '$username' AND player_password = MD5('$password')";
    $executeLogin = mysqli_query($connection, $loginQuery);
    if(mysqli_num_rows($executeLogin) == 1) {
      $getPlayerInfoQuery = "SELECT * FROM players WHERE player_name = '$username'";
      $executeGetPlayerInfo = mysqli_query($connection, $getPlayerInfoQuery);
      $playerInfo = mysqli_fetch_object($executeGetPlayerInfo);
      $canAuth = array("canAuth" => 1, "message" => "Logged In successfully", "player_id" => $playerInfo->player_id, "player_name" => $playerInfo->player_name, "player_password" => $playerInfo->player_password, "player_level" => $playerInfo->player_level, "player_isBetaTester" => $playerInfo->player_isBetaTester);
      echo json_encode($canAuth);
    } else {
      $canAuth = array("canAuth" => 0, "message" => "Username ou Password errada!");
      echo json_encode($canAuth);
    }
  } else if($auth == "Register") {
    $verifyUsernameQuery = "SELECT player_name FROM players WHERE player_name = '$username';";
    $executeVerifyUsername = mysqli_query($connection, $verifyUsernameQuery);
    if(mysqli_num_rows($executeVerifyUsername) == 1) {
      $canAuth = array("canAuth" => 0, "message" => "Username já existe");
      echo json_encode($canAuth);
    } else {
      $registerQuery = "INSERT INTO players(player_name, player_password) VALUES('$username', MD5('$password'));";
      $execute = mysqli_query($connection, $registerQuery);
      $canAuth = array("canAuth" => 1, "message" => "Registrado com sucesso!");
      echo json_encode($canAuth);
    }
  }
}

?>
