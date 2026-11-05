<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-cogs"></i> <a class="a-c" href="lista_tm_otros.php">Ajustes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Empresa</strong>
            </li>
            <li>Tiendas</li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content">
    <div class="row">
        <div class="col-lg-8 animated fadeIn">
            <div class="ibox">
                <div class="ibox-title">
                    <div class="ibox-title-buttons pull-right">
                        <button type="button" class="btn btn-primary btn-tienda"><i class="fa fa-plus-circle"></i> Nueva Tienda</button>
                    </div>
                    <h5><i class="fa fa-list-alt"></i> Tiendas</h5>
                </div>
                <div class="ibox-content">
                    <table class="table table-condensed table-striped table-hover" id="table-tienda">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Direcci&oacute;n</th>
                                <th>Tel&eacute;fono</th>
                                <th>Estado</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-lg-4 animated fadeInRight">
            <div class="panel panel-transparent panel-dashed text-center" style="padding-top: 6rem;padding-bottom: 6rem;">
                <div class="row">
                    <div class="col-sm-8 col-sm-push-2">
                        <h2 class="ich m-t-none">Selecciona una tienda</h2>
                        <i class="fa fa-long-arrow-left fa-3x"></i>
                        <p class="ng-binding">Navega por la lista de tiendas y realize cambios..</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-tienda" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog">
        <div class="modal-content animated bounceInRight">
        <form id="frm-tienda" method="post" enctype="multipart/form-data">
        <input type="hidden" name="codTie" id="codTie">
            <div class="modal-header mh-e">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title mt"><strong id="title-tienda"></strong></h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group letNumMayMin">
                            <label class="control-label">Nombre</label>
                            <input type="text" name="nomb" id="nomb" class="form-control input-lg" placeholder="Ingrese nombre" autocomplete="off" required="required" style="font-size: 20px" />
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="form-group letNumMayMin">
                            <label class="control-label">Direcci&oacute;n</label>
                            <input type="text" name="direc" id="direc" class="form-control" placeholder="Ingrese direcci&oacute;n" autocomplete="off" required="required"/>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group ent">
                            <label class="control-label">Tel&eacute;fono</label>
                            <input type="text" name="telef" id="telef" class="form-control" placeholder="Ingrese tel&eacute;fono" autocomplete="off" required="required"/>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="control-label">Estado</label>
                            <select name="est" id="est" class="selectpicker form-control" data-live-search="true" autocomplete="off" required="required">
                                <option value="a" active>ACTIVO</option>
                                <option value="i">INACTIVO</option>                                
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary btn-guardar"><i class="fa fa-save"></i> Guardar</button>
            </div>
        </form>
        </div>
    </div>
</div>

<script src="assets/scripts/config/func_tiendas.js"></script>
<script type="text/javascript">
$(function() {
    $('#config').addClass("active");
});
</script>