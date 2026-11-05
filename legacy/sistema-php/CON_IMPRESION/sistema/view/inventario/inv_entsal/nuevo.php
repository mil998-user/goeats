<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-archive"></i> <a href="?c=Inventario" class="a-c">Inventario</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Entrada-Salida</strong>
            </li>
            <li>
                Nuevo
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content">
    <div class="row">
        <form id="frm-inv" method="post" action="?c=Inventario&a=registrar">
        <div class="col-lg-5 animated fadeIn">
            <div class="ibox">
                <div class="ibox-content">
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="control-label">Tipo Operaci&oacute;n</label>
                                <select name="id_ope" id="id_ope" class="selectpicker form-control" data-live-search-style="begins" data-live-search="true" title="Seleccionar" data-container="body" autocomplete="off" required="required">
                                    <option value="3">ENTRADA</option>
                                    <option value="4">SALIDA</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="form-group">
                                <label class="control-label">Observaciones</label>
                                <textarea name="motivo" id="motivo" class="form-control" rows="4" required="required"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-7 animated fadeInRight">
            <div class="ibox">
                <div class="ibox-title">
                    <h5><i class="fa fa-list"></i> Detalle:</h5>
                </div>
                <div class="ibox-content">
                    <div class="row">
                        <div class="col-sm-12">
                            <input type="text" name="busq_ins" id="busq_ins" class="form-control" placeholder="Buscar..." autocomplete="off" />
                        </div>
                    </div>
                    <ul class="list-group sortable-list nvo-ins" style="display: none">
                        <li class="list-group-item" style="background:#f1f1f1">
                            <label>Insumo/Producto:</label> <span id="insumo"></span> - <label>Unidad de Medida:</label> <span class="label label-warning" id="medida"></span>
                        </li>
                        <li class="list-group-item">
                            <div class="row" style="margin-bottom: -14px">
                                <input type="hidden" name="insTipo" id="insTipo"/>
                                <input type="hidden" name="insCod" id="insCod"/>
                                <input type="hidden" name="insCant" id="insCant"/>
                                <div class="col-sm-2 dec">
                                    <div class="input-group dec">
                                        <input class="form-control" type="text" name="ins_cant" id="ins_cant" style="text-align: center;" autocomplete="off">
                                    </div>
                                </div>
                                <div class="col-sm-2">
                                    <div class="form-group">
                                        <select name="cod_med" id="cod_med" class="selectpicker form-control" data-live-search="true" autocomplete="off" data-size="5" data-container="body">
                                        </select>
                                    </div>
                                </div>
                                <div class="col-sm-3">
                                    <small>Equivale a:<br><strong><span id="con_n">0</span> - <span id="desc_m"></span></strong></small>
                                </div>
                                <div class="col-sm-3 dec">
                                    <div class="input-group dec">
                                        <span class="input-group-addon"><?php echo $_SESSION["moneda"]; ?></span>
                                        <input class="form-control" type="text" name="ins_prec" id="ins_prec" style="text-align: center;" autocomplete="off">
                                    </div>
                                </div>
                                <div class="col-sm-2">
                                    <div class="text-right">
                                        <button type="button" class="btn btn-sm btn-primary btn-agregar"><i class="fa fa-plus"></i></button>
                                        <button type="button" class="btn btn-sm btn-danger btn-eliminar"><i class="fa fa-trash"></i></button>
                                    </div>
                                </div>
                            </div> 
                        </li>
                    </ul>
                    <hr/>     
                    <table id="table-ing" class="table table-condensed table-striped table-hover animated fadeIn" width="100%">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Nombre</th>                                    
                                <th>Cantidad</th>
                                <th>Unidad Medida</th>
                                <th>Precio Costo</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="table-ing-detalle" width="100%"></tbody>
                    </table>
                </div>
                <div class="ibox-footer">
                    <div class="text-right">
                        <button class="btn btn-primary" type="submit">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
        </form>
    </div>
</div>

<script id="table-ing-detalle-template" type="text/x-jsrender" src="">
    {{for items}} 
        <tr>
            <td>{{:tipo}}</td>
            <td>
                <input name="producto_id" type="hidden" value="{{:producto_id}}" />
                <input name="producto_tipo" type="hidden" value="{{:producto_tipo}}" />
                {{:producto}}
            </td>
            <td>
                {{:cantidad}}
            </td>
            <td>
                <span class="label label-info text-uppercase">Kilos</span>
            </td>
            <td>
                <?php echo $_SESSION["moneda"]; ?> {{:precio}}
            </td>
            <td>
                <div class="text-right"><button type="button" class="btn btn-danger btn-xs" onclick="facturador.retirar({{:id}});"><i class="fa fa-trash"></i> Eliminar</button></div>
            </td>
        </tr>
    {{/for}}
</script>

<script src="assets/jquery-ui-1.12.1/jquery-ui.min.js"></script>
<script src="assets/js/js-render.js"></script>
<script src="assets/scripts/inventario/func_entsal_e.js"></script>