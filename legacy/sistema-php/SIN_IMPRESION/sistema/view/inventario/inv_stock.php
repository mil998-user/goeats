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
                Stock
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
	<div class="ibox">
		<div class="ibox-title">
			<h5><strong><i class="fa fa-list"></i> Stock</strong></h5>
		</div>
		<div class="ibox-content">
            <div class="row">
                <div class="col-sm-3">
                    <label class="control-label">Tipo</label>
                    <div class="form-group">
                        <select name="tipo_ins" id="tipo_ins" class="selectpicker form-control" data-live-search="true" autocomplete="off" data-size="5">
                            <option value="%" active>Mostrar Todo</option>
                            <optgroup>
                                <option value="1">INSUMO</option>
                                <option value="2">PRODUCTO</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="col-sm-9" id="filter_global">
                    <label class="control-label">B&uacute;squeda</label>
                    <div class="input-group">
                        <input class="form-control global_filter" id="global_filter" type="text">
                        <span class="input-group-btn">
                            <button class="btn btn btn-primary"> <i class="fa fa-search"></i></button>
                        </span>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-12">
                    <div class="table-responsive">
                        <table id="table" class="table table-hover table-condensed table-striped" width="100%">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Codigo</th>
                                    <th>Nombre</th>
                                    <th>Unidad Medida</th>
                                    <th class="text-right">Cantidad</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </div>	
		</div>
	</div>
</div>

<script src="assets/scripts/inventario/func_stock.js"></script>