<?php
date_default_timezone_set($_SESSION["zona_horaria"]);
setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
$fecha = date("d-m-Y");
$fechaa = date("m-Y");
?>

<input type="hidden" id="moneda" value="<?php echo $_SESSION["moneda"]; ?>"/>
<input type="hidden" id="m" value="<?php echo $_GET['m']; ?>"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-archive"></i> <a href="?c=Inventario" class="a-c">Inventario</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Inventario</strong>
            </li>
            <li>
                Entradas - Salidas
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
	<div class="ibox">
		<div class="ibox-title">
            <div class="ibox-title-buttons pull-right">
                <a class="btn btn-primary" href="?c=Inventario&a=nuevo"> <i class="fa fa-plus-circle"></i> Nuevo</a>
            </div>
			<h5><strong><i class="fa fa-list"></i> Entradas - Salidas</strong></h5>
		</div>
		<div class="ibox-content">
            <div class="row">
                <div class="col-sm-12">
                    <div class="table-responsive">
                        <table id="table" class="table table-hover table-condensed table-striped" width="100%">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo Operaci&oacute;n</th>
                                    <th>Concepto</th>
                                    <th class="text-center">Estado</th>
                                    <th class="text-right">Acciones</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </div>
		</div>
	</div>
</div>

<div class="modal inmodal fade" id="mdl-detalle" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog">
        <div class="modal-content animated bounceInRight">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h5 class="modal-title">Detalle</h5>
            </div>
            <div class="modal-body">
                <div class="table-responsive">
                    <table class="table table-hover table-condensed table-striped">
                        <thead>
                            <tr>
                                <th>C&oacute;digo</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Unidad de Medida</th>
                                <th>Precio Costo</th>
                            </tr>
                        </thead>
                        <tbody id="table-detalle"></tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cerrar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-anular" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form id="frm-anular" method="post" enctype="multipart/form-data" action="?c=Inventario&a=anular">
        <input type="hidden" name="cod_es" id="cod_es">
        <input type="hidden" name="cod_tipo" id="cod_tipo">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h3 class="modal-title">¿Desea anular este item seleccionado?</h3>
            </div>
            <div class="modal-body">
                <center>
                <div class="row">
                    <div class="col-sm-12">
                        <div class="panel panel-transparent text-center p-md">
                            <i class="fa fa-warning fa-3x text-warning"></i>
                            <h3 class="m-t-none m-b-sm text-warning">Advertencia</h3>
                            <p>Al anular, se descontar&aacute; las cantidades del stock.</p>
                        </div>
                    </div>
                </div>
                </center>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-check-square-o"></i> Aceptar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<script src="assets/scripts/inventario/func_entsal.js"></script>