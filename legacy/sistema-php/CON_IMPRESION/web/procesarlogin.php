<?php
session_start();
?>

<?php
include "db/core/autoload.php";
include "db/core/app/model/ClientesData.php";
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

    echo "Bienvenido! " . $_SESSION['username'];
    if(isset($_POST['checkout'])){
    	 print "<script>window.location='micuenta.php';</script>";
    }else{
    	 print "<script>window.location='carrito.php';</script>";
    	};
   

 } else { 

   print "<script>alert('Email o Password estan incorrectos');</script>";
   print "<script>window.location='micuenta.php';</script>";
   
 }
 mysqli_close($con); 
 ?>