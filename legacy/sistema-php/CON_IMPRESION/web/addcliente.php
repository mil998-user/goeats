<?php
include "db/core/autoload.php";
include "db/core/app/model/ClientesData.php";

 
if(count($_POST)>0){ 
 


$clienteexiste = ClientesData::getByEmail($_POST["email"]);

if(@count($clienteexiste)>0){

 print "<script>alert('Error, ya existe esta cuenta.');</script>";

   print "<script>window.location='micuenta.php';</script>"; 

}else{



$caracteres_permitidos = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
$longitud = 6;
$codigo = substr(str_shuffle($caracteres_permitidos), 0, $longitud);

	$cliente = new ClientesData();
	
	$cliente->dni = $_POST["documento"];
	$cliente->ape_paterno = "-";
	$cliente->ape_materno = "-";
	$cliente->nombres = $_POST["nombre"];
	$cliente->telefono = $_POST["celular"];
	$cliente->correo = $_POST["email"];
	$cliente->direccion = $_POST["direccion"];
	$cliente->password = $_POST["password"];
	$cliente->add();





session_start();

$base = new Database();
$con = $base->connect();


$username = $_POST['email'];
$password = $_POST['password'];
 
$sql = "SELECT * FROM tm_cliente WHERE correo = '$username'";

$result = $con->query($sql);


if ($result->num_rows > 0) {     
 }
 $row = $result->fetch_array(MYSQLI_ASSOC);
 if ($row['password']==$_POST['password'] ) { 
 	
    $_SESSION['loggedin'] = true;
    $_SESSION['username'] = $username;
    $_SESSION['id_cliente'] = $row['id_cliente'];
    $_SESSION['start'] = time();
    $_SESSION['expire'] = $_SESSION['start'] + (5 * 60);

 
    print "<script>window.location='micuenta.php';</script>"; 

 } else { 
    print "<script>alert('Error, ya existe esta cuenta');</script>";

   print "<script>window.location='micuenta.php';</script>"; 
 }
 mysqli_close($con); 






}



}


?>