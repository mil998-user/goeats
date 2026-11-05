    
<?php
session_start(); 
$session_id= session_id(); 

include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";

if (isset($_POST['id'])){$id=$_POST['id'];}
if (isset($_POST['cantidad'])){$cantidad=$_POST['cantidad'];}
if (isset($_POST['precio_venta'])){$precio_venta=$_POST['precio_venta'];}


if(isset($_POST['cantidad']) and isset($_POST['precio_venta'])){
$producto= CarritoData::getByIdProductoSession($_POST['id'],$session_id);
if(@count($producto)>0){
 
    $temporal = CarritoData::getById($producto->id);
    $temporal->cantidad = $producto->cantidad+$_POST['cantidad'];

    $opc=json_decode($_POST["opciones"],TRUE);
    $selected="";
    foreach ($opc as $key => $value) {
      $selected .= $value['value'].',';  
    }

    $temporal->opciones = $selected;
    $temporal->updateCantidad();
 
}else{  
    $temporal = new CarritoData();
    $temporal->id_producto = $_POST['id']; 
    $temporal->cantidad = $_POST['cantidad'];
    $temporal->precio = $_POST["precio_venta"];
    $temporal->sessionn_id = $session_id;
    $opc=json_decode($_POST["opciones"],TRUE);
    $selected="";
    foreach ($opc as $key => $value) {
      $selected .= $value['value'].',';  
    }

    $temporal->opciones = $selected;
    $temporal->addTmp();  
}
}
 


if (isset($_GET['id']))//codigo elimina un elemento del array
{
	$del = CarritoData::getById($_GET["id"]);
	$del->del();
} 


?>

<div class="blockcart cart-preview inactive" data-refresh-url="">
    <a href="carrito.php">
    <div class="header btn-header btn-cart">
              <i class="icon-nqt-shopping-basket" aria-hidden="true"></i>
        <span class="cart-products-count"><?php echo @count(CarritoData::getAllTemporal($session_id));?></span>
          </div>
   
     <?php $tpms = CarritoData::getAllTemporal($session_id); 
        $total=0;
        $cantidad=0;
        if(@count($tpms)>0){
          $total=0;
          foreach($tpms as $tpm):
              $total=($tpm->cantidad*$tpm->precio)+$total;
              $cantidad=$tpm->cantidad+$cantidad;
          endforeach; 
        }else{ $total=0; };?>

    <span class="cart-count-items">$ <?php echo $total;?></span>
  </a>
  </div>
			
           