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
                Kardex Valorizado
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
	<div class="ibox">
		<div class="ibox-title">
			<h5><strong><i class="fa fa-list"></i> Kardex Valorizado</strong></h5>
		</div>
		<div class="ibox-content">
            <div class="row">
                <form method="post" enctype="multipart/form-data" target="_blank" action="#">
                    <div class="col-sm-2">
                        <label class="control-label">Categor&iacute;a</label>
                        <div class="form-group">
                            <select name="tipo_ip" id="tipo_ip" class="selectpicker form-control" data-live-search="true" autocomplete="off">
                                <option value="1">INSUMOS</option>
                                <option value="2">PRODUCTOS</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <label class="control-label">Producto/Insumo</label>
                        <div class="form-group">
                            <select name="id_ip" id="id_ip" class="selectpicker form-control" data-live-search="true" autocomplete="off" title="Seleccionar" data-size="5">
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="row">
                <br>
                <div class="col-sm-12">
                    <ul>
                        <li><b>C&oacute;digo Unidad Medida: </b><span class="umed"></span></li>
                    </ul>
                    
                </div>
                <div class="col-sm-12">
                    <div class="table-responsive">
                        <table id="table" class="table table-hover table-condensed table-striped" width="100%">
                            <thead>
                                <tr>
                                    <th rowspan="2" style="width: 8%; vertical-align: bottom">Fecha</th>
                                    <th rowspan="2" style="width: 30%; vertical-align: bottom">Concepto</th>
                                    <th colspan="3" style="text-align: center;" class="text-navy">Entrada</th>
                                    <th colspan="3" style="text-align: center" class="text-danger">Salida</th>
                                    <th colspan="3" style="text-align: center" class="text-success">Saldo</th>
                                </tr>
                                <tr>
                                    <th>Cantidad</th>
                                    <th>Costo Uni.</th>
                                    <th>Total</th>
                                    <th>Cantidad</th>
                                    <th>Costo Uni.</th>
                                    <th>Total</th>
                                    <th>Cantidad</th>
                                    <th>Costo Uni.</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </div>	
		</div>
	</div>
</div>

<script src="assets/scripts/inventario/func_kardexv.js"></script>