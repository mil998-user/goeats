<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-cogs"></i> <a class="a-c" href="lista_tm_otros.php">Ajustes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Restaurante</strong>
            </li>
            <li>&Aacute;reas de Producci&oacute;n</li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content">
    <div class="row">
        <div class="col-lg-6 animated fadeIn">
            <div class="ibox">
                <div class="ibox-title">
                    <div class="ibox-title-buttons pull-right">
                        <button type="button" class="btn btn-primary btn-area"><i class="fa fa-plus-circle"></i> Nueva &Aacute;rea</button>
                    </div>
                    <h5><i class="fa fa-list-alt"></i> &Aacute;reas de Producci&oacute;n</h5>
                </div>
                <div class="ibox-content">
                    <table class="table table-condensed table-striped table-hover" id="table-area">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Impresora</th>
                                <th>Estado</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-lg-6 animated fadeInRight">
            <div class="panel panel-transparent panel-dashed text-center" style="padding-top: 6rem;padding-bottom: 6rem;">
                <div class="row">
                    <div class="col-sm-8 col-sm-push-2">
                        <h2 class="ich m-t-none">Selecciona un &aacute;rea de producci&oacute;n</h2>
                        <i class="fa fa-long-arrow-left fa-3x"></i>
                        <p class="ng-binding">Navega por la lista de &aacute;reas de producci&oacute;n y realize cambios..</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-areaprod" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog" style="max-width: 400px;">
        <div class="modal-content animated bounceInRight">
        <form id="frm-areaprod" method="post" enctype="multipart/form-data">
        <input type="hidden" name="cod_area" id="cod_area">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title"></h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group letNumMay">
                            <label class="control-label">Nombre</label>
                            <input type="text" name="nomb_area" id="nomb_area" class="form-control" placeholder="Ingrese nombre" autocomplete="off" required="required"/>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div class="form-group">
                            <label class="control-label">Impresora</label>
                            <select name="cod_imp" id="cod_imp" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" autocomplete="off" required="required">
                                <?php foreach($this->model->Impresora() as $r): ?>
                                    <option value="<?php echo $r->id_imp; ?>"><?php echo $r->nombre; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="form-group">
                            <label class="control-label">Estado</label>
                            <select name="estado_area" id="estado_area" class="selectpicker form-control" data-live-search="true" autocomplete="off" required="required">
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

<script src="assets/scripts/config/func_areasprod.js"></script>
<script type="text/javascript">
$(function() {
    $('#config').addClass("active");
});
</script>