<?php
date_default_timezone_set($_SESSION["zona_horaria"]);
setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
$fecha = date("d-m-Y h:i A");
?>
<input type="hidden" id="moneda" value="<?php echo $_SESSION["moneda"]; ?>"/>
<input type="hidden" id="codRol" value="<?php echo $_SESSION["rol_usr"]; ?>"/>
<input type="hidden" id="fechaC" value="<?php echo $fecha; ?>"/>
<input type="hidden" id="m" value="<?php echo $_GET['m']; ?>"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-money"></i> <a class="a-c" href="?c=Caja">Caja</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Caja</strong>
            </li>
            <li>Apertura - Cierre de Caja</li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content animated fadeIn">
    <div class="ibox">
        <div class="ibox-title">
            <div class="ibox-title-buttons pull-right">
                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#mdl-apertura"><i class="fa fa-plus-circle"></i> Nueva Apertura</button>
            </div>
            <h5><strong><i class="fa fa-list-ul"></i> Lista de Aperturas - Cierres de Caja</strong></h5>
        </div>
        <div class="ibox-content">
            <div class="row" >
                <div class="col-sm-4 col-sm-offset-8" style="text-align:right;" id="filter_global">
                    <div class="input-group">
                        <input class="form-control global_filter" id="global_filter" type="text">
                        <span class="input-group-btn">
                            <button class="btn btn btn-primary"> <i class="fa fa-search"></i></button>
                        </span>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-condensed table-striped" id="table" width="100%">
                    <thead>
                        <tr>
                            <th>Cajero</th>      
                            <th>Caja</th>
                            <th>Turno</th>
                            <th>Fecha de Apertura</th>
                            <th>Hora de Apertura</th>
                            <th>Monto de Apertura</th>
                            <th>Funciones</th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-apertura" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form id="frm-apertura" method="post" enctype="multipart/form-data" action="?c=Caja&a=crud">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">Apertura de Caja</h4>
            </div>
            <div class="modal-body">
                <div class="row cont01">
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Tienda</label>
                            <select name="id_tie" id="id_tie" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
                            <?php foreach($this->model->Tienda() as $r): ?>
                                <option value="<?php echo $r->id_tie; ?>"><?php echo $r->nombre; ?></option>
                            <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Usuario</label>
                            <select name="id_usu" id="id_usu" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Caja</label>
                            <select name="id_caja" id="id_caja" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
                                <?php foreach($this->model->Caja() as $r): ?>
                                    <option value="<?php echo $r->id_caja; ?>"><?php echo $r->descripcion; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Turno</label>
                            <select name="id_turno" id="id_turno" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
                                <?php foreach($this->model->Turno() as $r): ?>
                                    <option value="<?php echo $r->id_turno; ?>"><?php echo $r->descripcion; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Monto</label>
                            <div class="input-group dec">
                                <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                <input type="text" name="monto_aper" class="form-control" placeholder="Ingrese monto" autocomplete="off" required="required"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Guardar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-cierre" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-md">
        <div class="modal-content animated bounceInRight">
        <form id="frm-cierre" method="post" enctype="multipart/form-data" action="?c=Caja&a=crud">
        <input type="hidden" name="cod_apc" id="cod_apc">
        <input type="hidden" name="monto_sistema" id="monto_sistema">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">Cierre de Caja</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <ul class="sortable-list agile-list">
                            <li class="warning-element">
                                <b><i class="fa fa-user"></i> Usuario:</b> <span class="pull-right c-usuario"></span>
                                <hr/ style="margin: 5px; border-top: 0px">
                                <b><i class="fa fa-laptop"></i> Caja:</b> <span class="pull-right c-caja"></span>
                                <hr/ style="margin: 5px; border-top: 0px">
                                <b><i class="fa fa-clock-o"></i> Turno:</b> <span class="pull-right c-turno"></span>
                            </li>
                        </ul>
                    </div>
                 </div>
                 <br>
                 <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <label>Fecha de Apertura:</label>
                            <div class="input-group">
                                <span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
                                <input type="text" name="fecha_aper" id="fecha_aper" value="" class="form-control" placeholder="Fecha de apertura" autocomplete="off" required="required" readonly="true" />
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                            <label>Fecha de Cierre:</label>
                            <div class="input-group date">
                                <span class="input-group-addon"><i class="glyphicon glyphicon-calendar"></i></span>
                                <input type="text" name="fecha_cierre" id="fecha_cierre" class="form-control" placeholder="Fecha de cierre" autocomplete="off" required="required" value="<?php echo $fecha; ?>"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <label>Monto Estimado:</label>
                            <div class="input-group dec">
                                <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                <input type="text" name="monto_sis" id="monto_sis" value="0.00" class="form-control" placeholder="Monto Sistema" autocomplete="off" required="required" readonly="true" />
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                            <label>Monto Real:</label>
                            <div class="input-group dec">
                                <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                <input type="text" name="monto_cierre" id="monto_cierre" class="form-control" placeholder="Ingrese monto" autocomplete="off" required="required"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Guardar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-detalle" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog">
        <div class="modal-content animated bounceInRight">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">Detalle de Caja</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="widget lazur-bg p-xl">
                            <h4>
                                <span class="c-usuario"></span>
                            </h4>
                            <ul class="list-unstyled m-t-md">
                                <li>
                                    <span class="fa fa-newspaper-o m-r-xs"></span>
                                    <label>Caja:</label><br>
                                    <span class="c-caja"></span><br><br>
                                </li>
                                <li>
                                    <span class="fa fa-clock-o m-r-xs"></span>
                                    <label>Turno:</label><br>
                                    <span class="c-turno"></span><br><br>
                                </li>
                                <li>
                                    <span class="fa fa-calendar m-r-xs"></span>
                                    <label>Fecha de Apertura:</label><br>
                                    <span class="c-fecha-apertura"></span><br><br>
                                </li>
                                <li>
                                    <span class="fa fa-calendar m-r-xs"></span>
                                    <label>Fecha de Cierre:</label><br>
                                    <span class="c-fecha-cierre"></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div>
                            <span class="bold">A. Apertura Caja</span>
                            <small class="pull-right bold c-monto-apertura"></small>
                        </div>
                        <div class="progress progress-small" style="margin-bottom: 15px;">
                            <div style="width: 100%;" class="progress-bar progress-bar-info"></div>
                        </div>
                        <div>
                            <span class="bold">B. Ingresos</span>
                            <small class="pull-right bold c-total-ingreso"></small>
                        </div>
                        <div class="progress progress-small" style="margin-bottom: -15px;">
                            <div style="width: 100%;" class="progress-bar"></div>
                        </div>
                        <div>
                            <table class="table table-stripped small m-t-md" style="margin-bottom: 5px;">
                                <tbody>
                                    <tr>
                                        <td class="no-borders">
                                            <i class="fa fa-circle text-navy"></i>
                                        </td>
                                        <td class="no-borders">
                                            Efectivo
                                        </td>
                                        <td class="no-borders text-right c-total-ingreso-efe">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="no-borders">
                                            <i class="fa fa-circle text-navy"></i>
                                        </td>
                                        <td class="no-borders">
                                            Tarjeta
                                        </td>
                                        <td class="no-borders text-right c-total-ingreso-tar">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="no-borders">
                                            <i class="fa fa-circle text-navy"></i>
                                        </td>
                                        <td class="no-borders text-left">
                                            Ing. en Caja
                                        </td>
                                        <td class="no-borders text-right c-total-ingreso-ing">
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <span class="bold">C. Egresos</span>
                            <small class="pull-right bold c-total-egreso"></small>
                        </div>
                        <div class="progress progress-small" style="margin-bottom: -15px;">
                            <div style="width: 100%;" class="progress-bar progress-bar-danger"></div>
                        </div>
                        <div>
                            <table class="table table-stripped small m-t-md" style="margin-bottom: 5px;">
                                <tbody>
                                    <tr>
                                        <td class="no-borders">
                                            <i class="fa fa-circle text-danger"></i>
                                        </td>
                                        <td class="no-borders">
                                            Egr. en caja
                                        </td>
                                        <td class="no-borders text-right c-total-egreso-egr">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="no-borders">
                                            <i class="fa fa-circle text-danger"></i>
                                        </td>
                                        <td class="no-borders">
                                            Credito Compras
                                        </td>
                                        <td class="no-borders text-right c-total-egreso-com">
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <span class="bold">D. Descuentos</span>
                            <small class="pull-right bold c-monto-descuento"></small>
                        </div>
                        <div class="progress progress-small" style="margin-bottom: 15px;">
                            <div style="width: 100%;" class="progress-bar progress-bar-warning"></div>
                        </div>
                        <div>
                            <span class="bold">E. Monto Estimado (ST)</span>
                            <small class="pull-right bold c-monto-fisico"></small>
                        </div>
                        <div class="progress progress-small" style="margin-bottom: 15px;">
                            <div style="width: 100%;" class="progress-bar progress-bar-primary"></div>
                        </div>
                        <div>
                            <span class="bold">F. Monto Total (A+B-C)</span>
                            <small class="pull-right bold c-monto-estimado"></small>
                        </div>
                        <div class="progress progress-small" style="margin-bottom: -10px;">
                            <div style="width: 100%;" class="progress-bar progress-bar-success"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<script src="assets/scripts/caja/func_caja.js"></script>
