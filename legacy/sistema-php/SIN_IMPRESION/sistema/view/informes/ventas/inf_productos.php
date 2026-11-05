<?php
date_default_timezone_set($_SESSION["zona_horaria"]);
setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
$fecha = date("d-m-Y");
$fechaa = date("m-Y");
?>

<input type="hidden" id="moneda" value="<?php echo $_SESSION["moneda"]; ?>"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2></h2>
    </div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
    <div class="ibox">
        <div class="ibox-title">
            <div class="ibox-title-buttons pull-right">
                <a class="btn btn-warning" ui-sref="informes.ventas" href="lista_tm_informes.php"> <i class="fa fa-arrow-left"></i> Atr&aacute;s </a>
            </div>
            <h5><strong><i class="fa fa-list"></i> Ventas por producto</strong></h5>
        </div>
        <div class="ibox-content" style="position: relative; min-height: 30px;">
            <div class="row">
            <div id="table_wrapper"></div>
                <form method="post" enctype="multipart/form-data" target="_blank" action="#">
                    <div class="col-sm-3">
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group">
                                    <label class="control-label">Rango de fechas</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control bg-r text-center" name="start" id="start" value="<?php echo '01-'.$fechaa; ?>"/>
                                        <span class="input-group-addon">al</span>
                                        <input type="text" class="form-control bg-r text-center" name="end" id="end" value="<?php echo $fecha; ?>" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-2">
                        <label class="control-label">Categor&iacute;a</label>
                        <div class="form-group">
                            <select name="codCat" id="codCat" class="selectpicker form-control" data-live-search="true" autocomplete="off" data-size="5">
                                <option value="%" active>Mostrar Todo</option>
                                <optgroup>
                                    <?php foreach($this->model->Categoria() as $r): ?>
                                        <option value="<?php echo $r->id_catg; ?>"><?php echo $r->descripcion; ?></option>
                                    <?php endforeach; ?>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <label class="control-label">Producto</label>
                        <div class="form-group">
                            <select name="codPro" id="codPro" class="selectpicker form-control" data-live-search="true" autocomplete="off" data-size="5" disabled>
                                <option value="%" active>Mostrar Todo</option>
                                <optgroup>
                                    <?php foreach($this->model->Producto() as $r): ?>
                                        <option value="<?php echo $r->id_prod; ?>"><?php echo $r->nombre; ?></option>
                                    <?php endforeach; ?>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <label class="control-label">Presentaci&oacute;n</label>
                        <div class="form-group">
                            <select name="codPre" id="codPre" class="selectpicker form-control" data-live-search="true" autocomplete="off" data-size="5" disabled>
                                <option value="%" active>Mostrar Todo</option>
                                <optgroup>
                                    <?php foreach($this->model->Presentacion() as $r): ?>
                                        <option value="<?php echo $r->id_pres; ?>"><?php echo $r->presentacion; ?></option>
                                    <?php endforeach; ?>
                                <optgroup>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="punteo">
                <div class="row">
                    <div class="col-lg-6">
                        <h5 class="no-margins"><strong>Cantidad de Ventas</strong></h5>
                        <h1 class="no-margins"><strong id="cant_v"></strong></h1>
                    </div>
                    <div class="col-lg-6">
                        <h5 class="no-margins"><strong>Total de Ventas</strong></h5>
                        <h1 class="no-margins"><strong id="total_v"></strong></h1>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table id="table" class="table table-hover table-condensed table-striped" width="100%">
                    <thead>
                    <tr>
                        <th>Fecha Venta</th>
                        <th>Categor&iacute;a</th>
                        <th>Producto</th>
                        <th>Presentaci&oacute;n</th>
                        <th class="text-right">Cantidad Vendida</th>
                        <th class="text-right">Precio Venta</th>
                        <th class="text-right">Total</th>
                    </tr>
                    </thead>
                </table>
            </div>
        </div>
    </div>
</div>

<script src="assets/scripts/informes/ventas/func-prod.js"></script>
<script src="assets/js/plugins/tinycon/tinycon.min.js"></script>
