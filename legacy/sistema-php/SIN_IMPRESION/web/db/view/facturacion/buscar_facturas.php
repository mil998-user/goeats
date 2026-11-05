
<style>
table tr:nth-child(odd) {background-color: #FBF8EF;}
table tr:nth-child(even) {background-color: #EFFBF5;}
 #valor1 {
border-bottom: 2px solid #F5ECCE;
} 
#valor1:hover {             
background-color: white;
border-bottom: 2px solid #A9E2F3
} 
</style>
<style type="text/css">
   .thumbnail1{
position: relative;
z-index: 0;
}
.thumbnail1:hover{
background-color: transparent;
z-index: 50;
}
.thumbnail1 span{ /*Estilos del borde y texto*/
position: absolute;
background-color: white;
padding: 5px;
left: -100px;

visibility: hidden;
color: #FFFF00;
text-decoration: none;
}
.thumbnail1 span img{ /*CSS for enlarged image*/
border-width: 0;
padding: 2px;
}
.thumbnail1:hover span{ /*CSS for enlarged image on hover*/
visibility: visible;
top: 17px;
left: 40px; /*position where enlarged image should offset horizontally */
} 
img.imagen2{
padding:4px;
border:3px #0489B1 solid;
margin-left: 2px;
margin-right:5px;
margin-top: 5px;
float:left;
}
table tr:nth-child(odd) {background-color: #F5F6CE;}
table tr:nth-child(even) {background-color: #CEF6E3;}
#valor1:hover {            
background-color: white;
border-bottom: 2px solid #A9E2F3;
}  
#valor2:hover {             
background-color: white;
border-bottom: 2px solid #A9E2F3;
} 
#valor1 {             
background-color: #FBF8EF;
border-bottom: 2px solid #F5ECCE;
}  
#valor2 {              
background-color: #EFFBF5;
border-bottom: 2px solid #F5ECCE;
} 
.dt-button.red {
    color: black;
    background:red;
}
.dt-button.orange {
    color: black;
    background:orange;
}
.dt-button.green {
    color: black;
    background:green;
}
.dt-button.green1 {
    color: black;
    background:#01DFA5;
}
.dt-button.green2 {
    color: black;
     background:#2E9AFE;
}
tfoot {
    display: table-header-group;
}
.dataTables_wrapper .dataTables_paginate .paginate_button:hover {
  background: none;
  color: black!important;
  border-radius: 4px;
  border: 1px solid #828282;
}
.dataTables_wrapper .dataTables_paginate .paginate_button:active {
  background: none;
  color: black!important;
}
</style>
<?php

	require_once ("../../model/db.php");
	require_once ("../../model/conexion.php");
    date_default_timezone_set('America/Lima');
    $fecha1  = date("Y-m-d H:i:s");
	$action = (isset($_REQUEST['action'])&& $_REQUEST['action'] !=NULL)?$_REQUEST['action']:'';
	if($action == 'ajax'){               
		$sTable = "tm_venta vta, tm_cliente clt, tm_usuario usu";
		$sWhere = "";
		$sWhere.=" WHERE vta.id_cliente=clt.id_cliente and vta.id_usu = usu.id_usu and vta.id_tipo_doc < 3";
     
		$sWhere.=" ";
		include 'pagination.php';
		$page = (isset($_REQUEST['page']) && !empty($_REQUEST['page']))?$_REQUEST['page']:1;
		$per_page = 100; 
		$adjacents  = 4; 
		$offset = ($page - 1) * $per_page;
		$count_query   = mysqli_query($con, "SELECT count(*) AS numrows FROM $sTable  $sWhere");
		$row= mysqli_fetch_array($count_query);
		$numrows = $row['numrows'];
		$total_pages = ceil($numrows/$per_page);
		$reload = './facturas.php';
        $sql1="SELECT * FROM tm_empresa where id_de=1";
		$query1 = mysqli_query($con, $sql1);
        $row1=mysqli_fetch_array($query1);
        $ruc1=$row1['ruc'];
        $sql="SELECT vta.id_venta, vta.nro_doc as numero_factura, vta.fecha_venta, vta.id_tipo_doc, vta.serie_doc, vta.estado, vta.aceptado, 
                    vta.total, vta.bolsa, vta.observacion, 
                    clt.razon_social, clt.nombres as nombre_cliente, clt.ape_paterno as ape_paterno_cliente, 
                    clt.ape_materno as ape_materno_cliente, clt.dni as dni_cliente, clt.ruc as ruc_cliente, clt.telefono as telefono_cliente, 
                    clt.correo as email_cliente, 
                    usu.nombres as nombres_usuario FROM  $sTable $sWhere ";
		$query = mysqli_query($con, $sql);
		//echo json_encode($sql);
		if ($numrows>0){
			echo mysqli_error($con);
			?>
			<div class="table-responsive">
			  <table id="example" class="table">
                <thead>
				<tr  style="background-color:#FE9A2E;color:white; ">
                    <th  class="no-sort"> 
                        <input type="checkbox" onClick="toggle(this)" /> Sel. Todo<br/>
                        <a href="#" class='btn btn-primary btn-xs' title='Enviar sunat' onclick="enviar_todos();"><i class="glyphicon glyphicon-download">&nbsp;Enviar&nbsp;</i></a> 
                    </th>
					<th>Nro Doc</th>
                    <th class='text-right'>Tipo de Doc</th>
                    <th>Fecha</th>
					<th>Cliente</th>
					<th class='text-right'>Total</th>
                    <th class='text-right'>Hora envio a Sunat</th>
                    <th class='text-right'>Desc<br>XML</th>
                    <th class='text-right'><img src="assets/img/sunat.png" width="25" height="25">Enviar</th>
					<th class='text-right'>Respuesta<br>Sunat(CDR)</th>
					<th class='text-right'>Ticket</th>
					<th class='text-right'>Enviar Correo</th>
				</tr>
                </thead>
				<?php
				while ($row=mysqli_fetch_array($query)){
                        $activo=$row['estado'];
						if ($activo=='a'){
                            $id_venta=$row['id_venta'];
                            $nro_doc=$row['numero_factura'];
                            $fecha=date("d/m/Y", strtotime($row['fecha_venta']));
                            $razon_social=$row['razon_social'];
                            if (!empty($razon_social)){
                                $nombre_cliente = $razon_social;
                            } else {
                                $nombre_cliente = $row['nombre_cliente']." ".$row['ape_paterno_cliente']." ".$row['ape_materno_cliente'];
                            }
                            $telefono_cliente=$row['telefono_cliente'];
                            $ruc=$row['ruc_cliente'];
                            $email_cliente=$row['email_cliente'];
                            
                            $id_tipo_doc=$row['id_tipo_doc'];
                            $tip=0;
                            if ($id_tipo_doc==1){
                                $serie="B".$row['serie_doc'];
                                $tip="03";
                                $estado1="Boleta";
                            } else if ($id_tipo_doc==2){
                                $serie="F".$row['serie_doc'];
                                $tip="01";
                                $estado1="Factura";
                            }
                            
                            $dni=$row['dni_cliente'];
                                                
						    $nombre_vendedor=$row['nombres_usuario'];
                            
                            $nro_doc1=str_pad($nro_doc, 8, "0", STR_PAD_LEFT);
                            $doc1="$ruc1-$tip-$serie-$nro_doc1.XML";
                            
                            $doc2="$ruc1-$tip-$serie-$nro_doc1";
                            
                            $doc3="R-$ruc1-$tip-$serie-$nro_doc1.XML";
                            $aceptado1="No enviado";
                            $fecha3="";
                            $hora3="";
                            if (file_exists('../inicio/sunat/cdr/'.$doc3.'')) {
                                $xml = file_get_contents('../inicio/sunat/cdr/'.$doc3.'');
                                #== Obteniendo datos del archivo .XML 
                                $aceptado="";
                                $DOM = new DOMDocument('1.0', 'ISO-8859-1');
                                $DOM->preserveWhiteSpace = FALSE;
                                $DOM->loadXML($xml);
                                ### DATOS DE LA FACTURA ####################################################
                                // Obteniendo RUC.
                                $DocXML = $DOM->getElementsByTagName('Description');
                                foreach($DocXML as $Nodo){
                                    $aceptado = $Nodo->nodeValue; 
                                }  
                                $DocXML = $DOM->getElementsByTagName('ResponseDate');
                                foreach($DocXML as $Nodo){
                                    $fecha3 = $Nodo->nodeValue; 
                                }
                                $DocXML = $DOM->getElementsByTagName('ResponseTime');
                                foreach($DocXML as $Nodo){
                                $hora3 = $Nodo->nodeValue; 
                                }
                                $fecha3=date("d/m/Y", strtotime($fecha3));
                                $pos = strpos($aceptado, "aceptada");
                                if ($pos === false) {
                                    $aceptado1= "No aceptada";
                                } else {
                                $aceptado1= "Aceptada";

                                }
						    }
                            if($row['aceptado']=="Aceptada"){
                            $aceptado1= "Aceptada"; 
                            }
                            if($fecha3=="" and $aceptado1=="Aceptada"){
                                $fecha3=$row['observacion'];
                            }
                           
                            $mon="S/.";
//                             $estado_factura=$row['condiciones'];
                            //$total_venta=floatval($row['total']);
							$total_venta=floatval($row['total'])+floatval($row['bolsa']);
							
					?>
					<tr id="valor1">
                        <td align="center">
                            <?php
                                if($aceptado1<> "Aceptada"){
                            ?>
                                <input type="checkbox" name="check_enviar" value="<?php echo $doc2."-".$id_venta;?>">
                            <?php } ?>
                        </td>
                        <td><?php echo $serie; ?>-<?php echo $nro_doc; ?></td>
                        <td><?php echo $estado1; ?></td>
                        <td><?php echo $fecha; ?></td>
						<td><?php echo $nombre_cliente;?></td>   
                        <td class='text-right'><?php print"$mon"; echo number_format ($total_venta,2); ?></td>					
                        <td class='text-right'><font color='black'><strong><?php print"$fecha3&nbsp;&nbsp;"; echo $hora3; ?></strong></font></td>
						<td class="text-right">
                            <?php
                            if($aceptado1=="No enviado"){
                            ?>
                            <a href="#" class='btn btn-primary btn-xs' title='Descargar xml' onclick="imprimir_factura('<?php echo $doc1;?>');"><i class="glyphicon glyphicon-download"></i></a> 
                            <?php
                            }
                            if($aceptado1<>"No enviado"){
                                ?>
                            <a href="#" class='btn btn-primary btn-xs' title='Descargar xml' onclick="imprimir_factura2('<?php echo $doc1;?>');"><i class="glyphicon glyphicon-download"></i></a> 
                                    <?php
                            }
                            ?>
                        </td>
                        <td class="text-right">
                            <?php
                            if($aceptado1<> "Aceptada"){
                                ?>
                            <a href="#" class='btn btn-warning btn-xs' title='Enviar sunat' onclick="enviar('<?php echo $doc2."-".$id_venta;?>');"><i class="glyphicon glyphicon-download">Enviar</i></a> 
    
                                    <?php
                            }else{
                                ?>
                            <a class='btn btn-info btn-xs'><i class="glyphicon glyphicon-download">Enviado</i></a> 
    
                                    <?php
                            }
                            ?>
                        </td>
                        <td class="text-right">
                            <?php
                            if($serie<>"" and ($id_tipo_doc<=2) and $aceptado1=="Aceptada"){
                            ?>
                            <a href="#" class='btn btn-danger btn-xs' title='Descargar CDR' onclick="imprimir_factura1('<?php echo $doc3;?>','<?php echo $id_venta;?>');"><?php echo $aceptado1;?></a> 
                            <?php
                            } else {                                
                                ?>
                                <a href="#" class='btn btn-danger btn-xs' title='Descargar CDR' ><?php echo $aceptado1;?></a>
                                <?php 
                            }
                            ?>
                        </td>
                        <td>
                        	<a href="lista_inf_ventas.php?c=Informe&a=Imprimir&Cod=<?php echo $id_venta;?>" class="btn btn-sm btn-success" target="_blank"><i class="fa fa-print"></i>Ver Ticket</a>
                        </td>
                        <td>
                        	<a href="#" class='btn btn-sm btn-primary' title='Enviar correo' onclick="enviar_correo('<?php echo $id_venta;?>');"><i class="glyphicon glyphicon-download"></i> Enviar Correo</a>   
                        </td>
					</tr>
					<?php
                                        $numrows=$numrows-1;
                                        
				}
                            }
                            ?>
			</table>
                    </div>
                    <?php
		}
            }
?>
<script>
$(document).ready(function() {
    
        $('#example').DataTable( {
            "columnDefs": [ {
            "targets": 'no-sort',
            "orderable": false,
        } ],
        language: {
        
        "show": "Mostrar",
        "emptyTable": "No hay informacion",
        "info": "Mostrando _START_ a _END_ de _TOTAL_ Entradas",
        "infoEmpty": "Mostrando 0 to 0 of 0 Entradas",
        "infoFiltered": "(Filtrado de _MAX_ total entradas)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "Mostrar _MENU_ Entradas",
        "loadingRecords": "Cargando...",
        "processing": "Procesando...",
        "search": "Buscar:",
        "zeroRecords": "Sin resultados encontrados",
        buttons: {
                copyTitle: 'Copiar filas al portapapeles',
                
                copySuccess: {
                    _: 'Copiado %d fias ',
                    1: 'Copiado 1 fila'
                },
                
                pageLength: {
                _: "Mostrar %d filas",
                '-1': "Mostrar Todo"
            }
            },
        "paginate": {
            "first": "Primero",
            "last": "Ultimo",
            "next": "Siguiente",
            "previous": "Anterior"
        }

    },

         bDestroy: true,
            dom: 'Bfrtip',
        lengthMenu: [
            [ 10, 25, 50, -1 ],
            [ '10 filas', '25 filas', '50 filas', 'Mostrar todo' ]
        ],
        buttons: 

         [
                
             {
                    extend: 'colvis',
                    text: 'Mostrar columnas',
                    className: 'green2',
                    exportOptions: {
                    columns: ':visible'
                }
                
                },   
                          
{
                    extend: 'pageLength',
                    text: 'Mostrar filas',
                    className: 'orange',
                    exportOptions: {
                    columns: ':visible'
                }
                
                },
                
                {
                    extend: 'copy',
                    text: 'COPIAR',
                    className: 'red',
                    exportOptions: {
                    columns: ':visible'
                }
                },
                {
                    extend: 'excel',
                    text: 'EXCEL',
                    className: 'green',
                    exportOptions: {
                    columns: ':visible'
                }
                },
                {
                    extend: 'csv',
                    text: 'CSV',
                    className: 'green1',
                    exportOptions: {
                    columns: ':visible'
                }
                },
                {
                    extend: 'print',
                    text: 'IMPRIMIR',
                    className: 'green2',
                    exportOptions: {
                    columns: ':visible'
                }
                },
            ],
         "pageLength": 12,
        
    } );

} );
</script>

