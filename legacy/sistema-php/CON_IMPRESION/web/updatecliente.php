<?php
include "db/core/autoload.php";
include "db/core/app/model/ClientesData.php";

 
if(count($_POST)>0){ 
 


$cliente = ClientesData::getById($_POST["id_cliente"]);

	
	$cliente->dni = $_POST["documento"];
	$cliente->nombres = $_POST["nombre"];
	$cliente->telefono = $_POST["celular"];
	$cliente->direccion = $_POST["direccion"];
	$cliente->password = $_POST["password"];
	$cliente->update();





    print "<script>window.location='micuenta.php';</script>"; 

 


}


?>