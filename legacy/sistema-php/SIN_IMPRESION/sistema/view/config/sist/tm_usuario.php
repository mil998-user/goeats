<input type="hidden" id="m" value="<?php echo $_GET['m']; ?>"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-cogs"></i> <a class="a-c" href="lista_tm_otros.php">Ajustes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Empleados</strong>
            </li>
            <li>Usuarios / Roles</li>
        </ol>
    </div>
</div>
<div class="wrapper wrapper-content animated fadeIn">
    <div class="row">
        <div class="col-lg-12">
            <div class="ibox">
                <div class="ibox-title">
                    <h5><i class="fa fa-users"></i> Lista de Usuarios</h5>
                    <div class="ibox-title-buttons pull-right">
                        <a href="?c=Config&a=obtenerDatos"><button type="button" class="btn btn-primary"><i class="fa fa-plus-circle"></i> Nuevo Usuario</button></a>
                    </div>
                </div>
                <div class="ibox-content">
                    <div class="table-responsive">
                        <table class="table table-hover table-condensed table-striped" id="table" width="100%">
                            <thead>
                                <tr>
                                    <th>Nombres</th>
                                    <th>Ape.Paterno</th>
                                    <th>Ape.Materno</th>
                                    <th>Tienda</th>
                                    <th>Cargo</th>
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

<div class="modal inmodal fade" id="mdl-estado" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form id="frm-estado" method="post" enctype="multipart/form-data" action="?c=Config&a=estado">
        <input type="hidden" name="cod_usu" id="cod_usu">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">¿Desea cambiar el estado de este usuario?</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                    <div class="form-group">
                        <label class="control-label">Estado</label>
                        <select name="estado" id="estado_usu" class="selectpicker form-control" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
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
        <form id="frm-eliminar" method="post" enctype="multipart/form-data" action="?c=Config&a=eliminar">
        <input type="hidden" name="cod_usu_e" id="cod_usu_e">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title">¿Desea eliminar los datos de este usuario?</h4>
            </div>
            <div class="modal-body">
                <div class="c-body"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-check-square-o"></i> Aceptar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<script src="assets/scripts/config/func_usuario.js"></script>
<script type="text/javascript">
    $('#config').addClass("active");
</script>
