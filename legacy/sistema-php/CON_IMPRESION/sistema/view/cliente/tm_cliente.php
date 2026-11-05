<input type="hidden" id="m" value="<?php echo $_GET['m']; ?>"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-users"></i> <a href="?c=Cliente" class="a-c">Clientes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Clientes</strong>
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
                <a href="?c=Cliente&a=obtenerDatos" ><button type="button" class="btn btn-primary"><i class="fa fa-plus-circle"></i> Nuevo Cliente</button></a>
            </div>
            <h5><strong><i class="fa fa-list-ul"></i> Lista de Clientes</strong></h5>
        </div>
        <div class="ibox-content">
            <div class="row" >
                <div class="col-sm-12" style="text-align:right;" id="filter_global">
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
                            <th>Cliente/Raz&oacute;n Social</th>
                            <th><?php echo $_SESSION["diAcr"]; ?></th>
                            <th><?php echo $_SESSION["tribAcr"]; ?></th>
                            <th>Direcci&oacute;n</th>
                            <th style="text-align: center">Estado</th>
                            <th style="text-align: center">Acciones</th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-estado" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form id="frm-estado" method="post" enctype="multipart/form-data" action="?c=Cliente&a=Estado">
        <input type="hidden" name="cod_cliente" id="cod_cliente">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">¿Desea cambiar el estado de este cliente?</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label>Cliente/Raz&oacute;n Social: </label><br>
                            <span class="c-cliente"></span>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Estado: </label>
                            <select name="estado" id="estado" class="selectpicker form-control" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
                                <option value="a">ACTIVO</option>
                                <option value="i">INACTIVO</option>
                            </select>
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

<div class="modal inmodal fade" id="mdl-eliminar" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form id="frm-eliminar" method="post" enctype="multipart/form-data" action="?c=Cliente&a=Eliminar">
        <input type="hidden" name="cod_cliente" id="cod_cliente">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">¿Desea eliminar este cliente?</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label>Cliente/Raz&oacute;n Social: </label><br>
                            <span class="c-cliente"></span>
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

<script src="assets/scripts/cliente/func_cliente.js"></script>
