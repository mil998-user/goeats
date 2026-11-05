<?php
session_start();
header('Content-Type: text/html; charset=UTF-8');
// http://contenido.app.sunat.gob.pe/insc/ComprobantesDePago/GuiasManualesJul_2012/Manual+de+autorizacion.pdf
if (! isset($_SESSION['user_login_status']) and $_SESSION['user_login_status'] != 1) {
    header("location: ../../login.php");
    exit();
}
include ("../../config/db.php");
include ("../../config/conexion.php");
include ("funciones.php");
require "phpqrcode/qrlib.php";
$session_id = session_id();
$tienda1 = 1;
$tienda2 = 1;
$doc1 = $_GET['doc1'];
$tip_doc = intval($_GET['tip_doc']);

$id_tmp_factura = 0;
if (isset($_GET['id_tmp_factura'])) {
    $id_tmp_factura = $_GET['id_tmp_factura'];
}
$tip = 1;
if (isset($_GET['tip'])) {
    $tip = intval($_GET['tip']);
}

if (isset($_GET['tienda'])) {
    $tienda2 = $_GET['tienda'];
    $tienda1 = $_GET['tienda'];
}

$query_select = "select * from tmp_detalle_facturas where id_tmp_factura='" . $id_tmp_factura . "'";
$sql_count = mysqli_query($con, $query_select);
$count = mysqli_num_rows($sql_count);
if ($count == 0) {
    echo "<script>alert('No hay productos agregados a la factura: $query_select');event.preventDefault();</script>";
    echo "<script>event.preventDefault();</script>";
    exit();
}
$query = "select * from tmp_detalle_facturas,products where tmp_detalle_facturas.id_tmp_factura='" . $id_tmp_factura . "' and products.id_producto=tmp_detalle_facturas.id_producto and tmp_detalle_facturas.cantidad_tmp>products.b$tienda2";
$sql_count1 = mysqli_query($con, $query);

$count1 = mysqli_num_rows($sql_count1);
if ($count1 > 0) {
    echo "<script>alert('Se ha producido un error Hay $count1 producto(s) que han sobrepasado el stock no se guardo la venta');event.preventDefault();</script>";
    exit();
}

require_once (dirname(__FILE__) . '/../html2pdf.class.php');
$nombre_cliente1 = mysqli_real_escape_string($con, (strip_tags($_GET["nombre_cliente"], ENT_QUOTES)));
;
$direccion = $_GET['direccion'];
if ($tip_doc == 1) {
    $dni = str_pad($doc1, 8, "0", STR_PAD_LEFT);
    $doc = 0;
    $documento = $dni;
} else {
    $dni = 0;
    $doc = $doc1;
    $documento = $doc;
}

$sql_empresa = mysqli_query($con, "select * from datosempresa where id_emp=1");
$rw_empresa = mysqli_fetch_array($sql_empresa);
$fac_ele = $rw_empresa['fac_ele'];
$clave = $rw_empresa['clave'];
$tel1 = $_GET['tel1'];
$mail = $_GET['mail'];
$des = $_GET['des'];

// CREAR CLIENTE NUEVO O EDITAR CLIENTE SI EXISTE
if ($documento == "") {
    $documento = "00000000";
    $tip_doc = "1";
}

$sql1 = "SELECT * FROM clientes WHERE tipo1 = " . $tip_doc . " and documento = '" . $documento . "';";
$accion3 = mysqli_query($con, $sql1);
$row3 = mysqli_fetch_array($accion3);
$id_cliente = $row3["id_cliente"];
if ($id_cliente == "") {
    if ($dni == 0) {
        $sql = "INSERT INTO clientes (nombre_cliente, telefono_cliente, email_cliente, direccion_cliente, status_cliente, date_added,doc,dni,vendedor,pais,departamento,provincia,distrito,cuenta,tipo1,tienda,users,deuda,debe,documento) VALUES ('','','','','1','','$doc','$doc','','Peru','','','','','$tip_doc','$tienda1','0','0','0','$documento')";
        $query_new_insert = mysqli_query($con, $sql);
    } else {
        $sql = "INSERT INTO clientes (nombre_cliente, telefono_cliente, email_cliente, direccion_cliente, status_cliente, date_added,doc,dni,vendedor,pais,departamento,provincia,distrito,cuenta,tipo1,tienda,users,deuda,debe,documento) VALUES ('pruebaaaa','$tel1','$mail','$direccion','1','','$doc','$dni','','Peru','','','','','$tip_doc','$tienda1','0','0','0','$documento')";
        $query_new_insert = mysqli_query($con, $sql);
    }
    if ($query_new_insert) {
        echo "Cliente ha sido ingresado satisfactoriamente.";
    } else {
        echo "Error.";
    }
    $accion2 = mysqli_query($con, "select * from clientes where tipo1= " . $tip_doc . " ORDER BY  `clientes`.`id_cliente` DESC LIMIT 0 , 1");
    $row1 = mysqli_fetch_array($accion2);
    $id_cliente = $row1["id_cliente"];
}

$id_vendedor = $_SESSION['user_id'];
$fecha = $_GET['fecha'];
$dolar = $_GET['tcp'];
$folio = $_GET['folio'];
$motivo = $_GET['motivo'];
$nro_doc = 0;
$nro_doc = $_GET['nro_doc'];
$razon_comercial = "Computadoras";
$hora = $_GET['hora'];
$moneda = intval($_GET['moneda']);
$moneda1 = 1;
$dias = intval($_GET['dias']);
$condiciones = mysqli_real_escape_string($con, (strip_tags($_REQUEST['condiciones'], ENT_QUOTES)));
$sql = mysqli_query($con, "select LAST_INSERT_ID(numero_factura) as last from facturas order by id_factura desc limit 0,1 ");
$rw = mysqli_fetch_array($sql);
$numero_factura = intval($_GET['factura']);
date_default_timezone_set('America/Lima');
$sql_cliente = mysqli_query($con, "select * from clientes where id_cliente='$id_cliente'");
$rw_cliente = mysqli_fetch_array($sql_cliente);
$ruc = $rw_cliente["doc"];
$dni = $rw_cliente["dni"];
$nombre_cliente = $rw_cliente["nombre_cliente"];
$nums = 1;
$sumador_total = 0;
$servicio = 0;
$suma = 0;
$tipo = $_SESSION['doc_ventas'];
$ddd = 1;
if ($tipo == 8) {
    $ddd = 0;
}

$producto1 = "";
$cantidad1 = array();
$und_pro = array();
$tipo_cantidad = array();
$precio_unitario = array();
$valor_unitario = array();
$total_producto = array();
$total_igv = array();
$producto = array();
$codigo = array();
$sql = mysqli_query($con, "select * from tmp_detalle_facturas where tmp_detalle_facturas.id_tmp_factura='" . $id_tmp_factura . "'");
// COPIAR LOS PRODUCTOS
while ($row = mysqli_fetch_array($sql)) {
    $id_tmp = $row["id_tmp_detalle_factura"];
    $id_producto = $row["id_producto"];
    $cantidad = $row['cantidad_tmp'];
    $codigo_producto = "SER";
    $nombre_producto = $row['id_producto'];
    $precio_venta = $row['precio_tmp'];
    $servicio = 1;
    $precio_venta_f = number_format($precio_venta, 2); // Formateo variables
    $precio_venta_r = str_replace(",", "", $precio_venta_f); // Reemplazo las comas
    $precio_total = $precio_venta_r * $cantidad;
    $precio_total_f = number_format($precio_total, 2); // Precio total formateado
    $precio_total_r = str_replace(",", "", $precio_total_f); // Reemplazo las comas
    $sumador_total += $precio_total_r; // Sumador
    $suma = $suma + 1;
    $fecha1 = date("Y-m-d", strtotime($fecha));
    $medida = "NIU"; // medida del producto en unidades
    $date_added = $fecha1 . " " . $hora;
    $tienda2 = $_GET['tienda'];
    $c = $tienda2;
    $d = 0;
    $und_pro1 = "ZZ";
    $costo = 0;
    if ($id_producto > 0) {
        $sql3 = mysqli_query($con, "select * from products,und where products.und_pro=und.id_und and products.id_producto='" . $id_producto . "'");
        $row3 = mysqli_fetch_array($sql3);
        $b = "b$tienda2";
        $d = $row3["b$tienda2"];
        $codigo_producto = $row3['codigo_producto'];
        $nombre_producto = $row3['nombre_producto'];
        $und_pro1 = $row3['xml_und'];
        $costo = $row3["costo_producto"];
    }
    $igv = 0.18;
    $cantidad1[$nums] = $cantidad;
    $und_pro[$nums] = $und_pro1;
    $tipo_cantidad[$nums] = $medida;
    $precio_unitario[$nums] = $precio_venta;
    $a = 1.18;
    $valor_unitario[$nums] = round($precio_venta / $a, 2);
    $total_producto[$nums] = round($valor_unitario[$nums] * $cantidad, 2);
    $total_igv[$nums] = round($igv * $total_producto[$nums], 2);
    $producto[$nums] = $nombre_producto;
    $codigo[$nums] = $codigo_producto;
    
    // INSERTAR DETALLE FACTURA
    $insert_sql_det = "INSERT INTO detalle_factura VALUES (NULL,'$id_cliente','$id_vendedor','$numero_factura','$des','$id_producto','$cantidad','$precio_venta_r','$c','$ddd','1','$date_added','$costo','$tipo','$d','$moneda1','$folio')";
    $insert_detail = mysqli_query($con, $insert_sql_det);
    // ACTUALIZAR STOCK PARA FACTURAS/BOLETA/NOTA DE CREDITO
    if ($id_producto > 0) {
        if ($des == 1) {
            
            $productos1 = mysqli_query($con, "UPDATE products SET $b=$b-$cantidad,precio_producto=$precio_venta_r WHERE id_producto=$id_producto and pro_ser=1");
        }
        if ($des == 2) {
            $productos1 = mysqli_query($con, "UPDATE products SET $b=$b+$cantidad,precio_producto=$precio_venta_r WHERE id_producto=$id_producto and pro_ser=1");
        }
    }
    $nums ++;
    // fin
}
$subtotal = number_format($sumador_total, 2, '.', '');
$total_iva = ($subtotal * 18) / 100;
$total_iva = number_format($total_iva, 2, '.', '');
$total_factura = $subtotal - $total_iva;
if ($_SESSION['doc_ventas'] == 1) {
    $decimales = explode(".", number_format($subtotal, 2));
    $entera = explode(".", $subtotal);
    $texto_moneda = convertir($entera[0]) . ' y ' . $decimales[1] . '/100 NUEVOS SOLES';
}
if ($condiciones == 4) {
    $deuda = $sumador_total;
} else {
    $deuda = 0;
}
$fecha1 = date("Y-m-d", strtotime($fecha));
$date = $fecha1 . " " . $hora;
$condiciones1 = "";

$t1 = $_GET['tienda'];
$cuenta = "";
$tienda = "tienda" . $c;
$documento = mysqli_query($con, "UPDATE documento SET $tienda=$tienda+1 WHERE id_documento=$tipo");
$dolar1 = mysqli_query($con, "UPDATE datosempresa SET dolar=$dolar WHERE id_emp=1");
$deuda1 = mysqli_query($con, "UPDATE clientes SET deuda=deuda+$deuda WHERE id_cliente=$id_cliente");
$insert = mysqli_query($con, "INSERT INTO facturas VALUES (NULL,'$numero_factura','$date','0','$nro_doc','$id_cliente','0','$id_vendedor','$condiciones','$sumador_total','$deuda','$tipo','$t1','1','$ddd','1','$moneda1','$des','','0','2018-11-11','$dias','$folio','$des','','0','$motivo','$tip')");
// INSERT INTO facturas VALUES (NULL,'95','2019-01-11 12:17:40','0','undefined','192','0','1','1','20','0','2','1','1','1','1','1','1','','0','2018-11-11','0','B002','1','','0','undefined','0')
$valor34 = "INSERT INTO facturas VALUES (NULL,'$numero_factura','$date','0','$nro_doc','$id_cliente','0','$id_vendedor','$condiciones','$sumador_total','$deuda','$tipo','$c','1','$ddd','1','$moneda1','$des','','0','2018-11-11','$dias','$folio','$des','','0','$motivo','$tip')";
/* $delete=mysqli_query($con,"DELETE FROM tmp WHERE session_id='".$session_id."'"); RO */
/* RASW */

$mesa_update = mysqli_query($con, "UPDATE mesa m inner join tmp_facturas t on m.id_mesa = t.id_mesa set m.estado_mesa=0 where t.id_tmp_factura='" . $id_tmp_factura . "'");
$delete = mysqli_query($con, "DELETE FROM tmp_detalle_facturas WHERE id_tmp_factura='" . $id_tmp_factura . "'");
$delete = mysqli_query($con, "DELETE FROM tmp_facturas WHERE id_tmp_factura='" . $id_tmp_factura . "'");
/* RASW */
$accion1 = mysqli_query($con, "select * from facturas where numero_factura='" . $numero_factura . "' and folio='" . $folio . "' and estado_factura='" . $tipo . "' and tienda=$t1");
$row1 = mysqli_fetch_array($accion1);
$id_factura = $row1["id_factura"];

if ($tipo <= 2 or $tipo == 5 or $tipo == 6) {
    if ($tipo == 1) {
        $tipo_documento = "01"; // FACTURA
    }
    if ($tipo == 2) {
        $tipo_documento = "03"; // BOLETA
    }
    if ($tipo == 5) {
        $tipo_documento = "08"; // NOTA DE DEBITO
    }
    if ($tipo == 6) {
        $tipo_documento = "07"; // NOTA DE CREDITO
    }
    $sql2 = mysqli_query($con, "select * from sucursal where tienda='$tienda2'");
    $row2 = mysqli_fetch_array($sql2);
    $nombre = $row2["nombre"];
    $departamento = $row2['dep_suc'];
    $provincia = $row2['pro_suc'];
    $distrito = $row2['dis_suc'];
    
    $ruc1 = $row2['ruc'];
    $direccion = $row2['direccion'];
    if ($ruc != "") {
        $documento_usuario = $ruc;
        $tipo_documento_usuario = "6";
    }
    if ($ruc == "0" and $dni != "") {
        $documento_usuario = $dni;
        $tipo_documento_usuario = "1";
    }
    $razon_social_usuario = $nombre_cliente;
    
    $cabecera = array();
    // DATOS PARA LOS XML FACTURA/BOLETA/NOTA DE CREDITO/ NOTA DE DEBITO
    // EMISOR
    $cabecera["NRO_DOCUMENTO_EMPRESA"] = $ruc1;
    
    $numero_factura1 = str_pad($numero_factura, 8, "0", STR_PAD_LEFT);
    
    $cabecera["NRO_COMPROBANTE"] = $folio . "-" . $numero_factura1;
    $tipo_doc = $tipo_documento;
    $cabecera["FECHA_DOCUMENTO"] = $fecha;
    $cabecera["FECHA_VTO"] = $fecha;
    $cabecera["COD_TIPO_DOCUMENTO"] = $tipo_documento;
    $cabecera["TOTAL_LETRAS"] = "";
    $cabecera["NRO_OTR_COMPROBANTE"] = "";
    $cabecera["NRO_GUIA_REMISION"] = "";
    $cabecera["TIPO_DOCUMENTO_EMPRESA"] = 6;
    $moneda = "PEN";
    $cabecera["RAZON_SOCIAL_EMPRESA"] = $nombre;
    $cabecera["NOMBRE_COMERCIAL_EMPRESA"] = $nombre;
    $cabecera["DEPARTAMENTO_EMPRESA"] = $departamento;
    $cabecera["PROVINCIA_EMPRESA"] = $provincia;
    $cabecera["DISTRITO_EMPRESA"] = $distrito;
    $cabecera["DIRECCION_EMPRESA"] = $direccion;
    $cabecera["CONTACTO_EMPRESA"] = "";
    $cabecera["COD_PAIS_CLIENTE"] = "PE";
    $doc_emisor = 6;
    // Solo para NOTA DE CREDITO Y NOTA DE DEBITO
    $cabecera["NRO_DOCUMENTO_MODIFICA"] = $nro_doc;
    $cabecera["COD_TIPO_MOTIVO"] = $motivo;
    $cabecera["TIPO_COMPROBANTE_MODIFICA"] = tipo_comp($nro_doc);
    
    $r = "";
    if ($tipo == 6) {
        if ($motivo == "01") {
            $r = "ANULACION DE LA OPERACION";
        }
        if ($motivo == "02") {
            $r = "ANULACION POR ERROR EN EL RUC";
        }
        if ($motivo == "03") {
            $r = "CORRECION POR ERROR EN LA DESCRIPCION";
        }
        if ($motivo == "04") {
            $r = "DESCUENTO GLOBAL";
        }
        if ($motivo == "05") {
            $r = "DESCUENTO POR ITEM";
        }
        if ($motivo == "06") {
            $r = "DEVOLUCION TOTAL";
        }
        if ($motivo == "07") {
            $r = "DEVOLUCION POR ITEM";
        }
        if ($motivo == "08") {
            $r = "BONIFICACION";
        }
        if ($motivo == "09") {
            $r = "DISMINUCION EN EL VALOR";
        }
    }
    if ($tipo == 5) {
        if ($motivo == "01") {
            $r = "INTERES POR MORA";
        }
        if ($motivo == "02") {
            $r = "AUMENTO EN EL VALOR";
        }
        if ($motivo == "03") {
            $r = "PENALIDADES";
        }
    }
    $cabecera["DESCRIPCION_MOTIVO"] = $r;
    
    // DATOS DEL CLIENTE
    $cabecera["NRO_DOCUMENTO_CLIENTE"] = $documento_usuario;
    $cabecera["RAZON_SOCIAL_CLIENTE"] = $razon_social_usuario;
    $cabecera["COD_UBIGEO_CLIENTE"] = "";
    $igv = 0.18;
    $cabecera["TIPO_DOCUMENTO_CLIENTE"] = $tipo_documento_usuario;
    $cabecera["DEPARTAMENTO_CLIENTE"] = "";
    $cabecera["PROVINCIA_CLIENTE"] = "";
    $cabecera["DISTRITO_CLIENTE"] = "";
    $cabecera["DIRECCION_CLIENTE"] = "";
    $cabecera["COD_PAIS_CLIENTE"] = "PE";
    $cabecera["COD_MONEDA"] = "PEN";
    $cabecera["TOTAL_ISC"] = 0;
    $cabecera["TOTAL_EXPORTACION"] = 0;
    $cabecera["TOTAL_GRATUITAS"] = 0;
    $cabecera["COD_TIPO_OPERACION"]=10;
    
    if ($tip == 0) {
        $cabecera["TOTAL_EXONERADAS"] = 0;
        $cabecera["TOTAL_INAFECTA"] = 0;
        $cabecera["TOTAL_OTR_IMP"] = 0;
        $total = round($sumador_total, 2);
        $cabecera["TOTAL_GRAVADAS"] = round($sumador_total / 1.18, 2);
        $cabecera["TOTAL_IGV"] = round(($sumador_total / 1.18) * $igv, 2);
        $cabecera["SUB_TOTAL"] = round($sumador_total / 1.18, 2);
        $cabecera["TOTAL"] = round($sumador_total, 2);
        $cabecera["TOTAL_DESCUENTO"] = 0;
        $mto_igv = round(($sumador_total / 1.18) * $igv, 2);
    }
    if ($tip == 1) {
        $cabecera["TOTAL_EXONERADAS"] = 0;
        $cabecera["TOTAL_INAFECTA"] = 0;
        $cabecera["TOTAL_OTR_IMP"] = 0;
        $total = round($sumador_total, 2);
        $cabecera["TOTAL_GRAVADAS"] = round($sumador_total / 1.18, 2);
        $cabecera["TOTAL_IGV"] = "0.00";
        $cabecera["SUB_TOTAL"] = round($sumador_total, 2);
        $cabecera["TOTAL"] = round($sumador_total, 2);
        $cabecera["TOTAL_DESCUENTO"] = 0;
        $cabecera["TOTAL_EXONERADAS"] = round($sumador_total, 2);
        $mto_igv = 0;
    }
    
    // CODIGO QR
    
    /**
     * *** FACTURA: DATOS OBLIGATORIOS PARA EL CÓDIGO QR ****
     */
    /* RUC | TIPO DE DOCUMENTO | SERIE | NUMERO | MTO TOTAL IGV | MTO TOTAL DEL COMPROBANTE | FECHA DE EMISION |TIPO DE DOCUMENTO ADQUIRENTE | NUMERO DE DOCUMENTO ADQUIRENTE | */
    $text_qr = "$ruc1|$tipo_documento|$folio|$numero_factura1|$mto_igv|$total|$fecha|$tipo_documento_usuario|$documento_usuario|";
    $ruta_qr = "qr/" . $id_factura . ".png";
    QRcode::png($text_qr, $ruta_qr, 'Q', 15, 0);
    // CREACION DE XML DE DOCUMENTO FACTURA, BOLETA
    $doc = new DOMDocument();
    $doc->formatOutput = FALSE;
    $doc->preserveWhiteSpace = TRUE;
    $doc->encoding = 'utf-8';
    $nums1 = $nums - 1;
    if ($tipo <= 2) {
        $xmlCPE = '<?xml version="1.0" encoding="utf-8"?>
<Invoice xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
	<ext:UBLExtensions>
		<ext:UBLExtension>
			<ext:ExtensionContent>
			</ext:ExtensionContent>
		</ext:UBLExtension>
	</ext:UBLExtensions>
	<cbc:UBLVersionID>2.1</cbc:UBLVersionID>
	<cbc:CustomizationID schemeAgencyName="PE:SUNAT">2.0</cbc:CustomizationID>
	<cbc:ProfileID schemeName="Tipo de Operacion" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51">' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:ProfileID>
	<cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
	<cbc:IssueDate>' . $cabecera["FECHA_DOCUMENTO"] . '</cbc:IssueDate>
	<cbc:IssueTime>00:00:00</cbc:IssueTime>
	<cbc:DueDate>' . $cabecera["FECHA_VTO"] . '</cbc:DueDate>
	<cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listID="0101" name="Tipo de Operacion" listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51">' . $cabecera["COD_TIPO_DOCUMENTO"] . '</cbc:InvoiceTypeCode>';
        if ($cabecera["TOTAL_LETRAS"] != "") {
            $xmlCPE = $xmlCPE . '<cbc:Note languageLocaleID="1000">' . $cabecera["TOTAL_LETRAS"] . '</cbc:Note>';
        }
        $xmlCPE = $xmlCPE . '<cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">' . $cabecera["COD_MONEDA"] . '</cbc:DocumentCurrencyCode>
            <cbc:LineCountNumeric>' . $nums1 . '</cbc:LineCountNumeric>';
        if ($cabecera["NRO_OTR_COMPROBANTE"] != "") {
            $xmlCPE = $xmlCPE . '<cac:OrderReference>
                    <cbc:ID>' . $cabecera["NRO_OTR_COMPROBANTE"] . '</cbc:ID>
            </cac:OrderReference>';
        }
        if ($cabecera["NRO_GUIA_REMISION"] != "") {
            $xmlCPE = $xmlCPE . '<cac:DespatchDocumentReference>
		<cbc:ID>' . $cabecera["NRO_GUIA_REMISION"] . '</cbc:ID>
		<cbc:IssueDate>' . $cabecera["FECHA_GUIA_REMISION"] . '</cbc:IssueDate>
		<cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">' . $cabecera["COD_GUIA_REMISION"] . '</cbc:DocumentTypeCode>
            </cac:DespatchDocumentReference>';
        }
        $xmlCPE = $xmlCPE . '<cac:Signature>
		<cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
		<cac:SignatoryParty>
			<cac:PartyIdentification>
				<cbc:ID>' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
			</cac:PartyIdentification>
			<cac:PartyName>
				<cbc:Name>' . $cabecera["RAZON_SOCIAL_EMPRESA"] . '</cbc:Name>
			</cac:PartyName>
		</cac:SignatoryParty>
		<cac:DigitalSignatureAttachment>
			<cac:ExternalReference>
				<cbc:URI>#' . $cabecera["NRO_COMPROBANTE"] . '</cbc:URI>
			</cac:ExternalReference>
		</cac:DigitalSignatureAttachment>
	</cac:Signature>
	<cac:AccountingSupplierParty>
		<cac:Party>
			<cac:PartyIdentification>
				<cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
			</cac:PartyIdentification>
			<cac:PartyName>
				<cbc:Name><![CDATA[' . $cabecera["NOMBRE_COMERCIAL_EMPRESA"] . ']]></cbc:Name>
			</cac:PartyName>
			<cac:PartyTaxScheme>
				<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
				<cbc:CompanyID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:CompanyID>
				<cac:TaxScheme>
					<cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
				</cac:TaxScheme>
			</cac:PartyTaxScheme>
			<cac:PartyLegalEntity>
				<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
				<cac:RegistrationAddress>
					<cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI" />
					<cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
					<cbc:CityName><![CDATA[' . $cabecera["DEPARTAMENTO_EMPRESA"] . ']]></cbc:CityName>
					<cbc:CountrySubentity><![CDATA[' . $cabecera["PROVINCIA_EMPRESA"] . ']]></cbc:CountrySubentity>
					<cbc:District><![CDATA[' . $cabecera["DISTRITO_EMPRESA"] . ']]></cbc:District>
					<cac:AddressLine>
						<cbc:Line><![CDATA[' . $cabecera["DIRECCION_EMPRESA"] . ']]></cbc:Line>
					</cac:AddressLine>
					<cac:Country>
						<cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">' . "PE" . '</cbc:IdentificationCode>
					</cac:Country>
				</cac:RegistrationAddress>
			</cac:PartyLegalEntity>
			<cac:Contact>
				<cbc:Name><![CDATA[' . $cabecera["CONTACTO_EMPRESA"] . ']]></cbc:Name>
			</cac:Contact>
		</cac:Party>
	</cac:AccountingSupplierParty>
	<cac:AccountingCustomerParty>
		<cac:Party>
			<cac:PartyIdentification>
				<cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
			</cac:PartyIdentification>
			<cac:PartyName>
				<cbc:Name><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:Name>
			</cac:PartyName>
			<cac:PartyTaxScheme>
				<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
				<cbc:CompanyID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:CompanyID>
				<cac:TaxScheme>
					<cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
				</cac:TaxScheme>
			</cac:PartyTaxScheme>
			<cac:PartyLegalEntity>
				<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
				<cac:RegistrationAddress>
					<cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI">' . $cabecera["COD_UBIGEO_CLIENTE"] . '</cbc:ID>
					<cbc:CityName><![CDATA[' . $cabecera["DEPARTAMENTO_CLIENTE"] . ']]></cbc:CityName>
					<cbc:CountrySubentity><![CDATA[' . $cabecera["PROVINCIA_CLIENTE"] . ']]></cbc:CountrySubentity>
					<cbc:District><![CDATA[' . $cabecera["DISTRITO_CLIENTE"] . ']]></cbc:District>
					<cac:AddressLine>
						<cbc:Line><![CDATA[' . $cabecera["DIRECCION_CLIENTE"] . ']]></cbc:Line>
					</cac:AddressLine>
					<cac:Country>
						<cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">' . $cabecera["COD_PAIS_CLIENTE"] . '</cbc:IdentificationCode>
					</cac:Country>
				</cac:RegistrationAddress>
			</cac:PartyLegalEntity>
		</cac:Party>
	</cac:AccountingCustomerParty>
	<cac:AllowanceCharge>
		<cbc:ChargeIndicator>false</cbc:ChargeIndicator>
		<cbc:AllowanceChargeReasonCode listName="Cargo/descuento" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo53">02</cbc:AllowanceChargeReasonCode>
		<cbc:MultiplierFactorNumeric>0.00</cbc:MultiplierFactorNumeric>
		<cbc:Amount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:Amount>
		<cbc:BaseAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:BaseAmount>
	</cac:AllowanceCharge>
	<cac:TaxTotal>
		<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>';
        if ($tip == 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRAVADAS"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">1000</cbc:ID>
					<cbc:Name>IGV</cbc:Name>
					<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        if ($cabecera["TOTAL_ISC"] > 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_ISC"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_ISC"] . '</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">2000</cbc:ID>
					<cbc:Name>ISC</cbc:Name>
					<cbc:TaxTypeCode>EXC</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        // CAMPO NUEVO
        if ($cabecera["TOTAL_EXPORTACION"] > 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_EXPORTACION"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">G</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9995</cbc:ID>
					<cbc:Name>EXP</cbc:Name>
					<cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        if ($cabecera["TOTAL_GRATUITAS"] > 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRATUITAS"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">Z</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9996</cbc:ID>
					<cbc:Name>GRA</cbc:Name>
					<cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        if ($cabecera["TOTAL_EXONERADAS"] > 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_EXONERADAS"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">E</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9997</cbc:ID>
					<cbc:Name>EXO</cbc:Name>
					<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        if ($cabecera["TOTAL_INAFECTA"] > 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_INAFECTA"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">O</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9998</cbc:ID>
					<cbc:Name>INAFECTO</cbc:Name>
					<cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        if ($cabecera["TOTAL_OTR_IMP"] > 0) {
            $xmlCPE = $xmlCPE . '<cac:TaxSubtotal>
			<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_OTR_IMP"] . '</cbc:TaxableAmount>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_OTR_IMP"] . '</cbc:TaxAmount>
			<cac:TaxCategory>
				<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
				<cac:TaxScheme>
					<cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9999</cbc:ID>
					<cbc:Name>OTR</cbc:Name>
					<cbc:TaxTypeCode>OTH</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>';
        }
        // TOTAL=GRAVADA+IGV+EXONERADA
        // NO ENTRA GRATUITA(INAFECTA) NI DESCUENTO
        // SUB_TOTAL=PRECIO(SIN IGV) * CANTIDAD
        $xmlCPE = $xmlCPE . '</cac:TaxTotal>
	<cac:LegalMonetaryTotal>
		<cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["SUB_TOTAL"] . '</cbc:LineExtensionAmount>
		<cbc:TaxInclusiveAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:TaxInclusiveAmount>
		<cbc:AllowanceTotalAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_DESCUENTO"] . '</cbc:AllowanceTotalAmount>
		<cbc:ChargeTotalAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:ChargeTotalAmount>
		<cbc:PayableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:PayableAmount>
	</cac:LegalMonetaryTotal>';
        // LISTA DE PRODUCTOS
        for ($i = 1; $i <= $nums - 1; $i ++) {
            $cabecera["CANTIDAD_DET"] = $cantidad1[$i];
            $cabecera["UNIDAD_MEDIDA"] = $und_pro[$i];
            
            if ($tip == 0) {
                $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]) / 1.18, 2);
                $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
                $cabecera["PRECIO_TIPO_CODIGO"] = "01";
                $cabecera["IGV"] = round((0.18 * $cantidad1[$i] * $precio_unitario[$i]) / 1.18, 2);
                $cabecera["POR_IGV"] = 18.00;
                $cabecera["COD_TIPO_OPERACION"] = 10;
                $cabecera["DESCRIPCION_DET"] = $producto[$i];
                $cabecera["CODIGO_DET"] = $codigo[$i];
                $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i] / 1.18, 2);
            }
            if ($tip == 1) {
                $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]), 2);
                $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
                $cabecera["PRECIO_TIPO_CODIGO"] = "01";
                $cabecera["IGV"] = "0.00";
                $cabecera["POR_IGV"] = 18.00;
                $cabecera["COD_TIPO_OPERACION"] = 10;
                $cabecera["DESCRIPCION_DET"] = $producto[$i];
                $cabecera["CODIGO_DET"] = $codigo[$i];
                $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i], 2);
            }
            $xmlCPE = $xmlCPE . '<cac:InvoiceLine>
		<cbc:ID>' . $i . '</cbc:ID>
		<cbc:InvoicedQuantity unitCode="' . $cabecera["UNIDAD_MEDIDA"] . '" unitCodeListID="UN/ECE rec 20" unitCodeListAgencyName="United Nations Economic Commission for Europe">' . $cabecera["CANTIDAD_DET"] . '</cbc:InvoicedQuantity>
		<cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:LineExtensionAmount>
		<cac:PricingReference>
			<cac:AlternativeConditionPrice>
				<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
				<cbc:PriceTypeCode listName="Tipo de Precio" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">' . $cabecera["PRECIO_TIPO_CODIGO"] . '</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
		</cac:PricingReference>';
            if ($tip == 0) {
                $xmlCPE = $xmlCPE . '<cac:TaxTotal>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
				<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
					<cbc:Percent>' . $cabecera["POR_IGV"] . '</cbc:Percent>
					<cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="SUNAT:Codigo de Tipo de Afectación del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:TaxExemptionReasonCode>
					<cac:TaxScheme>
						<cbc:ID schemeID="UN/ECE 5153" schemeName="Tax Scheme Identifier" schemeAgencyName="United Nations Economic Commission for Europe">1000</cbc:ID>
						<cbc:Name>IGV</cbc:Name>
						<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>';
            }
            if ($tip == 1) {
                $xmlCPE = $xmlCPE . '<cac:TaxTotal>
			<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
				<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
				<cac:TaxCategory>
                                    <cbc:Percent>18</cbc:Percent>
                                    <cbc:TaxExemptionReasonCode>20</cbc:TaxExemptionReasonCode>
                                    <cac:TaxScheme>
                                        <cbc:ID>9997</cbc:ID>
                                        <cbc:Name>EXO</cbc:Name>
                                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                                    </cac:TaxScheme>
                                </cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>';
            }
            $xmlCPE = $xmlCPE . '<cac:Item>
			<cbc:Description><![CDATA[' . replace_invalid_caracters((isset($cabecera["DESCRIPCION_DET"])) ? $cabecera["DESCRIPCION_DET"] : "") . ']]></cbc:Description>
			<cac:SellersItemIdentification>
				<cbc:ID><![CDATA[' . replace_invalid_caracters((isset($cabecera["CODIGO_DET"])) ? $cabecera["CODIGO_DET"] : "") . ']]></cbc:ID>
			</cac:SellersItemIdentification>
		</cac:Item>
		<cac:Price>
			<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_SIN_IGV_DET"] . '</cbc:PriceAmount>
		</cac:Price>
	</cac:InvoiceLine>';
        }
        $xmlCPE = $xmlCPE . '</Invoice>';
    }
    if ($tipo == 6) { // XML Nota de Credito
        $xmlCPE = '<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
    <cbc:IssueDate>' . $cabecera["FECHA_DOCUMENTO"] . '</cbc:IssueDate>
    <cbc:IssueTime>00:00:00</cbc:IssueTime>
    <cbc:DocumentCurrencyCode>' . $cabecera["COD_MONEDA"] . '</cbc:DocumentCurrencyCode>
    <cac:DiscrepancyResponse>
        <cbc:ReferenceID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ReferenceID>
        <cbc:ResponseCode>' . $cabecera["COD_TIPO_MOTIVO"] . '</cbc:ResponseCode>
        <cbc:Description><![CDATA[' . $cabecera["DESCRIPCION_MOTIVO"] . ']]></cbc:Description>
    </cac:DiscrepancyResponse>
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ID>
            <cbc:DocumentTypeCode>' . $cabecera["TIPO_COMPROBANTE_MODIFICA"] . '</cbc:DocumentTypeCode>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>
    <cac:Signature>
        <cbc:ID>IDSignST</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyIdentification>
                <cbc:ID>' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#SignatureSP</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[' . $cabecera["NOMBRE_COMERCIAL_EMPRESA"] . ']]></cbc:Name>
            </cac:PartyName>
            <cac:PartyLegalEntity>
<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:AddressTypeCode>0001</cbc:AddressTypeCode>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
        <cac:TaxSubtotal>
<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRAVADAS"] . '</cbc:TaxableAmount>
<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:PayableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>';
        // NOTA DE CREDITO
        for ($i = 1; $i <= $nums - 1; $i ++) {
            $cabecera["CANTIDAD_DET"] = $cantidad1[$i];
            $cabecera["UNIDAD_MEDIDA"] = $und_pro[$i];
            $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]) / 1.18, 2);
            $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
            $cabecera["PRECIO_TIPO_CODIGO"] = "01";
            $cabecera["IGV"] = round((0.18 * $cantidad1[$i] * $precio_unitario[$i]) / 1.18, 2);
            $cabecera["POR_IGV"] = 18.00;
            $cabecera["COD_TIPO_OPERACION"] = 10;
            $cabecera["DESCRIPCION_DET"] = $producto[$i];
            $cabecera["CODIGO_DET"] = $codigo[$i];
            $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i] / 1.18, 2);
            
            $xmlCPE = $xmlCPE . '<cac:CreditNoteLine>
        <cbc:ID>' . $i . '</cbc:ID>
<cbc:CreditedQuantity unitCode="' . $cabecera["UNIDAD_MEDIDA"] . '">' . $cabecera["CANTIDAD_DET"] . '</cbc:CreditedQuantity>
<cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:LineExtensionAmount>
        <cac:PricingReference>
            <cac:AlternativeConditionPrice>
<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
                <cbc:PriceTypeCode>' . $cabecera["PRECIO_TIPO_CODIGO"] . '</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
        </cac:PricingReference>
        <cac:TaxTotal>
<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
            <cac:TaxSubtotal>
<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>' . $cabecera["POR_IGV"] . '</cbc:Percent>
<cbc:TaxExemptionReasonCode>' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:TaxExemptionReasonCode>
                    <cac:TaxScheme>
                        <cbc:ID>1000</cbc:ID>
                        <cbc:Name>IGV</cbc:Name>
                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
<cbc:Description><![CDATA[' . replace_invalid_caracters((isset($cabecera["DESCRIPCION_DET"])) ? $cabecera["DESCRIPCION_DET"] : "") . ']]></cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID><![CDATA[' . replace_invalid_caracters((isset($cabecera["CODIGO_DET"])) ? $cabecera["CODIGO_DET"] : "") . ']]></cbc:ID>
            </cac:SellersItemIdentification>
        </cac:Item>
        <cac:Price>
<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
        </cac:Price>
    </cac:CreditNoteLine>';
        }
        
        $xmlCPE = $xmlCPE . '</CreditNote>';
    }
    
    if ($tipo == 5) { // XML Nota de Débito
        $xmlCPE = '<?xml version="1.0" encoding="UTF-8"?>
<DebitNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
    <cbc:IssueDate>' . $cabecera["FECHA_DOCUMENTO"] . '</cbc:IssueDate>
    <cbc:IssueTime>00:00:00</cbc:IssueTime>
    <cbc:DocumentCurrencyCode>' . $cabecera["COD_MONEDA"] . '</cbc:DocumentCurrencyCode>
    <cac:DiscrepancyResponse>
        <cbc:ReferenceID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ReferenceID>
        <cbc:ResponseCode>' . $cabecera["COD_TIPO_MOTIVO"] . '</cbc:ResponseCode>
        <cbc:Description><![CDATA[' . $cabecera["DESCRIPCION_MOTIVO"] . ']]></cbc:Description>
    </cac:DiscrepancyResponse>
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ID>
            <cbc:DocumentTypeCode>' . $cabecera["TIPO_COMPROBANTE_MODIFICA"] . '</cbc:DocumentTypeCode>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>
    <cac:Signature>
        <cbc:ID>IDSignST</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyIdentification>
                <cbc:ID>' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#SignatureSP</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[' . $cabecera["NOMBRE_COMERCIAL_EMPRESA"] . ']]></cbc:Name>
            </cac:PartyName>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:AddressTypeCode>0001</cbc:AddressTypeCode>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
        <cac:TaxSubtotal>
<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRAVADAS"] . '</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:RequestedMonetaryTotal>
<cbc:PayableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:PayableAmount>
    </cac:RequestedMonetaryTotal>';
        
        for ($i = 1; $i <= $nums - 1; $i ++) {
            $cabecera["CANTIDAD_DET"] = $cantidad1[$i];
            $cabecera["UNIDAD_MEDIDA"] = $und_pro[$i];
            $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]) / 1.18, 2);
            $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
            $cabecera["PRECIO_TIPO_CODIGO"] = "01";
            $cabecera["IGV"] = round((0.18 * $cantidad1[$i] * $precio_unitario[$i]) / 1.18, 2);
            $cabecera["POR_IGV"] = 18.00;
            $cabecera["COD_TIPO_OPERACION"] = 10;
            $cabecera["DESCRIPCION_DET"] = $producto[$i];
            $cabecera["CODIGO_DET"] = $codigo[$i];
            $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i] / 1.18, 2);
            $xmlCPE = $xmlCPE . '
    <cac:DebitNoteLine>
        <cbc:ID>' . $i . '</cbc:ID>
<cbc:DebitedQuantity unitCode="' . $cabecera["UNIDAD_MEDIDA"] . '">' . $cabecera["CANTIDAD_DET"] . '</cbc:DebitedQuantity>
<cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:LineExtensionAmount>
        <cac:PricingReference>
            <cac:AlternativeConditionPrice>
<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
<cbc:PriceTypeCode>' . $cabecera["PRECIO_TIPO_CODIGO"] . '</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
        </cac:PricingReference>
        <cac:TaxTotal>
<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>' . $cabecera["POR_IGV"] . '</cbc:Percent>
<cbc:TaxExemptionReasonCode>' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:TaxExemptionReasonCode>
                    <cac:TaxScheme>
                        <cbc:ID>1000</cbc:ID>
                        <cbc:Name>IGV</cbc:Name>
                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
    
<cac:Item>
<cbc:Description><![CDATA[' . replace_invalid_caracters((isset($cabecera["DESCRIPCION_DET"])) ? $cabecera["DESCRIPCION_DET"] : "") . ']]></cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID><![CDATA[' . replace_invalid_caracters((isset($cabecera["CODIGO_DET"])) ? $cabecera["CODIGO_DET"] : "") . ']]></cbc:ID>
            </cac:SellersItemIdentification>
        </cac:Item>
<cac:Price>
<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
</cac:Price>
    </cac:DebitNoteLine>';
        }
        
        $xmlCPE = $xmlCPE . '</DebitNote>';
    }
    
    $doc->loadXML($xmlCPE);
    // GUARDAR DOCUMENTO XML EN facturas-sin-firmar
    $doc->save("factura-sin-firmar/$ruc1-$tipo_doc-$folio-$numero_factura1.XML");
    chmod("factura-sin-firmar/$ruc1-$tipo_doc-$folio-$numero_factura1.XML", 0777);
    // FIRMA
    $doc3 = "$ruc1-$tipo_doc-$folio-$numero_factura1";
    $rutas = array();
    
    $rutas['ruta_xml'] = "factura-sin-firmar/$doc3";
    if ($fac_ele == 1) {
        $rutas['ruta_firma'] = "certificados/produccion/$ruc1.pfx";
        $rutas['pass_firma'] = $clave;
    }
    if ($fac_ele == 3) {
        $rutas['ruta_firma'] = "certificados/beta/firmabeta.pfx";
        $rutas['pass_firma'] = '123456';
        // $rutas['pass_firma'] = $clave;
    }
    
    $rutas['ruta_xml1'] = "$doc3";
    $signature = new Signature();
    $flg_firma = "0";
    $resp_firma = $signature->signature_xml($flg_firma, $rutas['ruta_xml'], $rutas['ruta_firma'], $rutas['pass_firma'], $rutas['ruta_xml1']);
    if ($resp_firma['respuesta'] == 'error') {
        return $resp_firma;
    }
    // CODIGO HASH
    $hash = $resp_firma['hash_cpe'];
    $insert_hash = mysqli_query($con, "UPDATE facturas SET cod_hash='$hash' WHERE id_factura=$id_factura");
}

$conf_estado = mysqli_query($con, "SELECT estado from configuracion where id_conf=3; ");
$rw_conf_estado = mysqli_fetch_array($conf_estado);
$estado_envio_sunat = $rw_conf_estado['estado'];

if ($estado_envio_sunat==1){
    
    $sTable = "facturas, clientes, users";
    $sWhere = "";
    $sWhere .= " WHERE facturas.id_cliente=clientes.id_cliente and facturas.id_factura =$id_factura and facturas.tienda=$tienda1 and (facturas.estado_factura<=2 or facturas.estado_factura=5 or facturas.estado_factura=6) and facturas.id_vendedor=users.user_id and facturas.ven_com=1 and facturas.activo=1 and facturas.numero_factura>0";
    
    $count_query = mysqli_query($con, "SELECT count(*) AS numrows FROM $sTable  $sWhere");
    $row = mysqli_fetch_array($count_query);
    $numrows = $row['numrows'];
    
    $conf_query = mysqli_query($con, "SELECT count(*) AS numrows FROM $sTable  $sWhere");
    $row_conf = mysqli_fetch_array($conf_query);
    $numrows = $row_conf['numrows'];
    
    $sql1 = "SELECT * FROM sucursal where tienda=$tienda1";
    $query1 = mysqli_query($con, $sql1);
    $row1 = mysqli_fetch_array($query1);
    $ruc1 = $row1['ruc'];
    $sql = "SELECT * FROM  $sTable $sWhere ";
    $query = mysqli_query($con, $sql);
    if ($numrows > 0) {
        while ($row = mysqli_fetch_array($query)) {
            $activo = $row['activo'];
            if ($activo == 1) {
                $id_factura = $row['id_factura'];
                $numero_factura = $row['numero_factura'];
                $fecha = date("d/m/Y", strtotime($row['fecha_factura']));
                $nombre_cliente = $row['nombre_cliente'];
                $ruc = $row['doc'];
                $folio = $row['folio'];
                $dni = $row['dni'];
                
                $tip = 0;
                $estado_factura1 = $row['estado_factura'];
                if ($estado_factura1 == 1) {
                    $tip = "01";
                }
                if ($estado_factura1 == 2) {
                    $tip = "03";
                }
                if ($estado_factura1 == 6) {
                    $tip = "07";
                }
                if ($estado_factura1 == 5) {
                    $tip = "08";
                }
                $numero_factura1 = str_pad($numero_factura, 8, "0", STR_PAD_LEFT);
                $doc2 = "$ruc1-$tip-$folio-$numero_factura1";
                
                ?>
    
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!-- Meta, title, CSS, favicons, etc. -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Documento</title>
    </head>
    <body>
    	<script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
    	<script src="//code.jquery.com/jquery-1.11.2.min.js"></script>
    	<script>
    		$(document).ready(function(){
    			load(1);        
          	});
        
             function load(id){
                 var id = '<?php echo $doc2;?>';
                 var id_factura = '<?php echo $id_factura;?>';
                 var mail = '<?php echo $_GET['mail'];?>';
                 var tip_doc = '<?php echo $_GET['tip_doc'];?>';
                 var doc1 = '<?php echo $_GET['doc1'];?>';
                 $.ajax({
                   type: "GET",
                   url: "enviar_sunat.php",
                   data: "fac="+id + "&enviar_todos=0&reintentar=1",
                   beforeSend: function(objeto){
                     $("#resultados").html("Mensaje: Cargando...");
                     },
               	success: function(datos){
               			window.location.href = "./ver_ticket.php?id_factura="+id_factura+"&mail=" + mail+"&tip_doc=" + tip_doc+"&doc1=" + doc1;
                   }
                 });		
              }  
                
       </script>
    </body>
    </html>
    
    <?php
            }
        }
    } else {
        header("location:ver_ticket.php?id_factura=$id_factura&mail=" . $_GET['mail'] . "&tip_doc=" . $_GET['tip_doc'] . "&doc1=" . $_GET['doc1']);
    }
} else {
    header("location:ver_ticket.php?id_factura=$id_factura&mail=" . $_GET['mail'] . "&tip_doc=" . $_GET['tip_doc'] . "&doc1=" . $_GET['doc1']);
}
// FIN DE CREACION DE DOCUMENTO XML FACTURAS Y BOLETAS
?>