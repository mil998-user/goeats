<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<style id="xml-viewer-style">/* Copyright 2014 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
div.header {
	border-bottom: 2px solid black;
	padding-bottom: 5px;
	margin: 10px;
}

div.collapsible &gt ; div.hidden {
	display: none;
}

.pretty-print {
	margin-top: 1em;
	margin-left: 20px;
	font-family: monospace;
	font-size: 13px;
}

#webkit-xml-viewer-source-xml {
	display: none;
}

.collapsible-content {
	margin-left: 1em;
}

.comment {
	white-space: pre;
}

.button {
	-webkit-user-select: none;
	cursor: pointer;
	display: inline-block;
	margin-left: -10px;
	width: 10px;
	background-repeat: no-repeat;
	background-position: left top;
	vertical-align: bottom;
}

.collapse-button {
	background:
		url("data:image/svg+xml,&lt;svg xmlns='http://www.w3.org/2000/svg' fill='%23909090' width='10' height='10'&gt;&lt;path d='M0 0 L8 0 L4 7 Z'/&gt;&lt;/svg&gt;");
	height: 10px;
}

.expand-button {
	background:
		url("data:image/svg+xml,&lt;svg xmlns='http://www.w3.org/2000/svg' fill='%23909090' width='10' height='10'&gt;&lt;path d='M0 0 L0 8 L7 4 Z'/&gt;&lt;/svg&gt;");
	height: 10px;
}
</style>
</head>
<body>
	<div id="webkit-xml-viewer-source-xml"></div>
	
	<?php
	if (isset($_GET['id_factura'])){
	    
	    $id_factura = $_GET['id_factura'];
	    $id_venta = $_GET['id_venta'];
	    $a = explode("-", $id_factura);
	    $ruc = $a[1];
	    $tipo_documento = $a[2];
	    $serie = $a[3];
	    $numero_factura = $a[4];
	    
	    $doc3 = $ruc."-".$tipo_documento."-".$serie."-".$numero_factura."-".$id_venta;
	    $myxmlfilecontent = "La venta no se realizo con Facturación Electrónica";
	    
	    echo '<div class="pretty-print">';
	    echo $myxmlfilecontent . "<br>";
	    echo '<a href="consultar_cdr.php?enviar_todos=0&fac=' . $doc3 . '" class="btn btn-danger btn-xs" title="Descargar CDR">Traer CDR</a>';
	    echo '</div>';
	}
	
    ?>
</body>
</html>

