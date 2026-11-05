    
<?php
session_start(); 
$session_id= session_id(); 

include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";
include "db/core/app/model/ClientesData.php";


 
$codigo = ClientesData::getById($_POST['id_cliente']);
if($codigo->codigo==$_POST['codigo']){
    $codigo->estado = "1";
    $codigo->updateCantidad();
    print "<script>alert('Gracias por confirmar');</script>";
    print "<script>window.location='micuenta.php';</script>";
}else{
    print "<script>alert('El código brindado no es igual, verifique por favor!!');</script>";
    print "<script>window.location='micuenta.php';</script>"; 
}




?>
			
           