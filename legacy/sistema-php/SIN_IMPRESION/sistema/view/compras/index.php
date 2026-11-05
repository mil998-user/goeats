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
        <h2><i class="fa fa-shopping-cart"></i> <a href="?c=Compra" class="a-c">Compras</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Compras</strong>
            </li>
            <li>
                Lista
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
    <div class="ibox">
        <div class="ibox-title">
            <div class="ibox-title-buttons pull-right">
                <a class="btn btn-primary" href="?c=Compra&a=nuevo"> <i class="fa fa-plus-circle"></i> Nueva Compra</a>
            </div>
            <h5><strong><i class="fa fa-list-ul"></i> Lista de Compras</strong></h5>
        </div>
        <div class="ibox-content" style="position: relative; min-height: 30px;">
            <div class="row">
                <form method="post" enctype="multipart/form-data" target="_blank" action="#">
                    <div class="col-sm-4">
                        <div class="row">
                            <div class="col-sm-12">
                                <label class="control-label">Rango de fechas</label>
                                <div class="form-group">
                                    <div class="input-group">
                                        <input type="text" class="form-control bg-r text-center" name="start" id="start" value="<?php echo '01-'.$fechaa; ?>"/>
                                        <span class="input-group-addon">al</span>
                                        <input type="text" class="form-control bg-r text-center" name="end" id="end" value="<?php echo $fecha; ?>" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-5">
                        <label class="control-label">Proveedor</label>
                        <div class="form-group">
                            <select name="cod_prov" id="cod_prov" class="selectpicker form-control"  data-live-search="true" autocomplete="off">
                                <option value="%" active>Mostrar Todo</option>
                                <optgroup>
                                <?php foreach($this->model->Proveedores() as $r): ?>
                                    <option value="<?php echo $r->id_prov; ?>"><?php echo $r->ruc.' - '.$r->razon_social; ?></option>
                                <?php endforeach; ?>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <label class="control-label">Tipo Comprobante</label>
                        <div class="form-group">
                            <select name="tipo_doc" id="tipo_doc" class="selectpicker form-control" data-live-search="true" autocomplete="off">
                                <option value="%" active>Mostrar Todo</option>
                                <optgroup>
                                    <option value="1">BOLETA</option>
                                    <option value="2">FACTURA</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="punteo">
                <div class="row">
                    <div class="col-lg-4">
                        <h5 class="no-margins"><strong>Subtotal</strong></h5>
                        <h1 class="no-margins"><strong id="subt_c"></strong></h1>
                    </div>
                    <div class="col-lg-4">
                        <h5 class="no-margins"><strong>IGV</strong></h5>
                        <h1 class="no-margins"><strong id="igv_c"></strong></h1>
                    </div>
                    <div class="col-lg-4">
                        <h5 class="no-margins"><strong>Total</strong></h5>
                        <h1 class="no-margins"><strong id="total_c"></strong></h1>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table id="table" class="table table-hover table-condensed table-striped" width="100%">
                    <thead>
                        <tr>
                            <th>Fecha Reg.</th>
                            <th>Fecha Doc.</th>
                            <th>Tipo Doc.</th>
                            <th>Serie - Nro.</th>
                            <th>Proveedor</th>
                            <th class="text-right">Total</th>
                            <th>Forma de pago</th>
                            <th class="text-center">Estado</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-detalle" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog">
        <div class="modal-content animated bounceInRight">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">Detalle</h4>
            </div>
            <div class="modal-body">
                <div class="table-responsive">
                    <table class="table table-hover table-condensed table-striped">
                        <thead>
                            <tr>
                                <th>C&oacute;digo</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>P.U.</th>
                                <th class="text-right">Importe</th>
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
        <form id="frm-anular" method="post" enctype="multipart/form-data" action="?c=Compra&a=anular">
        <input type="hidden" name="cod_compra" id="cod_compra">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">¿Desea anular esta compra?</h4>
            </div>
            <div class="modal-body">
                <center>
                <div class="row">
                    <div class="col-sm-12">
                        <div class="panel panel-transparent text-center p-md">
                            <i class="fa fa-warning fa-3x text-warning"></i>
                            <h3 class="m-t-none m-b-sm text-warning">Advertencia</h3>
                            <p>Al anular la compra se descontar&aacute; las cantidades del stock.</p>
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

<script src="assets/scripts/compras/func-compras.js"></script>