<?php
require_once ("model/db.php"); // Contiene las variables de configuracion para conectar a la base de datos
require_once ("model/conexion.php"); // Contiene funcion que conecta a la base de datos
require_once ('model/login.model.php');

date_default_timezone_set($_SESSION["zona_horaria"]);
setlocale(LC_ALL, "es_ES@euro", "es_ES", "esp");
$fecha = date("Y-m-d");

$objeto_usuario = new Usuarios();
$datosEmpresa=$objeto_usuario->DatosEmpresa();

foreach ($datosEmpresa as $reg) {
    $fac_ele = $reg['fac_ele'];
    $clave = $reg['clave'];
    $nombre_empresa = $reg['raz_soc'];
    $departamento = "Lima";
    $provincia = "Lima";
    $distrito = "Lima";
    $ruc = $reg['ruc'];
    $direccion = $reg['direccion'];
    $usuariosol = $reg['usuariosol'];
    $clavesol = $reg['clavesol'];
    $clave = $reg['clave'];
}

?>

<div class="row wrapper border-bottom white-bg page-heading">
	<div class="col-lg-9">
		<h2>
			<i class="fa fa-cog"></i> <a class="a-c" href="#">Configuraci&oacute;n</a>
		</h2>
		<ol class="breadcrumb">
			<li class="active"><strong>Facturaci&oacute;n</strong></li>
			<li>Configuraci&oacute;n de Acceso y Certificados</li>
		</ol>
	</div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
	<div id="resultados"></div>
	<div class="ibox">
		<form class="form-horizontal form-label-left" id="guardar_producto"
			enctype="multipart/form-data" action="conf_electronica1.php"
			method="POST">
			<div class="ibox-title">
				<h5>
					<strong><i class="fa fa-list-ul"></i> Tipo de Fase:</strong>
				</h5>
			</div>
			<div class="ibox-content">
				<div class="form-group">
					<label for="linkedin_emp"
						class="control-label col-md-3 col-sm-3 col-xs-12">Facturaci&oacute;n
						Electr&oacute;nica</label>
					<div class="col-md-9 col-sm-9 col-xs-12">
						<select class="textfield10" class='form-control'
							id="fac_ele" name="fac_ele">
                        <?php
                        if ($fac_ele == 3) {
                            ?>
                        <option value="3" selected>Beta</option>
							<option value="1">Produccion</option>
                             <?php
                        }
                        if ($fac_ele == 1) {
                            ?>
                        <option value="1" selected>Produccion</option>
							<option value="3">Beta</option>
                            <?php
                        }
                        ?>
						</select>
					</div>
				</div>
			</div>
			<div class="ibox-title">
				<h5>
					<strong><i class="fa fa-list-ul"></i> Datos para producci&oacute;n:</strong>
				</h5>
			</div>
			<div class="ibox-content">
				<div class="form-group">
					<label for="youtube_emp"
						class="control-label col-md-3 col-sm-3 col-xs-12">Usuario Sol</label>
					<div class="col-md-9 col-sm-9 col-xs-12">
						<input class="textfield10" type="text" class="form-control"
							id="usuariosol" name="usuariosol" placeholder="usuariosol"
							value="<?php echo $usuariosol;?>">
					</div>
				</div>

				<div class="form-group">
					<label for="linkedin_emp"
						class="control-label col-md-3 col-sm-3 col-xs-12">Clave Sol</label>
					<div class="col-md-9 col-sm-9 col-xs-12">
						<input class="textfield10" type="text" class="form-control"
							id="clavesol" name="clavesol" placeholder="clavesol"
							value="<?php echo $clavesol;?>">
					</div>
				</div>

				<input type="hidden" id="ruc" class="form-control" name="ruc"
					value="<?php echo $ruc;?>">
				<div class="form-group">


					<label for="nombre" class="col-sm-3 control-label">Ingresar
						certificado digital (.pfx):</label>
					<div class="col-md-9 col-sm-9 col-xs-12">
						<input class="textfield10" accept="image/jpeg" type="file"
							id="files" name="files" class="form-control" />

					</div>
				</div>
				<div class="form-group">
					<label for="linkedin_emp"
						class="control-label col-md-3 col-sm-3 col-xs-12">Password
						Certificado Digital</label>
					<div class="col-md-9 col-sm-9 col-xs-12">
						<input class="textfield10" type="text" id="valor1"
							class="form-control" id="clave" name="clave"
							placeholder="Password Certificado Digital"
							value="<?php echo $clave;?>">
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="submit" class="btn btn-primary" id="guardar_datos">Guardar
					datos</button>
			</div>
		</form>
	</div>
</div>

<script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
<script>

$(function(){
    $("#guardar_producto").on("submit", function(e){
        e.preventDefault();
        var usuariosol= $("#usuariosol").val();
        
        if (usuariosol==""){
        	alert("Debes ingresar un Usuario Sol");
            $("#usuariosol").focus();
            return false;
        } else {
            var f = $(this);
            var formData = new FormData(document.getElementById("guardar_producto"));
            $.ajax({
                url: "./view/facturacion/conf_electronica_file.php",
                type: "post",
                dataType: "html",
                data: formData,
                cache: false,
                contentType: false,
         		processData: false
            }).done(function(res){
            	$("#resultados").html(res)
             	window.location.href = "./config_electronica.php?msg="+res;
            });
    	} 

        
    });
});
</script>