<?php
session_start();
require_once("../../../model/rest.model.php");
header('Content-Type: text/html; charset=UTF-8');
include ("funciones.php");
require "phpqrcode/qrlib.php";

class EnviarSunatModel {
    
    private $conexionn;
    
    public function __CONSTRUCT()
    {
        try
        {
            $this->conexionn = Database::Conectar();
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function obtenerDatosVentaPorIdVenta($id_venta){
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_venta where id_venta = ?");
            $stm->execute(array($id_venta));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function listarDetalleVenta($cod_vent)
    {
        try
        {
            $cod = $cod_vent;
            $stm = $this->conexionn->prepare("SELECT * FROM tm_detalle_venta WHERE id_venta = ? ");
            $stm->execute(array($cod));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod,pres_prod FROM v_productos WHERE id_pres = ".$d->id_prod)
                ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function obtenerDatosClientePorIdCliente($id_cliente){
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_cliente where id_cliente = ?");
            $stm->execute(array($id_cliente));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
}

$enviarSunatModel = new EnviarSunatModel();
$id_venta = $_REQUEST['id_venta'];
$id_cliente = $_REQUEST['id_cliente'];

$datosVenta = $enviarSunatModel->obtenerDatosVentaPorIdVenta($id_venta);

$igv = 0;
foreach($datosVenta as $k => $d)
{
    $numero_factura = $d->nro_doc;
    $serie = $d->serie_doc;
    $fecha = $d->fecha_venta;
    $tipo = $d->id_tipo_doc;
    $m_bolsa = $d->bolsa;
    $igv = $d->igv;
}
$fecha = substr($fecha, 0, -9);

$nro_doc = "1";// tip0 de documento
$motivo = "1"; //codigo tipo motivo
$igv_1_18 = 1 + $igv; // valor del 1.18 para calcular base del total
//0=IGV, 1=EXONERADO
if ($igv == 0){
    $tip = 1;
} else {
    $tip = 0;
}

$razon_social = "";
$datosCliente = $enviarSunatModel->obtenerDatosClientePorIdCliente($id_cliente);
foreach($datosCliente as $k => $d)
{
    $ruc = $d->ruc;
    $dni = $d->dni;
    $razon_social = $d->razon_social;
    $nombres = $d->nombres;
    $ape_paterno = $d->ape_paterno;
    $ape_materno = $d->ape_materno;
}

if (!empty($razon_social)){
    $documento_usuario = $ruc;
    $tipo_documento_usuario = "6";
    $razon_social_usuario = $razon_social;
} else {
    $documento_usuario = $dni;
    $tipo_documento_usuario = "1";
    $razon_social_usuario = $ape_paterno." ".$ape_materno." ".$nombres;
}

$datosEmpresa = $_SESSION["datosempresa"];


foreach($datosEmpresa as $reg) {
    $fac_ele = $reg['fac_ele'];
    $clave = $reg['clave'];
    $nombre_empresa = $reg['raz_soc'];
    $departamento = "Lima";
    $provincia = "Lima";
    $distrito = "Lima";
    $ruc1 = $reg['ruc'];
    $direccion = $reg['direccion'];
}

$cantidad1 = array();
$und_pro = array();
$precio_unitario = array();
$producto = array();
$codigo = array();

$sumador_total = 0;
$nums = 1;
$suma = 0;

$listaDetalleVenta = $enviarSunatModel->listarDetalleVenta($id_venta);

foreach($listaDetalleVenta as $k => $d)
{
    // foreach($data->Detalle as $d){
    if($d->cantidad > 0){
        $id_producto = $d->id_prod;
        $cantidad = $d->cantidad;
        $nombre_producto = $d->Producto->nombre_prod;
        $pres_prod = $d->Producto->pres_prod;        
        $precio_venta = $d->precio;
        $precio_venta_f = number_format($precio_venta, 2); // Formateo variables
        $precio_venta_r = str_replace(",", "", $precio_venta_f); // Reemplazo las comas
        $precio_total = $precio_venta_r * $cantidad;
        $precio_total_f = number_format($precio_total, 2); // Precio total formateado
        $precio_total_r = str_replace(",", "", $precio_total_f); // Reemplazo las comas
        $sumador_total += $precio_total_r; // Sumador
        $suma = $suma + 1;
        $d = 0;
        $und_pro1 = "KGM";
        $cantidad1[$nums] = $cantidad.".00";
        $und_pro[$nums] = $und_pro1;
        $precio_unitario[$nums] = $precio_venta;
        $producto[$nums] = $pres_prod;
        $nombre_producto_array[$nums] = $nombre_producto;
        $codigo[$nums] = "P001"; //$codigo_producto
        $nums ++;
    }
	
}

$sumador_total = $sumador_total + number_format($m_bolsa, 2) ;

if ($tipo <= 3 or $tipo == 5 or $tipo == 6) {
    if ($tipo == 1) {
        $tipo_documento = "03"; // BOLETA
        $serie = "B".$serie;
    } 
    if ($tipo == 2) {
        $tipo_documento = "01"; // FACTURA
        $serie = "F".$serie;
    }
    if ($tipo == 3) {
        $tipo_documento = "02"; // TICKET
        $serie = "T".$serie;
    }
    if ($tipo == 5) {
        $tipo_documento = "08"; // NOTA DE DEBITO
    }
    if ($tipo == 6) {
        $tipo_documento = "07"; // NOTA DE CREDITO
    }
    
    $cabecera = array();
    // DATOS PARA LOS XML FACTURA/BOLETA/NOTA DE CREDITO/ NOTA DE DEBITO
    // EMISOR
    $cabecera["NRO_DOCUMENTO_EMPRESA"] = $ruc1;
    
    $numero_factura1 = str_pad($numero_factura, 8, "0", STR_PAD_LEFT);
    
    
    
    
    // CODIGO QR
    
    /**
     * *** FACTURA: DATOS OBLIGATORIOS PARA EL CÓDIGO QR ****
     */
    /* RUC | TIPO DE DOCUMENTO | SERIE | NUMERO | MTO TOTAL IGV | MTO TOTAL DEL COMPROBANTE | FECHA DE EMISION |TIPO DE DOCUMENTO ADQUIRENTE | NUMERO DE DOCUMENTO ADQUIRENTE | */
    $text_qr = "$ruc1|$tipo_documento|$serie|$numero_factura1|$fecha|$tipo_documento_usuario|$documento_usuario|";
    $ruta_qr = "qr/" . $id_venta . ".png";
    QRcode::png($text_qr, $ruta_qr, 'Q', 15, 0); 
  
    // CREACION DE XML DE DOCUMENTO FACTURA, BOLETA
    
    
    
   

   
    
    
}

include ("../../../constantes.php");

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!-- Meta, title, CSS, favicons, etc. -->
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Enviando</title>
</head>
<body>
	
	
   	<img src="../../../assets/img/loading.gif"  width="100" height="100">
	
	<script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
	<script src="//code.jquery.com/jquery-1.11.2.min.js"></script>
	<script>
		$(document).ready(function(){
			load(1);        
      	});
    
        function load(id){

            <?php  if ($tipo== 3){ ?>
            
                var link = '../../../lista_inf_ventas.php?c=Informe&a=Imprimir&Cod='+<?php echo $id_venta;?>;
                window.location.href = link;
            <?php  }else if($tipo==4){ ?>
                var link = '../../../lista_inf_ventas.php?c=Informe&a=NotaVenta&Cod='+<?php echo $id_venta;?>;
                window.location.href = link;
            <?php  }; ?>

           
           	
        }   
   </script>
   
</body>
</html>
