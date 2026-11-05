<?php
date_default_timezone_set($_SESSION["zona_horaria"]);
setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
$fecha = date("Y-m-d");
?>
<input type="hidden" id="fecha" value="<?php echo $fecha; ?>"/>
<input type="hidden" id="cod_ape" value="<?php echo $_SESSION["apertura"]; ?>"/>
<input type="hidden" id="cod_m" value="<?php echo $_GET['Cod']; ?>"/>
<input type="hidden" id="moneda" value="<?php echo $_SESSION["moneda"]; ?>"/>
<input type="hidden" name="cod_tipe" id="cod_tipe" value="1"/>
<input type="hidden" name="cod_pag" id="cod_pag" value="1"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-sm-6">
        <h2><i class="fa fa-desktop"></i> <a class="a-c" href="inicio.php">Punto de Venta</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Estados</strong>
            </li>
            <li class="tooltip-demo">
                <small class="label label-primary" data-original-title="Mesa Libre" data-toggle="tooltip" data-placement="bottom">&nbsp;</small>
                <small class="label label-info" data-original-title="En proceso de pago" data-toggle="tooltip" data-placement="bottom">&nbsp;</small>
                <small class="label label-danger" data-original-title="Mesa Ocupada" data-toggle="tooltip" data-placement="bottom">&nbsp;</small>
            </li>
        </ol>
    </div>
    <?php if($_SESSION["rol_usr"] <> 4) { ?>
    <div class="col-sm-6 tooltip-demo">
        <div class="title-action">
            <a class="btn btn-warning btn-cm" href="#mdl-cambiar-mesa" data-toggle="modal"><i class="fa fa-exchange"></i> Cambiar Mesa</a>
        </div>
    </div>
    <?php } ?>
</div>
<div class="wrapper wrapper-content">
    <div class="row">
    <!--class m-b-md-->
        <div class="col-lg-8">
            <?php if($_SESSION["rol_usr"] <> 4) { ?>
            <div class="tabs-container">
                <ul class="nav nav-tabs right">
                    <li class="active tab01"><a data-toggle="tab" href="#tabp-1" style="border-radius: 4px 4px 0 0;">&nbsp;&nbsp;<i class="icofont-dining-table icofont-2x"></i>Mesas&nbsp;&nbsp;</a></li>
                    <li class="tab02"><a data-toggle="tab" href="#tabp-2" style="border-radius: 4px 4px 0 0;">&nbsp;&nbsp;<i class="icofont-food-cart " style="font-size: 24px"></i>Mostrador&nbsp;&nbsp;</a></li>
                    <li class="tab03"><a data-toggle="tab" href="#tabp-3" style="border-radius: 4px 4px 0 0;">&nbsp;&nbsp;<i class="icofont-food-basket" style="font-size: 24px"></i>Delivery&nbsp;&nbsp;</a></li>
                </ul>
                <div class="tab-content">
                    <div id="tabp-1" class="tab-pane active">
                        <div class="panel-body">
                            <div class="pull-right"></div>
            <?php } ?>
                            <div class="tabs-container">
                            <ul class="nav nav-tabs right">
                                <?php $cont=1; foreach($this->model->ListarCM() as $p): ?>
                                <li id="tab<?php echo $cont++; ?>"><a data-toggle="tab" href="#tab-<?php echo $p->id_catg; ?>" style="border-radius: 4px 4px 0 0;"><i class="fa fa-cube"></i><?php echo $p->descripcion; ?>&nbsp;&nbsp;</a></li>
                                <?php endforeach; ?>
                            </ul>
                            <div class="tab-content">
                                <?php $cont=1; $co=0; foreach($this->model->ListarCM() as $c): ?>
                                <div id="tab-<?php echo $c->id_catg; ?>" class="tab-pane tp<?php echo $cont++; ?>">
                                    <div class="panel-body">
                                        <div class="row" style="text-align: center;">
                                            <div class="col-sm-12">

                                                <?php if($_SESSION["rol_usr"] == 4) { ?>

                                                    <?php foreach($this->model->ListarMesa() as $r): ?>
                                                    
                                                        <?php if ($r->id_catg == $c->id_catg AND $r->estado == 'a') { ?>
                                        
                                                            <a href="#" onclick="registrarMesa(<?php echo $r->id_mesa.',\''. $r->nro_mesa.'\',\''.$r->desc_m.'\''; ?>);">
                                                                <button style="width: 122px" class="btn btn-primary dim btn-large-dim" type="button"><?php echo $r->nro_mesa ?></button>
                                                            </a>
                                                            
                                                        <?php } elseif ($r->id_catg == $c->id_catg AND $r->estado == 'p') { ?>
                                                            
                                                            <a href="pedido_mesa.php?Cod=<?php echo $r->id_pedido ?>">
                                                                <button style="width: 122px" class="btn btn-info dim btn-large-dim" type="button"> <?php echo $r->nro_mesa ?><span class="span-b"><i class="fa fa-clock-o"></i>&nbsp;<input type="hidden" name="hora_pe[]" value="<?php echo $r->fecha_p ?>"/><span id="hora_p<?php echo $co++; ?>"><?php echo $r->fecha_p ?></span>
                                                                </span></button>
                                                            </a>

                                                        <?php } elseif ($r->id_catg == $c->id_catg AND $r->estado == 'i') { ?>
                                                            
                                                            <a href="pedido_mesa.php?Cod=<?php echo $r->id_pedido ?>">
                                                                <button style="width: 122px" class="btn btn-danger dim btn-large-dim" type="button"> <?php echo $r->nro_mesa ?><span class="span-b"><i class="fa fa-clock-o"></i>&nbsp;<input type="hidden" name="hora_pe[]" value="<?php echo $r->fecha_p ?>"/><span id="hora_p<?php echo $co++; ?>"><?php echo $r->fecha_p ?></span>
                                                                </span></button>
                                                            </a>
                                                            
                                                        <?php } ?>

                                                    <?php endforeach; ?>

                                                <?php } else { ?>

                                                    <?php foreach($this->model->ListarMesa() as $r): ?>

                                                        <?php if ($r->id_catg == $c->id_catg AND $r->estado == 'a') { ?>
                                             
                                                            <button style="width: 122px" class="btn btn-primary dim btn-large-dim" onclick="nuevoPed(<?php echo $r->id_mesa.',\''. $r->nro_mesa.'\',\''. $r->desc_m.'\''; ?>)"><?php echo $r->nro_mesa ?></button>
                                                    
                                                        <?php } elseif ($r->id_catg == $c->id_catg AND $r->estado == 'p') { ?>
                                                            
                                                            <button style="width: 122px" class="btn btn-info dim btn-large-dim" onclick="listarPedidos(1,<?php echo $r->id_pedido.',\''. $r->nro_mesa.'\',\''.$r->desc_m.'\''; ?>)"> <?php echo $r->nro_mesa ?>
                                                            <span class="span-b"><i class="fa fa-clock-o"></i>&nbsp;<input type="hidden" name="hora_pe[]" value="<?php echo $r->fecha_p ?>"/>
                                                            <span id="hora_p<?php echo $co++; ?>"><?php echo $r->fecha_p ?></span>
                                                            </span>
                                                            </button>

                                                        <?php } elseif ($r->id_catg == $c->id_catg AND $r->estado == 'i') { ?>
                                                            
                                                            <button style="width: 122px" class="btn btn-danger dim btn-large-dim" onclick="listarPedidos(1,<?php echo $r->id_pedido.',\''. $r->nro_mesa.'\',\''.$r->desc_m.'\''; ?>)"> <?php echo $r->nro_mesa ?>
                                                            <span class="span-b"><i class="fa fa-clock-o"></i>&nbsp;<input type="hidden" name="hora_pe[]" value="<?php echo $r->fecha_p ?>"/>
                                                            <span id="hora_p<?php echo $co++; ?>"><?php echo $r->fecha_p ?></span>
                                                            </span>
                                                            </button>
                                                            
                                                        <?php } ?>

                                                    <?php endforeach; ?>

                                                <?php } ?>
                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
            <?php if($_SESSION["rol_usr"] <> 4) { ?>
                        </div>
                    </div>
                    <div id="tabp-2" class="tab-pane">
                        <div class="panel-body">
                            <ul class="sortable-list connectList agile-list">
                                <li class="list-group-item lihds">
                                    <div class="row">
                                        <div class="col-md-2 text-center">
                                            <strong>PEDIDO</strong>
                                        </div>
                                        <div class="col-md-2 text-center">
                                            <strong>HORA PEDIDO</strong>
                                        </div>
                                        <div class="col-md-3 text-center">
                                            <strong>ESTADO</strong>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>CLIENTE</strong>
                                        </div>
                                        <div class="col-md-2 text-right">
                                            <strong>TOTAL</strong>
                                        </div>
                                    </div>
                                </li>
                                <div id="list-mostrador"></div>
                            </ul>
                        </div>
                    </div>
                    <div id="tabp-3" class="tab-pane">
                        <div class="panel-body">
                            <div>
                                <h3 class="text-warning"><i class="fa fa-ellipsis-h"></i>&nbsp;EN PREPARACIÓN</h3>
                            </div>
                            <ul class="sortable-list connectList agile-list">
                                <li class="list-group-item lihdo">
                                    <div class="row">
                                        <div class="col-md-2 text-center">
                                            <strong>PEDIDO</strong>
                                        </div>
                                        <div class="col-md-2 text-center">
                                            <strong>HORA PEDIDO</strong>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>TEL&Eacute;FONO</strong>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>CLIENTE</strong>
                                        </div>
                                        <div class="col-md-2 text-right">
                                            <strong>TOTAL</strong>
                                        </div>
                                    </div>
                                </li>
                                <div id="list-preparacion"></div>
                            </ul>
                            <hr/>
                            <div>
                                <h3 class="text-info"><i class="fa fa-arrow-right"></i>&nbsp;ENVIADOS</h3>
                            </div>
                            <ul class="sortable-list connectList agile-list">
                                <li class="list-group-item lihd">
                                    <div class="row">
                                        <div class="col-md-2 text-center">
                                            <strong>PEDIDO</strong>
                                        </div>
                                        <div class="col-md-2 text-center">
                                            <strong>HORA PEDIDO</strong>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>TEL&Eacute;FONO</strong>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>CLIENTE</strong>
                                        </div>
                                        <div class="col-md-2 text-right">
                                            <strong>TOTAL</strong>
                                        </div>
                                    </div>
                                </li>
                                <div id="list-enviados"></div>
                            </ul>
                        </div>
                    </div>
            <?php } ?>
                </div>
            </div>
        </div>
        <?php if($_SESSION["rol_usr"] <> 4) { ?>
        <div class="col-lg-4">
            <div class="ibox float-e-margins">
                <div class="ibox-title">
                    <h5 class="title-cab">Detalle:</h5>
                    <div class="ibox-tools div-btn-nuevo" style="display: none;">
                        <button class="btn btn-danger btn-nped"><i class="fa fa-location-arrow"></i>&nbsp;Nuevo Pedido</button>
                    </div>
                </div>
                <form id="frm-gral" method="post" enctype="multipart/form-data" action="?c=Inicio&a=RMesa">
                <input type="hidden" class="codMesa" name="cod_mesa" id="cod_mesa">
                <div class="ibox-content scroll_pedidos">
                    <div class="row cont01" style="display: block">
                        <div class="col-sm-12 text-center">
                        <i class="fa fa-long-arrow-left fa-5x"></i>
                            <h2 class="ich m-t-none">Selecciona <b class="nomPed">una mesa</b><br>para poder realizar o <br>visualizar pedidos</h2>
                        </div>
                    </div>
                    <div class="row cont02" style="display: none;">
                        <div class="col-sm-12">
                            <div class="form-group letNumMayMin">
                                <label class="control-label">Nombre Cliente</label>
                                <input type="text" name="nombClie" id="nombClie" class="form-control" placeholder="Ingrese nombre cliente" autocomplete="off" required/>
                            </div>
                        </div>
                        <div class="col-sm-12 txt-telf" style="display: none;">
                            <div class="form-group ent">
                                <label class="control-label">Tel&eacute;fono</label>
                                <input type="text" name="telefClie" id="telefClie" class="form-control" placeholder="Ingrese tel&eacute;fono" autocomplete="off" required/>
                            </div>
                        </div>
                        <div class="col-sm-12 txt-direc" style="display: none;">
                            <div class="form-group letNumMayMin">
                                <label class="control-label">Direcci&oacute;n</label>
                                <input type="text" name="direcClie" id="direcClie" class="form-control" placeholder="Ingrese direcci&oacute;n" autocomplete="off" required/>
                            </div>
                        </div>
                        <div class="col-sm-12 txt-motorizado" style="display: none;">
                            <div class="form-group letNumMayMin">
                                <label class="control-label">Motorizado</label>
                                <input type="text" name="motorizado" id="motorizado" class="form-control" placeholder="Ingrese Nombre del Motorizado" autocomplete="off"/>
                            </div>
                        </div>
                        <div class="col-sm-12 txt-mozo" style="display: none;">
                            <div class="form-group">
                                <label class="control-label">Mozo</label>
                                <select name="codMozo" id="codMozo" class="selectpicker form-control" data-live-search="true" autocomplete="off" title="Seleccionar" data-size="5" required>
                                <?php foreach($this->model->ListarMozos() as $r): ?>
                                    <option value="<?php echo $r->id_usu; ?>"><?php echo $r->nombres.' '.$r->ape_paterno.' '.$r->ape_materno; ?></option>
                                <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-sm-12">
                            <div class="form-group letNumMayMin">
                                <label>Comentario:</label>
                                <textarea name="comClie" class="form-control" placeholder="Ingrese comentario" autocomplete="off" rows="5"> </textarea>
                            </div>
                        </div>
                    </div>
                    <div class="row cont03 animated fadeIn" id="list-nprod" style="display: none; margin-right: -20px; margin-left: -20px">
                    </div>
                </div>
                <div class="ibox-footer btn-footer" style="display: none">
                    <div class="row">
                        <div class="col-sm-5 text-left">
                            <div class="descriptive-icon-2 text-left totalPagar animated fadeIn"></div>
                        </div>
                        <div class="col-sm-7 text-right">
                            <button type="button" class="btn btn-white btn-canc">Cancelar</button>
                        <span class="btn-form"></span>
                        </div>
                    </div>
                </div>
                </form>
            </div>
        </div>
        <?php } ?>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-mesa" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form id="frm-mesa" method="post" enctype="multipart/form-data" action="?c=Inicio&a=RMesa">
        <input type="hidden" class="codMesa" name="cod_mesa" id="cod_mesa">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title mtp"></h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <h4 class="text-center">¿Aperturar la Mesa: <span class="s-mesa"></span>?</h4>
                        <div style="display: none;">
                            <input type="text" name="nombClie" id="nombClie" value=""/>
                            <input type="text" name="comClie" id="comClie" value=""/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-sign-in"></i> Aceptar</button>
            </div>
        </form>
        </div>
    </div>
</div>


<div class="modal inmodal fade" id="mdl-cambiar-mesa" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-md">
        <div class="modal-content animated bounceInRight">
        <form id="frm-cambiar-mesa" method="post" enctype="multipart/form-data" action="?c=Inicio&a=CambiarMesa">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">Cambiar Mesa</h4>
            </div>
            <div class="modal-body">     
                <div class="row">
                    <div class="col-sm-6">
                        <center><label class="control-label">Origen</label></center>
                        <div class="form-group">
                            <label class="control-label">Sal&oacute;n</label>
                            <select name="c_salon" id="cbo-salon-o" class="selectpicker form-control" data-live-search="true" autocomplete="off">
                            <?php foreach($this->model->ListarCM() as $r): ?>
                                <option value="<?php echo $r->id_catg; ?>"><?php echo $r->descripcion; ?></option>
                            <?php endforeach; ?>                             
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="control-label">Mesa</label>
                            <select name="c_mesa" id="c_mesa" class="selectpicker form-control" data-live-search="true" autocomplete="off" title="Seleccionar" required="required" data-size="5">                               
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-6 b-l-gray-l1">
                        <center><label class="control-label">Destino</label></center>
                        <div class="form-group">
                            <label class="control-label">Sal&oacute;n</label>
                            <select name="co_salon" id="cbo-salon-d" class="selectpicker form-control" data-live-search="true" autocomplete="off">
                            <?php foreach($this->model->ListarCM() as $r): ?>
                                <option value="<?php echo $r->id_catg; ?>"><?php echo $r->descripcion; ?></option>
                            <?php endforeach; ?>                                   
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="control-label">Mesa</label>
                            <select name="co_mesa" id="co_mesa" class="selectpicker form-control" data-live-search="true" autocomplete="off" title="Seleccionar" required="required" data-size="5"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-check-square-o"></i> Aceptar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<?php include 'view/inicio/compartido.php' ?>

<div class="modal inmodal fade" id="mdl-validar-apertura" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
            <div class="modal-header">
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="panel panel-transparent text-center p-md"> <i class="fa fa-warning fa-3x text-warning"></i> <h2 class="m-t-none m-b-sm">Advertencia</h2> <p>Para poder realizar esta operaci&oacute;n es necesario Aperturar Caja.</p></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="row">
                    <div class="col-xs-3">
                        <div class="text-left">
                            <a href="lista_tm_tablero.php" class="btn btn-default">Volver</a>
                        </div>
                    </div>
                    <div class="col-xs-9">
                        <div class="text-right">
                            <a href="lista_caja_aper.php" class="btn btn-primary">Aperturar Caja</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="assets/scripts/inicio/func-inicio.min.js"></script>
<script src="assets/scripts/inicio/func-gral.min.js"></script>
<!-- Idle Timer plugin -->
<script src="assets/js/plugins/idle-timer/idle-timer.min.js"></script>
<script type="text/javascript">
$(function() {
    $('#restau').addClass("active");
    $('#tab1').addClass("active");
    $('.tp1').addClass("active");
    $('.scroll_content').slimscroll({
        height: '410px'
    });
    $( document ).idleTimer( 10000 );
    $( document ).on( "idle.idleTimer", function(event, elem, obj){
        toastr.options = {
            "positionClass": "toast-bottom-right",
            "timeOut": false
        }
        toastr.warning('Mueva el cursor del mouse para actualizar los datos.','Sistema en Suspensión');
        $('.custom-alert').fadeIn();
        $('.custom-alert-active').fadeOut();
    });
    $( document ).on( "active.idleTimer", function(event, elem, obj, triggerevent){
        location.reload();      
    });
});
</script>