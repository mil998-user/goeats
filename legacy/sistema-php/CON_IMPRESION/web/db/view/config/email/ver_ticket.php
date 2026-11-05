<?php

include "../../../core/autoload.php";
include "../../../core/app/model/ConfiguracionData.php";
include "../../../core/app/model/ProcesoData.php";
include "../../../core/app/model/PersonaData.php";
include "../../../core/app/model/FacturasData.php";

/* Connect To Database */
$id_venta = intval($_GET['id_venta']);


require_once ("../../../model/db.php"); // Contiene las variables de configuracion para conectar a la base de datos
require_once ("../../../model/conexion.php");

$rw_factura = ProcesoData::getById($id_venta);

if(count($rw_factura)<=0){

	echo "<script>alert('Factura " . $id_venta . " no encontrada')</script>";
    echo "<script>window.close();</script>";
    exit();
}


$numero_factura = $rw_factura->nro_folio;
$folio = $rw_factura->serie_doc;
$id_cliente = $rw_factura->id_cliente;
$fecha_factura = $rw_factura->fecha_creada;
$id_tipo_doc = $rw_factura->comprobante;
$descuento = $rw_factura->descuento;
$igv = $rw_factura->igv;
if ($id_tipo_doc == 1) {
    $doc = "Boleta de Venta";
}
if ($id_tipo_doc == 2) {
    $doc = "Factura";
}

$doc = $doc . " Electr&oacute;nica";

$total = $rw_factura->total_factura;

$configuracion = ConfiguracionData::getAllConfiguracion(); 
if(@count($configuracion)>0){ 

    $fac_ele = $configuracion->fac_ele;
    $clave = $configuracion->clave;
    $usuario_sol = $configuracion->usuariosol;
    $pass_sol = $configuracion->clavesol;
    $nombre_empresa = $configuracion->registro_empresarial;
    $departamento = "SAN MARTIN";
    $provincia = "SAN MARTIN";
    $distrito = "TARAPOTO";
    $ruc1 = $configuracion->rnc;
    $direccion = $configuracion->direccion;
    $nombre_empresa=$configuracion->nombre;
}else{

                           
}

$nombre_empresa = str_replace("&amp;", "&", $nombre_empresa);

$rw_cliente = PersonaData::getById($rw_factura->id_cliente);

$nombre_cliente = "";
$razon_social = $rw_cliente->razon_social;
$doc1 = "";
$tipo_doc = "";
if (empty($razon_social)) {
    $nombre_cliente = $rw_cliente->nombre;
    $doc1 = $rw_cliente->documento;
    $tipo_doc = "D.N.I";
} else {
    $nombre_cliente = $razon_social;
    $doc1 = $rw_cliente->ruc;
    $tipo_doc = "R.U.C";
}
$nombre_cliente = str_replace("&amp;", "&", $nombre_cliente);

?>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<link href="ticket.css" rel="stylesheet" type="text/css">
</head>
<body id="cuerpoPagina">

	<br>
	<table border="0" align="center" width="300px">
		<tr>
			<td align="center">.::<strong> <?php echo $nombre_empresa; ?></strong>::.<br>
        R.U.C:<?php echo $ruc1; ?><br>
			</td>
		</tr>
		<tr>
			<td align="center"><?php echo "Fecha/Hora: ".$fecha_factura; ?></td>
		</tr>
		<tr>
			<td align="center"></td>
		</tr>
		<tr>
			<td><?php echo $doc; ?>: <?php $numero_factura2=str_pad($numero_factura, 8, "0", STR_PAD_LEFT);print"$folio-$numero_factura2"; ?></td>
		</tr>
		<tr>
			<td>Cliente: <?php echo $nombre_cliente; ?></td>
		</tr>
		<tr>
			<td><?php echo $tipo_doc; ?>: <?php echo $doc1; ?></td>
		</tr>
    <?php
    if (!empty($rw_cliente->direccion)) {
        print "<tr><td>Direcci&oacute;n: $rw_cliente->direccion</td></tr>";
    }
    ?>
</table>
	<br>
	<table border="0" align="center" width="300px">
		<tr>
			<td colspan="4">======================================================</td>
		</tr>
		<tr>
			<td>PRODUCTO</td>
			<td>CANT.</td>
			<td>P.UN.</td>
			<td align="right">IMP.</td>
		</tr>
		<tr>
			<td colspan="4">======================================================</td>
		</tr>
<?php
$nums = 1;
$sumador_total = 0; 



$facturas=FacturasData::getAllProceso($rw_factura->id);
$tipo = 1;
$suma = 0;
$codigo_producto = "";

foreach($facturas as $p):  
	$id_producto = $p->id;
    $cantidad1 = $p->cantidad;

    $nombre_producto = $p->nombre_producto;
    $precio_venta = $p->precio;
    $precio_venta_f = number_format($precio_venta, 2); // Formateo variables
    $precio_venta_r = str_replace(",", "", $precio_venta_f); // Reemplazo las comas
    $precio_total = $precio_venta_r * $cantidad1;
    $precio_total_f = number_format($precio_total, 2); // Precio total formateado
    $precio_total_r = str_replace(",", "", $precio_total_f); // Reemplazo las comas
    $sumador_total += $precio_total_r; // Sumador

    echo "<tr>";
        echo "<td>" . $cantidad1 . "</td>";
        echo "<td>" . $nombre_producto . "</td>";
        echo "<td>" . $precio_venta_f . "</td>";
        echo "<td align='right'>" . $precio_total_f . "</td>";
    echo "</tr>";
    $suma = $suma + 1;
 
  
endforeach; 

?>
		<tr>
			<td colspan="4">======================================================</td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td align="right"><b>Importe Total:</b></td>
			<td align="right"><b>
                <?php
                echo  "S/ " . number_format($total, 2);
                ?></b></td>
		</tr>
		<tr>
			<td colspan="4">======================================================</td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td align="right"><b>Dscto:</b></td>
			<td align="right"><b>  
        	<?php
        	echo "S/ " .  number_format($descuento, 2);
            ?></b></td>
		</tr>
<?php
$sbt = (($total - $descuento) / (1 + $igv));
$igv_calc = ($sbt * $igv);
if ($id_tipo_doc == 2) {
    ?>
    	<tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td align="right"><b>SubTotal:</b></td>
            <td align="right"><b>
            <?php
            echo "S/ " . number_format($sbt, 2);
            ?></b></td>
		</tr>
		<tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td align="right"><b><?php echo "IGV". '(' . $igv . '):';?></b></td>
            <td align="right"><b>
            <?php
            echo "S/ " . number_format($igv_calc, 2);
            ?></b></td>
		</tr>
	<?php 
}
?>
		<tr>
			<td colspan="4">======================================================</td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td>&nbsp;</td>
			<td align="right"><b>TOTAL A PAGAR:</b></td>
			<td align="right"><b>
            <?php
            echo "S/ " . number_format(($total - $descuento), 2);
            ?></b></td>
		</tr>
		<tr> 
			<td colspan="4">======================================================</td>
		</tr>
		<tr>
			<td colspan="4"><br>Nro de art&iacute;culos: <?php echo $suma ?></td>
		</tr>
		<tr>
			<td colspan="4" align="center"><img src="cid:my-attach" width="100"
				height="100"></td>
		</tr>
		<tr>
			<td colspan="4" align="center">&iexcl;Gracias por su compra&#33;</td>
		</tr>
	</table>
	<br>
	</div>
	<p>&nbsp;</p>
	<p>&nbsp;</p>

	<p>

</body>
</html>
