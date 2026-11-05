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
include "db/core/app/model/PedidoMesaData.php";
include "db/core/app/model/MesaData.php";
include "db/core/app/model/UserData.php";


session_start(); 
$session_id= session_id();


$usuarionew=0;
$usuario=UserData::getUltimoProcess();
if(@count($usuario)>0){
    
    $venta = new PedidoData();
    $venta->id_tipo_pedido = 1;
    $venta->id_usu = 1;
    $venta->fecha_pedido = date("Y-m-d H:i:s");
    $venta->estado = "a";
    $v=$venta->add();


    $pdelivery = new PedidoMesaData();
    $pdelivery->id_pedido = $v[1];
    $pdelivery->id_mesa = $_POST["id_mesa"];
    $pdelivery->id_mozo = $usuario->id_usu;
    $pdelivery->nomb_cliente = $_POST["nombre"];
    $pdelivery->nro_personas =0;
    $pdelivery->comentario ="Pedido app";
    $p=$pdelivery->add();

    $mesaa = MesaData::getById($_POST["id_mesa"]);
    $mesaa->estado = "i";
    $mesaa->update();
     
     
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

}

 

print "<script>window.location='gracias_mesa.php';</script>";

?>