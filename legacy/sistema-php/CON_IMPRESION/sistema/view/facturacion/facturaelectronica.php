<?php
require_once ("model/db.php"); // Contiene las variables de configuracion para conectar a la base de datos
require_once ("model/conexion.php"); // Contiene funcion que conecta a la base de datos

?>
<script src="assets/js/jquery.min.js"></script>
<script type="text/javascript"
	src="https://code.jquery.com/jquery-1.12.4.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.min.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/buttons/1.5.1/js/dataTables.buttons.min.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.colVis.min.js"></script>
<link
	href="https://cdn.datatables.net/buttons/1.5.1/css/buttons.dataTables.min.css"
	rel="stylesheet">
<script type="text/javascript"
	src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
<script type="text/javascript"
	src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.32/pdfmake.min.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/1.10.16/js/dataTables.bootstrap.min.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/responsive/2.2.1/js/dataTables.responsive.min.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/buttons/1.5.1/js/dataTables.buttons.min.js"></script>
<script type="text/javascript"
	src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.colVis.min.js"></script>
<link rel="stylesheet" type="text/css"
	href="https://cdn.datatables.net/1.10.16/css/dataTables.bootstrap.min.css" />
<script type="text/javascript"
	src="assets/Buttons/js/buttons.flash.min.js"></script>
<script type="text/javascript"
	src="assets/Buttons/js/dataTables.buttons.min.js"></script>
<script type="text/javascript"
	src="assets/Buttons/js/buttons.html5.min.js"></script>
<script type="text/javascript"
	src="assets/Buttons/js/buttons.print.min.js"></script>
<script>
         $(document).ready(function(){
             $('[data-toggle="tooltip"]').tooltip(); 
         });
      </script>
<div class="row wrapper border-bottom white-bg page-heading">
	<div class="col-lg-9">
		<h2>
			<i class="fa fa-cog"></i> <a class="a-c" href="#">Documentos
				Electr&oacute;nicos</a>
		</h2>
		<ol class="breadcrumb">
			<li class="active"><strong>Factura y Boleta Electr&oacute;nica</strong></li>
			<li>Lista de Documentos Electr&oacute;nicos</li>
		</ol>
	</div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
	<div class="ibox">
		<div id="resultados"></div>
		<div class='outer_div'></div>
		<!-- /page content -->
	</div>
</div>
<div id="custom_notifications" class="custom-notifications dsp_none">
	<ul class="list-unstyled notifications clearfix"
		data-tabbed_notifications="notif-group">
	</ul>
	<div class="clearfix"></div>
	<div id="notif-group" class="tabbed_notifications"></div>
</div>
<script src="assets/js/bootstrap.min.js"></script>
<script src="assets/js/progressbar/bootstrap-progressbar.min.js"></script>
<script src="assets/js/nicescroll/jquery.nicescroll.min.js"></script>
<script src="assets/js/icheck/icheck.min.js"></script>
<script src="assets/js/custom.js"></script>
<script src="assets/js/pace/pace.min.js"></script>
<!--       <script type="text/javascript" src="js/usuarios.js"></script> -->
<script type="text/javascript" src="assets/js/VentanaCentrada.js"></script>
<script>
         $(document).ready(function(){
           load(1);        
         });
         
         function load(page){
          $("#loader").fadeIn('slow');
          $.ajax({
            url:'view/facturacion/buscar_facturas.php?action=ajax',
            beforeSend: function(objeto){
            $('#loader').html('<img src="./img/ajax-loader.gif"> Cargando...');
            },
            success:function(data){
              $(".outer_div").html(data).fadeIn('slow');
              $('#loader').html('');
              $('[data-toggle="tooltip"]').tooltip({html:true}); 
          
            }
          })
         }
         
        function enviar (id){
            $.ajax({
                type: "GET",
                url: "view/inicio/sunat/enviar_sunat_web_service.php",
                data: "fac=" + id + "&enviar_todos=0",
                beforeSend: function(objeto){
                	$("#resultados").html("Mensaje: Cargando...");
                },
                success: function(datos){
                	$("#resultados").html(datos);
                	load(1);
                }
            });		
        }  

        function toggle(source) {
          checkboxes = document.getElementsByName('check_enviar');
          for(var i=0, n=checkboxes.length;i<n;i++) {
            checkboxes[i].checked = source.checked;
          }
        }

         function enviar_todos (){
            var favorite = [];
            $.each($("input[name='check_enviar']:checked"), function(){            
                favorite.push($(this).val());
            });

            if (favorite==''){
              alert ('Debe Seleccionar un registro como minimo');
            } else {
              var q= $("#q").val();			
              $.ajax({
                type: "GET",
                url: "view/inicio/sunat/enviar_sunat_web_service.php",
                data: "enviar_todos=1" + "&all_fact="+favorite.join(","),"q":q,
                beforeSend: function(objeto){
                  $("#resultados").html("Mensaje: Cargando...");
                  },
                success: function(datos){
                  $("#resultados").html(datos);
                    load(1);
                }
              });
            }
         }  
         
        function imprimir_factura(id_factura){
          	VentanaCentrada('view/inicio/sunat/factura-sin-firmar/'+id_factura,'Factura','','1024','768','true');
        }

        function imprimir_factura1(id_factura, id_venta){
            var url = 'view/inicio/sunat/cdr/'+id_factura;
        	$.get(url)
            .done(function() { 
            	VentanaCentrada('view/inicio/sunat/cdr/'+id_factura,'Factura','','1024','768','true'); 
            }).fail(function() { 
            	VentanaCentrada('view/inicio/sunat/cdr/presentar_xml.php?id_factura='+id_factura+'&id_venta='+id_venta,'Factura','','1024','768','true');
            })
          	
        }
                   
        function imprimir_factura2(id_factura){
         	VentanaCentrada('view/inicio/sunat/factura-firmada/'+id_factura,'Factura','','1024','768','true');
        }

        function enviar_correo(id_venta){
            VentanaCentrada('view/config/email/index.php?id_venta='+id_venta,'Envio Correo','','600','325','true');
        }

      </script>
</div>
</div>

<div class="modal inmodal fade" id="mdl-pedidos-preparados"
	tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static"
	data-keyboard="true">
	<div class="modal-dialog modal-sm">
		<div class="modal-content animated bounceInRight">
			<form method="post" enctype="multipart/form-data" action="#">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">
						<span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span>
					</button>
					<h4 class="modal-title">Pedidos Preparados</h4>
				</div>
				<div class="modal-body" style="padding: 0px">
					<ul class="sortable-list agile-list">
						<div
							class="scroll_pedpre lista-pedidos-preparados animated fadeIn"></div>
					</ul>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-white" data-dismiss="modal">Cerrar</button>
				</div>
			</form>
		</div>
	</div>
</div>

<!-- Mainly scripts -->
<script src="assets/js/bootstrap.min.js"></script>
<script src="assets/js/plugins/metisMenu/jquery.metisMenu.js"></script>
<script src="assets/js/plugins/slimscroll/jquery.slimscroll.min.js"></script>
<!-- Custom and plugin javascript -->
<script src="assets/js/inspinia.js"></script>
<script src="assets/js/plugins/pace/pace.min.js"></script>
<!-- Chosen -->
<script src="assets/js/plugins/chosen/chosen.jquery.js"></script>
<!-- DatePicker -->
<script src="assets/js/plugins/datepicker/bootstrap-datepicker.min.js"></script>
<!-- Select2 -->
<script src="assets/js/plugins/select/bootstrap-select.min.js"></script>
<!-- Jquery Validate -->
<script src="assets/js/plugins/formvalidation/formValidation.min.js"></script>
<script
	src="assets/js/plugins/formvalidation/framework/bootstrap.min.js"></script>
<!-- iCheck -->
<script src="assets/js/plugins/iCheck/icheck.min.js"></script>
<!-- TouchSpin -->
<script
	src="assets/js/plugins/touchspin/jquery.bootstrap-touchspin.min.js"></script>
<!-- Toastr script -->
<script src="assets/js/plugins/toastr/toastr.min.js"></script>
<!-- Moment script -->
<script src="assets/js/plugins/moment/moment.js"></script>
<script src="assets/js/plugins/moment/moment-with-locales.js"></script>
<!-- Input Mask-->
<script src="assets/js/plugins/jasny/jasny-bootstrap.min.js"></script>
<!-- Datatable -->
<!--     <script src="assets/js/plugins/dataTables/jquery.dataTables.min.js"></script> -->
<!--     <script src="assets/js/plugins/dataTables/dataTables.bootstrap.min.js"></script> -->
<!-- DataTimePicker -->
<script
	src="assets/js/plugins/datetimepicker/bootstrap-datetimepicker.min.js"></script>
<!-- Buttoms Datatable -->
<script src="assets/js/plugins/dataTables/export/jszip.min.js"></script>
<script src="assets/js/plugins/dataTables/export/pdfmake.min.js"></script>
<script src="assets/js/plugins/dataTables/export/vfs_fonts.js"></script>
<script src="assets/js/plugins/dataTables/export/buttons.html5.min.js"></script>
<script src="assets/js/plugins/dataTables/export/buttons.print.min.js"></script>
<script
	src="assets/js/plugins/dataTables/export/dataTables.buttons.min.js"></script>
<script
	src="assets/js/plugins/dataTables/export/buttons.bootstrap.min.js"></script>
<!-- Steps -->
<script src="assets/js/plugins/staps/jquery.steps.min.js"></script>
<!-- Jquery Validate -->
<script src="assets/js/plugins/validate/jquery.validate.min.js"></script>
<script src="assets/scripts/footer.js"></script>
<script src="assets/js/plugins/buzz/buzz.min.js"></script>
</body>
</html>