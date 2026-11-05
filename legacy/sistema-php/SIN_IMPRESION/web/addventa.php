<?php
     date_default_timezone_set('America/Lima');
  

include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";

include "db/core/app/model/ClientesData.php";
include "db/core/app/model/PedidoData.php";
include "db/core/app/model/PedidoDeliveryData.php";
include "db/core/app/model/PedidoDetalleData.php";


session_start(); 
$session_id= session_id();

$procesocod = PedidoDeliveryData::getAll();
  $codigo=0;
  if(count($procesocod)>0){
    if(count($procesocod)<10){
      $codigo='0000'.(count($procesocod)+1);
    }else if($procesocod->id<100){
      $codigo='000'.(count($procesocod)+1);
    }else if($procesocod->id<1000){
      $codigo='00'.(count($procesocod)+1);
    }else if($procesocod->id<10000){
      $codigo='0'.(count($procesocod)+1);
    }else if($procesocod->id<100000){
      $codigo=''.(count($procesocod)+1);
    }else if($procesocod->id<1000000){
      $codigo=''.(count($procesocod)+1);
    }else if($procesocod->id<10000000){
      $codigo=''.(count($procesocod)+1);
    }else{
      $codigo=''.(count($procesocod)+1);
    }

  }else{$codigo='00001';}





$venta = new PedidoData();
$venta->id_tipo_pedido = 3;
$venta->id_usu = 1;
$venta->fecha_pedido = date("Y-m-d H:i:s");
$venta->estado = "a";
$v=$venta->add();
 

$pdelivery = new PedidoDeliveryData();
$pdelivery->id_pedido = $v[1];
$pdelivery->nro_pedido = $codigo;
$pdelivery->nomb_cliente = $_POST["nombre"];
$pdelivery->direccion =$_POST["direccion"];
$pdelivery->telefono =$_POST["celular"];
$pdelivery->comentario ="Pedido desde la web";
$pdelivery->motorizado ="Por asignar";
$p=$pdelivery->add();
 
 
$tmps = CarritoData::getAllTemporal($session_id);
	foreach($tmps as $p): 

		$procesoventa = new PedidoDetalleData();
		$procesoventa->id_pedido=$v[1];
		$procesoventa->id_pres=$p->id_producto;
		$procesoventa->cantidad=$p->cantidad;

		$procesoventa->cant=$p->cantidad;
		$procesoventa->precio=$p->precio;

		$procesoventa->comentario="NULL";
		$procesoventa->fecha_pedido=date("Y-m-d H:i:s");
		$procesoventa->fecha_envio=date("Y-m-d H:i:s");
		$procesoventa->estado="a";
		$procesoventa->add();
	endforeach;


$dels = CarritoData::getAllTemporal($session_id);
	foreach($dels as $del):
		$eliminar = CarritoData::getById($del->id);
		$eliminar->del();
	endforeach;


print "<script>window.location='gracias.php';</script>";

?>