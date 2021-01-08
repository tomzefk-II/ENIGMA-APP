<?php
require("../includes/connect.php");

$getTableContentQuery = "SELECT * FROM quests";
$executeGetTableContentQuery = mysqli_query($connection, $getTableContentQuery);
$TableContentQuests = array();
while($TableContent = mysqli_fetch_object($executeGetTableContentQuery)){
  $rowContent = array("quest_id"=>$TableContent->quest_id, "quest_name"=>$TableContent->quest_name, "quest_minLevel"=>$TableContent->quest_minLevel);
  $TableContentQuestscontent = $rowContent;
  array_push($TableContentQuests, $TableContentQuestscontent);
}
echo json_encode($TableContentQuests);
?>
