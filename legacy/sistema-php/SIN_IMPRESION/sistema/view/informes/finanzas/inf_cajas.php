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
			<h5><strong><i class="fa fa-list"></i> Aperturas y cierres de caja</strong></h5>
		</div>
		<div class="ibox-content" style="position: relative; min-height: 30px;">
            <div class="row">
                <form method="post" enctype="multipart/form-data" target="_blank" action="#">
                    <div class="col-sm-3">
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
                </form>
            </div>
            <div class="table-responsive">
                <table id="table" class="table table-hover table-condensed table-striped" width="100%">
                    <thead>
	                    <tr>
	                        <th>Caja</th>
	                        <th style="width: 15%;">Usuario</th>
	                        <th>Fecha apertura</th>
	                        <th>Fecha cierre</th>
	                        <th>Monto estimado</th>
	                        <th>Monto real</th>
                            <th>Diferencia</th>
                            <th>Acciones</th>
	                    </tr>
                    </thead>
                </table>
            </div>
		</div>
	</div>
</div>

<div class="modal inmodal fade" id="detalle" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content animated bounceInRight">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">Detalle de Caja</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-4">
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
                    <div class="col-sm-4">
                        <div>
                            <span class="bold">A. Apertura Caja</span>
                            <small class="pull-right bold c-monto-apertura"></small>
                        </div>
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar progress-bar-info"></div>
                        </div>
                        <div>
                            <span class="bold">B. Ingresos</span>
                            <small class="pull-right bold c-total-ingreso"></small>
                        </div>
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar"></div>
                        </div>
                        <div>
                            <table class="table table-stripped small m-t-md" style="margin-top: -15px;">
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
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar progress-bar-danger"></div>
                        </div>
                        <div>
                            <table class="table table-stripped small m-t-md" style="margin-top: -15px;">
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
                    </div>
                    <div class="col-sm-4">
                        <div>
                            <span class="bold">E. Monto Estimado (ST)</span>
                            <small class="pull-right bold c-monto-fisico"></small>
                        </div>
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar progress-bar-primary"></div>
                        </div>
                        <div>
                            <span class="bold">F. Monto Total (A+B-C)</span>
                            <small class="pull-right bold c-monto-estimado"></small>
                        </div>
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar progress-bar-success"></div>
                        </div>
                        <div>
                            <span class="bold">G. Monto Cierre</span>
                            <small class="pull-right bold c-monto-cierre"></small>
                        </div>
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar progress-bar-navy-light"></div>
                        </div>
                        <div>
                            <span class="bold">H. Diferencia (F-G)</span>
                            <small class="pull-right bold c-monto-diferencia"></small>
                        </div>
                        <div class="progress progress-small">
                            <div style="width: 100%;" class="progress-bar progress-bar-warning"></div>
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

<script src="assets/scripts/informes/finanzas/func-cajas.js"></script>