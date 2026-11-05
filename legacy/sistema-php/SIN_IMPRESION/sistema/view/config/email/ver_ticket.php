<?php
/* Connect To Database */
$id_venta = intval($_GET['id_venta']);

$sql_factura = mysqli_query($con, "select * from tm_venta where id_venta='" . $id_venta . "'");
$count = mysqli_num_rows($sql_factura);
if ($count == 0) {
    echo "<script>alert('Factura " . $id_venta . " no encontrada')</script>";
    echo "<script>window.close();</script>";
    exit();
}

$rw_factura = mysqli_fetch_array($sql_factura);
$numero_factura = $rw_factura['nro_doc'];
$folio = $rw_factura['serie_doc'];
$id_cliente = $rw_factura['id_cliente'];
$fecha_factura = $rw_factura['fecha_venta'];
$id_tipo_doc = $rw_factura['id_tipo_doc'];
$descuento = $rw_factura['descuento'];
$igv = $rw_factura['igv'];
if ($id_tipo_doc == 1) {
    $doc = "Boleta de Venta";
}
if ($id_tipo_doc == 2) {
    $doc = "Factura";
}

$doc = $doc . " Electr&oacute;nica";

$total = $rw_factura['total'];

$datosEmpresa = $_SESSION["datosempresa"];
foreach ($datosEmpresa as $reg) {
    $fac_ele = $reg['fac_ele'];
    $clave = $reg['clave'];
    $nombre_empresa = $reg['raz_soc'];
    $departamento = "Lima";
    $provincia = "Lima";
    $distrito = "Lima";
    $ruc = $reg['ruc'];
    $direccion = $reg['direccion'];
}
$nombre_empresa = str_replace("&amp;", "&", $nombre_empresa);

$sql_cliente = mysqli_query($con, "select * from tm_cliente where id_cliente='$id_cliente'");
$rw_cliente = mysqli_fetch_array($sql_cliente);
$nombre_cliente = "";
$razon_social = $rw_cliente['razon_social'];
$doc1 = "";
$tipo_doc = "";
if (empty($razon_social)) {
    $nombre_cliente = $rw_cliente['nombres'] . " " . $rw_cliente['ape_paterno'] . " " . $rw_cliente['ape_materno'];
    $doc1 = $rw_cliente['dni'];
    $tipo_doc = "D.N.I";
} else {
    $nombre_cliente = $razon_social;
    $doc1 = $rw_cliente['ruc'];
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
        R.U.C:<?php echo $ruc; ?><br>
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
    if (!empty($rw_cliente['direccion'])) {
        print "<tr><td>Direcci&oacute;n: $rw_cliente[direccion]</td></tr>";
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

$sql = mysqli_query($con, "select * from tm_detalle_venta, tm_venta 
                        where tm_detalle_venta.id_venta=tm_venta.id_venta and tm_venta.id_venta='" . $id_venta . "' ");

$tipo = 1;
$suma = 0;
$codigo_producto = "";
while ($row = mysqli_fetch_array($sql)) {
    $id_producto = $row["id_prod"];
    $cantidad1 = $row['cantidad'];

    $sql2 = mysqli_query($con, "select * from tm_producto where id_prod='" . $id_producto . "'");
    $row2 = mysqli_fetch_array($sql2);
    $nombre_producto = $row2["nombre"];
    $precio_venta = $row['precio'];
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
}
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
                echo $_SESSION["moneda"] . " " . number_format($total, 2);
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
        	echo $_SESSION["moneda"] . " " .  number_format($descuento, 2);
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
            echo $_SESSION["moneda"] . " " . number_format($sbt, 2);
            ?></b></td>
		</tr>
		<tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td align="right"><b><?php echo $_SESSION["impAcr"]. '(' . $igv . '):';?></b></td>
            <td align="right"><b>
            <?php
            echo $_SESSION["moneda"] . " " . number_format($igv_calc, 2);
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
            echo $_SESSION["moneda"] . " " . number_format(($total - $descuento), 2);
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
