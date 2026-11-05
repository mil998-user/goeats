<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-table"></i> <a href="?c=Cliente" class="a-c">Tiraje de comprobante</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>TIRAJE DE COMPROBANTES</strong>
            </li>
            <li>
                Edici&oacute;n
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content">
    <div class="row">
        <div class="col-lg-6 animated fadeIn">
            <div class="ibox float-e-margins">
                <div class="ibox-title">
                    <h5><i class="fa fa-table"></i> Tiraje de comprobante</h5>
                   
                </div>
                <form id="frm-cliente" action="?c=Config&a=crud" method="post" enctype="multipart/form-data">
                <input type="hidden" name="idtiraje" value="<?php echo $alm->__GET('idtiraje'); ?>"/>
                <input type="hidden" name="id_comprobante" value="<?php echo $alm->__GET('id_comprobante'); ?>"/>
                <div class="ibox-content">
                    
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="row block03" style="display: block;">
                                <div class="col-lg-12">
                                    <div class="form-group letMayMin">
                                        <label class="control-label">Contribuyenye</label>
                                        <input type="text" name="contribuyente" id="contribuyente" value="<?php echo $alm->__GET('contribuyente'); ?>" class="form-control" placeholder="Ingrese Contribuyenye" required autocomplete="off"/>
                                    </div>
                                </div>
                            </div>
                            <div class="row block04" style="display: block;">
                                <div class="col-lg-6">
                                    <div class="form-group letMayMin">
                                        <label class="control-label">Régimen</label>
                                        <input type="text" name="regimen" id="regimen" value="<?php echo $alm->__GET('regimen'); ?>" class="form-control" placeholder="Ingrese régimen" required autocomplete="off" />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group letMayMin">
                                        <label class="control-label">Ciudad</label>
                                        <input type="text" name="ciudad" id="ciudad" value="<?php echo $alm->__GET('ciudad'); ?>" class="form-control" placeholder="Ingrese ciudad" required autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div class="row block04" style="display: block;">
                                <div class="col-lg-6">
                                    <div class="form-group ">
                                        <label class="control-label">Serie</label>
                                        <input type="text" name="serie" id="serie" value="<?php echo $alm->__GET('serie'); ?>" class="form-control" placeholder="Ingrese serie" required  />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group ">
                                        <label class="control-label">Autorización SRI</label>
                                        <input type="text" name="aut_sri" id="aut_sri" value="<?php echo $alm->__GET('aut_sri'); ?>" class="form-control" placeholder="Ingrese aut" required  />
                                    </div>
                                </div>
                            </div>
                            <div class="row block04" style="display: block;">
                                <div class="col-lg-4">
                                    <div class="form-group ent">
                                        <label class="control-label">Desde</label>
                                        <input type="text" name="desde" id="desde" value="<?php echo $alm->__GET('desde'); ?>" class="form-control" placeholder="Ingrese desde" required autocomplete="off" />
                                    </div>
                                </div>
                                <div class="col-lg-4">
                                    <div class="form-group ent">
                                        <label class="control-label">Hasta</label>
                                        <input type="text" name="hasta" id="hasta" value="<?php echo $alm->__GET('hasta'); ?>" class="form-control" placeholder="Ingrese aut" required autocomplete="off" />
                                    </div>
                                </div>
                                <div class="col-lg-4">
                                    <div class="form-group ent">
                                        <label class="control-label">Disponibles</label>
                                        <input type="text" name="disponibles" id="disponibles" value="<?php echo $alm->__GET('disponibles'); ?>" class="form-control" placeholder="Ingrese " required autocomplete="off" />
                                    </div>
                                </div>
                            </div>

                            
                            
                        </div>
                    </div>
                    

                    <hr>
                    <h2>Datos de la imprenta</h2>
                    <div class="row block04" style="display: block;">
                        <div class="col-lg-6">
                            <div class="form-group letMayMin">
                                <label class="control-label">Nombre imprenta</label>
                                <input type="text" name="imprenta" id="imprenta" value="<?php echo $alm->__GET('imprenta'); ?>" class="form-control" placeholder="Ingrese imprenta" required autocomplete="off" />
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-group letMayMin">
                                <label class="control-label">Dueño imprenta</label>
                                <input type="text" name="imp_dueno" id="imp_dueno" value="<?php echo $alm->__GET('imp_dueno'); ?>" class="form-control" placeholder="Ingrese dueño" required autocomplete="off" />
                            </div>
                        </div>
                    </div>

                    <div class="row block04" style="display: block;">
                        <div class="col-lg-6">
                            <div class="form-group ">
                                <label class="control-label">RUC imprenta</label>
                                <input type="text" name="imp_ruc" id="imp_ruc" value="<?php echo $alm->__GET('imp_ruc'); ?>" class="form-control" placeholder="Ingrese RUC" required autocomplete="off" />
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-group ">
                                <label class="control-label">Número Autorización imprenta</label>
                                <input type="text" name="imp_num_aut" id="imp_num_aut" value="<?php echo $alm->__GET('imp_num_aut'); ?>" class="form-control" placeholder="Ingrese " required  />
                            </div>
                        </div>
                    </div>

                    <div class="row block04" style="display: block;">
                        <div class="col-lg-6">
                            <div class="form-group ent">
                                <label class="control-label">Fecha emisión imprenta</label>
                                <input type="text" name="imp_fecha_emision" id="imp_fecha_emision" data-mask="99-99-9999" value="<?php echo $alm->__GET('imp_fecha_emision'); ?>" class="form-control" placeholder="Ingrese fecha" required autocomplete="off" />
                            </div>
                        </div> 
                        <div class="col-lg-6">
                            <div class="form-group ">
                                <label class="control-label">Válido desde</label>
                                <input type="text" name="imp_valido" id="imp_valido" value="<?php echo $alm->__GET('imp_valido'); ?>" class="form-control" placeholder="Ingrese " required  />
                            </div>
                        </div>
                    </div>
                    <div class="row block04" style="display: block;">
                        <div class="col-lg-6">
                            <div class="form-group ent">
                                <label class="control-label">Fecha hasta válido</label>
                                <input type="text" name="imp_fecha_valido" id="imp_fecha_valido" data-mask="99-99-9999" value="<?php echo $alm->__GET('imp_fecha_valido'); ?>" class="form-control" placeholder="Ingrese fecha" required autocomplete="off" />
                            </div>
                        </div>
                        
                    </div>

                    <hr>
                    <h2>Estado</h2>

                    <div class="row block04" style="display: block;">
                        <div class="col-lg-12">
                            <div class="form-group letMayMin">
                                <label class="control-label">Estado</label>
                                <select name="estado" id="estado" class="form-control">
                                    <option value="1">ACTIVO</option>
                                    <option value="0">INACTIVO</option>
                                </select>
                            </div>
                        </div>
                        
                    </div>

                </div>
                <div class="ibox-footer">
                    <div class="text-right">
                        <a href="lista_tm_clientes.php" class="btn btn-white"> Cancelar</a>
                        <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i>&nbsp;Guardar</button>
                    </div>
                </div>
            </form>
            </div>
        </div>
        <div class="col-lg-6 animated fadeInRight">
            <div class="panel panel-transparent panel-dashed text-center" style="padding-top: 6rem;padding-bottom: 6rem;">
                <div class="row">
                    <div class="col-sm-8 col-sm-push-2">
                        <h2 class="ich m-t-none">Registra y modifica los datos </h2>
                        <i class="fa fa-long-arrow-left fa-3x"></i>
                        <p class="ng-binding">Ingrese los datos en los campos para registrar o modificar.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="assets/scripts/config/func_td.js"></script>
