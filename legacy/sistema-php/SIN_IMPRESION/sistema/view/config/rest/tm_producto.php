<input type="hidden" id="m" value="<?php echo $_GET['m']; ?>"/>
<input type="hidden" id="moneda" value="<?php echo $_SESSION["moneda"]; ?>"/>

<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-cogs"></i> <a class="a-c" href="lista_tm_otros.php">Ajustes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Restaurante</strong>
            </li>
            <li>Productos</li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content">
    <div class="row">
        <div class="col-lg-3 animated fadeIn">
        	<div class="ibox">
		        <div class="ibox-content">
		            <div class="file-manager">
		                <h2 class="ich"><i class="fa fa-tasks"></i> Categorías</h2>
		                <a onclick="listarProductos('%')" class="file-control active">Todos</a>
		                <div class="hr-line-dashed"></div>
		                <div id="boton-catg" style="display: block">
		                    <button class="btn btn-primary btn-block btn-catg"><i class="fa fa-plus-circle"></i> A&ntilde;adir nueva categor&iacute;a</button>
		                </div>
		                <form id="frm-categoria" method="post" enctype="multipart/form-data" action="?c=Config&a=CrudCatg">
		                <input type="hidden" name="id_catg" id="id_catg">
		                <div id="nueva-catg" style="display: none">
		                    <div class="row">
		                        <div class="col-sm-12">
		                            <div class="form-group display-flex letMay">
		                                <label class="control-label">Nombre</label>
		                                <input class="form-control" type="text" autocomplete="off" placeholder="Nueva categor&iacute;a" name="nombre_catg" id="nombre_catg" required="required"/>
		                            </div>
		                        </div>
		                    </div>
		                    <div class="row">
		                        <div class="col-sm-6">
		                            <a class="btn btn-default btn-ccatg">Cancelar</a>
		                        </div>
		                        <div class="col-sm-6 text-right">
		                            <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Guardar</button>
		                        </div>
		                    </div>
		                </div>
		                </form>
		                <div class="hr-line-dashed"></div>
		                <ul class="folder-list" style="padding: 0">
		                    <div class="scroll_cat" id="ul-cat"></div>
		                </ul>
		                <div class="clearfix"></div>
		            </div>
		        </div>
		    </div>
        </div>
        <div class="col-lg-9">
        	<div class="ibox">
                <div class="ibox-content display-flexx"> 
                    <div class="btn-flex btn-group m-r-sm">
                        <a class="btn dim display-flexx display-flexx-v btn-primary">
                        <img class="filtered" src="assets/img/otros/icon-01.png" width="80" height="40">
                        <span>Platos/bebidas</span>
                        </a>
                    </div>
                    <div class="btn-flex btn-group m-r-sm">
                        <a class="btn dim display-flexx display-flexx-v btn-default" href="lista_tm_insumos.php">
                        <img class="filtered" src="assets/img/otros/icon-02.png" width="80" height="40">
                        <span>Insumos</span>
                        </a>
                    </div>
                </div>
                <div class="ibox-content" style="padding-bottom: 0px;">
                	<div class="row" style="margin-right: -20px">
				        <div class="col-md-6">
				            <a class="btn btn-primary btn-block btn-prodnuevo"><i class="fa fa-plus-circle"></i> Nuevo producto </a>
				            <br>
				            <div class="row">
				                <div class="col-sm-12" style="text-align:right;" id="filter_global">
				                    <div class="input-group m-b">
				                        <div class="input-group-addon"><i class="fa fa-search"></i></div>
				                        <input class="form-control global_filter" id="global_filter" type="text" placeholder="Buscar producto">
				                    </div>
				                </div>
				            </div>
				            <div class="row">
				                <div class="col-md-12">
				                    <table class="table table-condensed table-hover" id="table-productos">
				                        <thead>
				                            <th>Producto</th>
				                            <th style="text-align: right">¿Transformable?</th>
				                            <th style="text-align: right">¿Activo?</th>
				                            <th></th>
				                        </thead>
				                    </table>
				                </div>
				            </div>
				            <br>
				        </div>
				        <div class="col-md-6 bg-gray b-l b-t" style="padding: 15px; height: 594px">
				            <div id="head-p"></div><div id="body-c"></div><div class="scroll_pres" id="body-p"></div>
				        </div>
				    </div>
                </div>
		    </div>
	    </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-producto" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog" style="max-width:400px;">
        <div class="modal-content animated bounceInRight">
        <form id="frm-producto" method="post" enctype="multipart/form-data" action="?c=Config&a=CrudProd">
        <input type="hidden" name="cod_prod" id="cod_prod">
            <div class="modal-header">
                <h4 class="modal-title">Detalle del producto</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group display-flex letNumMayMin">
                            <input class="form-control input-lg" type="text" autocomplete="off" placeholder="Nombre del producto" name="nombre_prod" id="nombre_prod" required="required"/>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-sm-6">
                                <label style="font-weight: 500"><input name="tipo_prod" id="transf" type="radio" value="1" class="flat-red" checked="true"> Transformado</label>
                            </div>
                            <div class="col-sm-6 text-right">
                                <label style="font-weight: 500" id="l-credito"><input name="tipo_prod" id="ntransf" type="radio" value="2" class="flat-red"> No transformado</label>
                            </div>
                        </div>
                    </div>
                </div>
                <br>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <label class="control-label">&Aacute;rea de producci&oacute;n</label>
                            <select name="cod_area" id="cod_area" class="selectpicker form-control" data-live-search="true" autocomplete="off" required="required" title="Seleccionar" data-size="5">
                                <?php foreach($this->model->ListarAreasP() as $r): ?>
                                    <option value="<?php echo $r->id_areap; ?>"><?php echo $r->nombre; ?></option>
                                <?php endforeach; ?>                              
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group letNumMayMin">
                            <label class="control-label">Descripci&oacute;n</label>
                            <textarea name="descripcion" id="descripcion" class="form-control" rows="2"></textarea>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <label class="control-label">Categor&iacute;a</label>
                            <select name="cod_catg" id="cod_catg" class="selectpicker form-control" data-live-search="true" autocomplete="off" title="Seleccionar" data-size="5" required="required">
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <label class="control-label">Estado</label>
                            <select name="estado_catg" id="estado_catg" class="selectpicker form-control"  data-live-search="true" autocomplete="off">
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

<div class="modal inmodal fade" id="mdl-presentacion" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true"> 
    <div class="modal-dialog modal-md" style="min-width:360px;">
        <div class="modal-content animated bounceInRight">
        <form id="frm-presentacion" method="post" enctype="multipart/form-data" action="?c=Config&a=CrudPres">
        <input type="hidden" name="nomb_prod" id="nomb_prod">
        <input type="hidden" name="cod_producto" id="cod_producto">
        <input type="hidden" name="cod_pres" id="cod_pres" value="">
            <div class="modal-header">
                <h4 class="modal-title">Presentaci&oacute;n del producto</h4>
            </div>
            <div class="modal-body"> 
                <div class="row">
                    <div class="col-sm-5">
                        <div class="row">
                            <div class="col-sm-12">
                                <label class="control-label">Imagen</label>
                                <div class="ct-wizard-azzure" id="wizardProfile">
                                    <div class="picture-container">
                                        <div class="picture" style="width: 150px; height:150px">
                                            <img src="assets/img/productos/default.png" class="picture-src" id="wizardPicturePreview"/>
                                            <input type="hidden" name="imagen" id="imagen" value="default.png" />
                                            <input type="file" name="imagen" id="wizard-picture">
                                        </div>      
                                        <h6>Cambiar Imagen</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-7">
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group display-flex letNumMayMin">
                                    <label class="control-label">Nombre</label>
                                    <input class="form-control input-lg" type="text" autocomplete="off" name="nombre_pres" id="nombre_pres" required="" />
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-6">
                                <div class="form-group letNumMay">
                                    <label class="control-label">C&oacute;digo</label>
                                    <input class="form-control" type="text" autocomplete="off" name="cod_produ" id="cod_produ" required="" />
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label class="control-label">Precio venta</label>
                                    <div class="input-group dec">
                                        <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                        <input type="text" name="precio_prod" id="precio_prod" class="form-control" autocomplete="off" required="required" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-sm-6">
                                <div class="form-group letNumMay">
                                    <label class="control-label">Opciones </label>
                                    <input class="form-control" autocomplete="off" type="text" placeholder="(Separar por comas)"  name="opciones" id="opciones"  />
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label class="control-label">Límite</label>
                                    <div class="input-group ">
                                        <input type="text" name="limite"  autocomplete="off" id="limite" class="form-control"   value="0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group">
                                    <label class="control-label">Estado</label>
                                    <select name="estado_pres" id="estado_pres" class="selectpicker form-control" data-live-search="true" autocomplete="off" required="required">
                                        <option value="a" active>ACTIVO</option>
                                        <option value="i">INACTIVO</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-6" id="tp-1" style="display: none">
                                <div class="checkbox checkbox-success">
                                    <input type="checkbox" class="flat-green" name="id_rec" id="id_rec"/>
                                    <input type="hidden" name="id_receta" id="id_receta" value=""/>
                                    <label for="checkbox3">Tiene receta</label>
                                </div>
                            </div>
                        </div>
                        <div class="row" id="tp-2" style="display: none">
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label class="control-label">&nbsp;</label>
                                    <div class="checkbox checkbox-success">
                                        <input type="checkbox" class="flat-green" name="id_stock" id="id_stock"/>
                                        <label for="checkbox2">Control Stock</label>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group ent">
                                    <label class="control-label">Stock m&iacute;nimo</label>
                                    <input type="text" name="stock_min" id="stock_min" class="form-control" autocomplete="off"/>
                                </div>
                            </div>
                        </div>
                        <div id="mensaje-ins" style="margin-bottom: -20px"></div>
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

<div class="modal inmodal fade" id="mdl-receta" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-lg">
        <div class="modal-content animated bounceInRight">
        <form id="frm-receta" method="post" class="form_ins">
            <div class="modal-header">
                <h4 class="modal-title">Detalle de la receta</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="has-success">
                            <input type="text" name="b_insumo" id="b_insumo" class="form-control" placeholder="Buscar ingrediente..." autocomplete="off" />
                        </div>
                    </div>
                </div>
                <ul class="list-group sortable-list list-ins" style="display: none">
                    <li class="list-group-item" style="background:#f1f1f1">
                        <label>Insumo:</label> <span id="insumo"></span> - <label>Unidad de Medida:</label> <span class="label label-warning" id="medida"></span>
                    </li>
                    <li class="list-group-item">
                        <div class="row" style="margin-bottom: -14px">
                            <input type="hidden" name="cod_pre" id="cod_pre"/>
                            <input type="hidden" name="cod_ins" id="cod_ins"/>
                            <input type="hidden" name="tipo_ins" id="tipo_ins"/>
                            <div class="col-sm-2 dec">
                            <div class="input-group dec"> 
                                <input class="form-control" type="text" name="ins_cant" id="ins_cant" style="text-align: center;" autocomplete="off">
                            </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="form-group">
                                    <select name="cod_med" id="cod_med" class="selectpicker form-control" data-live-search="true" autocomplete="off" data-size="5">
                                    </select>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <small>Equivale a:<br><strong><span id="con_n">0</span> - <span id="desc_m"></span></strong></small>
                            </div>
                            <div class="col-sm-3">
                                <div class="text-right">
                                    <button type="button" class="btn btn-sm btn-danger btn-eliminar"><i class="fa fa-trash"></i></button>
                                    <button type="submit" class="btn btn-sm btn-primary"><i class="fa fa-plus"></i></button>
                                </div>
                            </div>
                        </div> 
                    </li>
                </ul>
            </form> 
            <hr/>
            <table id="table-ing" class="table table-condensed table-striped table-hover animated fadeIn" width="100%">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Nombre</th>                                    
                        <th>Cantidad</th>
                        <th>Unidad Medida</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
            </table>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn- btn-cerrar">Aceptar</button>
            </div>
        </div>
    </div>
</div>

<script src="assets/scripts/config/func_productos.js"></script>
<script src="assets/scripts/config/func_productos_ins.js"></script>
<script src="assets/js/plugins/wizard/jquery.bootstrap.wizard.js" type="text/javascript"></script>
<script src="assets/js/plugins/wizard/wizard.js"></script>
<script src="assets/jquery-ui-1.12.1/jquery-ui.min.js"></script>
<script type="text/javascript">
$(function() {
    $('#config').addClass("active");
    $('input[type="checkbox"].flat-green, input[type="radio"].flat-red').iCheck({
      checkboxClass: 'icheckbox_flat-green',
      radioClass: 'iradio_square-green'
    });
    function filterGlobal () {
    $('#table-productos').DataTable().search( 
        $('#global_filter').val()
    ).draw();
    }
    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    } );
});
</script>
