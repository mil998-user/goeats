<input type="hidden" id="moneda" value="<?php echo $_SESSION["moneda"]; ?>"/>
<input type="hidden" id="cod_m" value="<?php echo $_GET['m']; ?>"/>
<input type="hidden" id="cod_p" value="<?php echo $_GET['Cod']; ?>"/>
<input type="hidden" id="cod_tipe" value="<?php echo $_SESSION["cod_tipe"]; ?>"/>
<input type="hidden" id="rol_usr" value="<?php echo $_SESSION["rol_usr"]; ?>"/>
<input type="hidden" name="cod_pag" id="cod_pag" value="2"/>

<div class="row">
    <div class="col-lg-8" style="padding: 0px !important;">
        <div class="ibox-content" style="background: #d3d3d3; border-bottom: 2px solid #72be98; padding: 10px">
            <div class="has-success">
                <div class="input-group">
                    <input type="text" name="busq_prod" id="busq_prod" class="form-control" placeholder="Buscar producto..." autocomplete="off">
                    <span class="input-group-btn">
                        <button class="btn btn btn-primary"> <i class="fa fa-search"></i></button>
                    </span>
                </div>
            </div>
        </div>
        <ul class="nav nav-tabs" id="list-catgrs" style="background: #e9e9e9;"></ul>
        <div class="tab-content" style="padding: 4px !important">
            <div id="tab-1" class="tab-pane active">
                <div class="product-list scroll_der" id="list-prods">
                    <div class="panel panel-transparent text-center">
                        <div class="row">
                            <div class="col-sm-8 col-sm-push-2">
                                <br><br><br>
                                <i class="fa fa-long-arrow-up fa-3x"></i>
                                <h2 class="ich m-t-none">Selecciona una Categor&iacute;a</h2>
                                <p class="ng-binding">Para poder agregar productos a la lista</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php if($_SESSION["rol_usr"] <> 4) { ?>
        <div class="col-lg-4 border-left" style="padding-left: 6px !important; padding-right: 6px !important; padding-top: 9px !important; background: #fff">
    <?php } else { ?>
        <div class="col-lg-4 border-left" style="padding: 0px !important;">
    <?php } ?>
    
        <div class="mail-box-header title-pink" style="border: 0px !important;">
            <div class="pull-right mail-search btn-imp"></div>
            <h2><i id="ico-ped"></i> <span class="mes_dg"></span></h2>
            <input type="hidden" id="salon_dg" value="" />
        </div>
        <div class="mail-box" style="border: 1px solid #c4c4c4;padding: 5px;margin-bottom: 0px">
            <div class="row">
                <div class="col-xs-8">
                    <i class="fa fa-user"></i> <span class="cli_dg"></span><br>
                    <i class="fa fa-calendar"></i> <span class="fec_dg"></span> <i class="fa fa-clock-o"></i> <span class="hor_dg"></span>
                </div>
                <div class="col-xs-4 text-right bc" style="display: none;margin-top: 1px">
                    <input type="hidden" name="cod_p" id="cod_p" value="<?php echo $_GET['Cod']; ?>"/>
                    <button class="btn btn-md btn-primary animated wobble" id="btn-confirmar"><i class="fa fa-location-arrow"></i>&nbsp;CONFIRMAR</button>
                </div>
            </div>
        </div>
        <?php if($_SESSION["rol_usr"] <> 4) { ?>
        <div class="mail-box scroll_izq">
        <?php } else { ?>
        <div class="mail-box">
        <?php } ?>
            <div id="nvo-ped" style="display: none;">
                <table class="table table-hover" id="nvo-ped-det"></table>
            </div>
            <div class="check-mail li-c" style="width: 100%; padding: 10px">Detalle de Pedidos:</div>    
            <div id="list-detped"></div>
        </div>
        <div class="total-box fixed" style="padding: 10px;">
            <div class="row">
                <div class="col-xs-5">
                    <div class="descriptive-icon text-left">
                        <span class="icon"><i class="fa fa-money fa-2x"></i></span>
                        <div class="text">
                            <span id="totalPagar"></span><span>por pagar</span>
                        </div>
                    </div>
                </div>
                <div class="col-xs-7">
                <?php if($_SESSION["rol_usr"] <> 4) { ?>
                    <div class="text-right opc1" style="display: none; float:left;">
                        <button type="button" class="btn btn-success" onclick="facturar(<?php echo $_GET['Cod']; ?>,2);"><i class="fa fa-files-o"></i></button>
                        <button type="button" class="btn btn-primary" onclick="facturar(<?php echo $_GET['Cod']; ?>,1);"><i class="fa fa-file-o"></i>&nbsp;Cuenta</button>
                    </div>
                <?php } ?>
                    <div class="text-right opc2" style="display: none;">
                        &nbsp;<button type="button" class="btn btn-danger" onclick="desocuparMesa(<?php echo $_GET['Cod']; ?>);"><i class="fa fa-sign-out"></i>&nbsp;Desocupar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-facturar" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
        <form id="frm-facturar" method="post" enctype="multipart/form-data" class="frm-facturar">
        <input type="hidden" name="cod_pedido" id="cod_pedido">
        <input type="hidden" name="tipoEmision" id="tipoEmision">
        <input type="hidden" name="totalPed" id="totalPed">
        <input type="hidden" name="total_pedido" id="total_pedido">
            <div class="modal-header mh" id="hhb">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title mt"><strong>CERRAR MESA</strong></h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <ul class="sortable-list connectList agile-list">
                            <li class="list-group-item lihds">
                                <strong>LISTA DE PEDIDOS:</strong>
                            </li>
                            <div class="scroll_cmesa" id="list-items"></div>
                            <input type="hidden" name="c_bolsa" id="c_bolsa"/>
                            <li class="warning-element lisbt" id="sbt" style="display: none;">
                                <div class="row">
                                    <div class="col-xs-9 col-sm-9 col-md-9">
                                        <strong>SubTotal</strong>
                                    </div>
                                    <div class="col-xs-3 col-sm-3 col-md-3">
                                        <div class="text-right">
                                            <input type="hidden" class="t_sbt"/>
                                            <strong><?php echo $_SESSION["moneda"]; ?><span class="t_sbt">0.00</span></strong>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li class="warning-element lides" id="desc" style="display: none;">
                                <div class="row">
                                    <div class="col-xs-3">
                                        <div class="text-left">
                                            <span class="form-control txtlbl">Descuento</span>
                                        </div>
                                    </div>
                                    <div class="col-xs-4">
                                        <div class="text-left">
                                            <div class="has-warning">
                                                <div class="input-group ent">
                                                    <input type="text" name="porcentaje" id="porcentaje" class="form-control" placeholder="" autocomplete="off" />
                                                    <span class="input-group-addon">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-xs-5">
                                        <div class="text-right">
                                            <div class="has-warning">
                                                <div class="input-group dec">
                                                    <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                                    <input type="text" name="m_desc" id="m_desc" class="form-control" placeholder="" autocomplete="off" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="sortable-list connectList agile-list">
                            <li class="list-group-item lihds">
                                <strong>PAGO:</strong>
                            </li>
                        </ul>
                        <div class="row">
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label>Tipo Pago</label>
                                    <select name="tipo_pago" id="tipo_pago" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off">
                                        <option value="1">EFECTIVO</option>
                                        <option value="2">TARJETA</option>
                                        <option value="3">AMBOS</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label>Tipo Documento</label>
                                    <select name="tipo_doc" id="tipo_doc" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off">
                                        <option value="1">BOLETA</option>
                                        <option value="2">FACTURA</option>
                                        <option value="3">TICKET</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-6" id="pe" style="display: none;">
                                <div class="form-group">
                                    <div class="input-group dec">
                                        <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                        <input type="text" name="pago_e" id="pago_e" class="form-control" placeholder="Efectivo" autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6" id="pt" style="display: none;">
                                <div class="form-group">
                                    <div class="input-group dec">
                                        <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                        <input type="text" name="pago_t" id="pago_t" class="form-control" placeholder="Tarjeta" autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group">
                                    <label>Cliente</label>
                                    <div class="input-group">
                                        <span class="input-group-btn">    
                                            <button type="button" class="btn btn-primary" onclick="nuevoCliente();"><i class="fa fa-plus"></i></button>
                                        </span>
                                        <input type="hidden" name="cliente_id" id="cliente_id" value="1"/>
                                        <input type="text" name="busq_cli" id="busq_cli" class="form-control" placeholder="Ingrese DNI/RUC del cliente" autocomplete="off" />
                                        <span class="input-group-btn">
                                            <button id="btnClienteLimpiar" class="btn btn-danger" type="button">
                                                <span class="fa fa-remove"></span>
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group">
                                    <input type="text" name="nombre_c" id="nombre_c" class="form-control" autocomplete="off" value="P&Uacute;BLICO GENERAL" disabled/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                
                <div class="row">
                    <div class="col-sm-6">
                        <ul class="sortable-list agile-list">
                            <li class="litot-i">
                                <div class="row">
                                    <div class="col-xs-6 col-sm-6 col-md-6">
                                        <strong>TOTAL</strong>
                                    </div>
                                    <div class="col-xs-6 col-sm-6 col-md-6">
                                        <div class="text-right">
                                            <input type="hidden" class="totalP"/>
                                            <strong><?php echo $_SESSION["moneda"]; ?><span class="totalP"></span></strong>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="col-sm-6">
                        <ul class="sortable-list agile-list">
                            <li class="litot-d">
                                <div class="row">
                                    <div class="col-xs-6 col-sm-6 col-md-6">
                                        <strong>VUELTO</strong>
                                    </div>
                                    <div class="col-xs-6 col-sm-6 col-md-6">
                                        <div class="text-right">
                                            <strong><?php echo $_SESSION["moneda"]; ?><span id="vuelto">0.00</span></strong>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="row">
                    <div class="col-xs-6">
                        <div class="text-left">
                            <span class="btn btn-warning-2" onclick="porcentajeTotal();">%</span>
                        </div>
                    </div>
                    <div class="col-xs-6">
                        <div class="text-right">
                            <button type="button" class="btn btn-white" data-dismiss="modal">Volver</button>
                            <button type="submit" class="btn btn-primary" id="btn-fact"><i class="fa fa-save"></i> Aceptar</button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-nuevo-cliente" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog">
        <div class="modal-content animated bounceInTop">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4>Nuevo Cliente</h4>
            </div>
            <form method="post" id="form_c">
            <div class="modal-body">
                <div class="row">
                    <div class="col-lg-6">
                        <div class="form-group">
                            <input name="tipo_docc" type="radio" value="1" id="td_dni" class="flat-red" checked="true"> <?php echo $_SESSION["diAcr"]; ?>
                                &nbsp;
                            <input name="tipo_docc" type="radio" value="2" id="td_ruc" class="flat-red"> <?php echo $_SESSION["tribAcr"]; ?>
                        </div>
                    </div>
                    <div class="col-lg-6 block01" style="display: block;">
                        <div class="form-group">
                            <div class="input-group ent">
                                <input type="text" name="dni" id="dni" maxlength="<?php echo $_SESSION["diCar"]; ?>" class="form-control" placeholder="Ingrese n&uacute;mero" autocomplete="off" required/>
                                <span class="input-group-btn">
                                    <button id="btnBuscarDni" class="btn btn-primary"><span class="fa fa-search"></span></button>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 block02" style="display: none;">
                        <div class="form-group">
                            <div class="input-group ent">
                                <input type="text" name="ruc" id="ruc" maxlength="<?php echo $_SESSION["tribCar"]; ?>" class="form-control" placeholder="Ingrese n&uacute;mero" required autocomplete="off" />
                                <span class="input-group-btn">
                                    <button id="btnBuscarRuc" class="btn btn-primary"><span class="fa fa-search"></span></button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="row block03" style="display: block;">
                            <div class="col-lg-12">
                                <div class="form-group letMayMin">
                                    <label class="control-label">Nombres</label>
                                    <input type="text" name="nombres" id="nombres" class="form-control" placeholder="Ingrese nombres" required autocomplete="off"/>
                                </div>
                            </div>
                        </div>
                        <div class="row block04" style="display: block;">
                            <div class="col-lg-6">
                                <div class="form-group letMayMin">
                                    <label class="control-label">Apellido Paterno</label>
                                    <input type="text" name="ape_paterno" id="ape_paterno" class="form-control" placeholder="Ingrese apellido paterno" required autocomplete="off" />
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-group letMayMin">
                                    <label class="control-label">Apellido Materno</label>
                                    <input type="text" name="ape_materno" id="ape_materno" class="form-control" placeholder="Ingrese apellido materno" required autocomplete="off" />
                                </div>
                            </div>
                        </div>
                        <div class="row block05" style="display: block;">
                            <div class="col-lg-6">
                                <div class="form-group ent">
                                    <label class="control-label">Fecha de Nacimiento</label>
                                    <input type="text" name="fecha_nac" id="fecha_nac" data-mask="99-99-9999" class="form-control" placeholder="Ingrese fecha de nacimiento" autocomplete="off" />
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-group ent">
                                    <label class="control-label">Tel&eacute;fono</label>
                                    <input type="text" name="telefono" id="telefono" class="form-control" placeholder="Ingrese tel&eacute;fono" autocomplete="off" />
                                </div>
                            </div>
                        </div>
                        <div class="row block06" style="display: block;">
                            <div class="col-lg-12">
                                <div class="form-group">
                                    <label class="control-label">Correo electr&oacute;nico</label>
                                    <input type="text" name="correo" id="correo" class="form-control" placeholder="Ingrese correo electr&oacute;nico" autocomplete="off" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row block07" style="display: none;">
                    <div class="col-lg-12">
                        <div class="form-group letNumMayMin">
                            <label class="control-label">Raz&oacute;n Social</label>
                            <input type="text" name="razon_social" id="razon_social" class="form-control" placeholder="Ingrese raz&oacute;n social" required autocomplete="off" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="form-group letNumMayMin">
                            <label class="control-label">Direcci&oacute;n</label>
                            <input type="text" name="direccion" id="direccion" class="form-control" placeholder="Ingrese direcci&oacute;n" required autocomplete="off" />
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Volver</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Guardar</button>
            </div>
            </form>
        </div>
    </div>
</div>

<?php include 'view/inicio/compartido.php' ?>

<div class="modal inmodal fade" id="mdl-desocupar-mesa" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form method="post" enctype="multipart/form-data" action="?c=Inicio&a=Desocupar">
            <input type="hidden" name="cod_pede" id="cod_pede">
            <input type="hidden" name="cod_tipe" value="<?php echo $_SESSION["cod_tipe"]; ?>"/>
            <div class="modal-header mh-p">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <i class="fa fa-sign-out modal-icon"></i>
            </div>
            <div class="modal-body">
                <br><center><h4>¿Desea desocupar la mesa?</h4></center><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-check-square-o"></i> Aceptar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<script id="nvo-ped-det-template" type="text/x-jsrender" src="">
    <thead>
        <tr ><td class="li-c" colspan="4" style="padding: 10px">Nuevo Pedido:</td></tr> 
    </thead>
    {{for items}}
    <tr class="warning-element animated tr-np">
        <td class="project-status cant-np">
            <input type="hidden" name="producto_id" value="{{:producto_id}}"/>
            <input type="hidden" name="area_id" value="{{:area_id}}"/>
            <input type="hidden" name="nombre_imp" value="{{:nombre_imp}}"/>
            <input type="hidden" name="precio" value="{{:precio}}"/>
            <input class="touchspin1 input-sm text-center" type="text" value="{{:cantidad}}" name="cantidad" onchange="pedido.actualizar({{:id}}, this);"/>
        </td>
        <td class="project-title">
            <span name="producto">{{:producto}}</span> <span name="presentacion" class="label label-warning text-uppercase">{{:presentacion}}</span>
            <br>
            <small>1 Unidad(es) en <b><?php echo $_SESSION["moneda"]; ?> <span name="total">{{:precio}}</b></span> / Unidad(es)</small>
        </td>
        <td class="project-actions btn-np">
            <button type="button" class="btn btn-sm btn-warning" onclick="pedido.comentar({{:id}}, this);"><i class="fa fa-comment"></i></button>
            <button type="button" class="btn btn-sm btn-warning" onclick="pedido.retirar({{:id}});"><i class="fa fa-times"></i></button>
        </td>
        <?php if($_SESSION["rol_usr"] <> 4) { ?>
        <td id="com{{:id}}" style="display: none; position: absolute; z-index: 1; margin-left: -99%; width: 81%; height: 35px">
        <?php } else { ?>
        <td id="com{{:id}}" style="display: none; position: absolute; z-index: 1; margin-left: -99%; width: 75%; height: 35px">
        <?php } ?>
            <input style="height: 36px" type="text" name="comentario" class="form-control" value="{{:comentario}}" placeholder="Agrega un comentario aqu&iacute;..." onchange="pedido.actualizar({{:id}}, this);"/>
        </td>
    </tr>
    {{/for}}
    <tfoot>
        <tr>
            <td class="li-c text-right" colspan="4" style="padding: 10px">Total a confirmar <b><?php echo $_SESSION["moneda"]; ?>{{:total}}</b></td>
        </tr>
    </tfoot>
</script>

<script src="assets/scripts/inicio/func-procesos.js"></script>
<script src="assets/scripts/inicio/func-gral.min.js"></script>
<script src="assets/scripts/inicio/func-cliente.min.js"></script>
<script src="assets/jquery-ui-1.12.1/jquery-ui.min.js"></script>
<script src="assets/js/js-render.js"></script>
<script src="assets/js/jquery.email-autocomplete.min.js"></script>
<script type="text/javascript">
    $('#restau').addClass("active");
</script>