<?php

	$MYSQL["host"] =  "localhost"; //endereço do servidor mysql
	$MYSQL["user"] = "app"; //Usuario do servidor mysql
	$MYSQL["pass"] = "playersapp"; //Senha do Usuario
	$MYSQL["database"] = "enigma_db"; //base de dados usada

	$connection = mysqli_connect($MYSQL["host"], $MYSQL["user"], $MYSQL["pass"], $MYSQL["database"]) or die("Não foi possivel conectar ao servidor MySQL. Erro: " . mysqli_connect_error());

?>
