<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-users"></i> <a href="?c=Cliente" class="a-c">Clientes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Clientes</strong>
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
                    <h5><i class="fa fa-user"></i> Datos del cliente</h5>
                    <div class="ibox-tools">
                        <label>
                            <input name="tipo_doc" type="radio" value="1" id="td_dni" class="flat-red" checked="true"> <?php echo $_SESSION["diAcr"]; ?>
                            &nbsp;
                            <input name="tipo_doc" type="radio" value="2" id="td_ruc" class="flat-red"> <?php echo $_SESSION["tribAcr"]; ?>
                        </label> 
                    </div>
                </div>
                <form id="frm-cliente" action="?c=Cliente&a=crud" method="post" enctype="multipart/form-data">
                <input type="hidden" name="id_cliente" value="<?php echo $alm->__GET('id_cliente'); ?>"/>
                <div class="ibox-content">
                    <div class="row">
                        <div class="col-lg-6 col-lg-offset-6 block01" style="display: block;">
                            <div class="form-group">
                                <div class="input-group ent">
                                    <input type="text" name="dni" id="dni" maxlength="<?php echo $_SESSION["diCar"]; ?>" value="<?php echo $alm->__GET('dni'); ?>" class="form-control" placeholder="Ingrese n&uacute;mero" autocomplete="off" required/>
                                    <span class="input-group-btn">
                                        <button id="btnBuscarDni" class="btn btn-primary"><span class="fa fa-search"></span></button>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 col-lg-offset-6 block02" style="display: none;">
                            <div class="form-group">
                                <div class="input-group ent">
                                    <input type="text" name="ruc" id="ruc" maxlength="<?php echo $_SESSION["tribCar"]; ?>" value="<?php echo $alm->__GET('ruc'); ?>" class="form-control" placeholder="Ingrese n&uacute;mero" required autocomplete="off" />
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
                                        <input type="text" name="nombres" id="nombres" value="<?php echo $alm->__GET('nombres'); ?>" class="form-control" placeholder="Ingrese nombres" required autocomplete="off"/>
                                    </div>
                                </div>
                            </div>
                            <div class="row block04" style="display: block;">
                                <div class="col-lg-6">
                                    <div class="form-group letMayMin">
                                        <label class="control-label">Apellido Paterno</label>
                                        <input type="text" name="ape_paterno" id="ape_paterno" value="<?php echo $alm->__GET('ape_paterno'); ?>" class="form-control" placeholder="Ingrese apellido paterno" required autocomplete="off" />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group letMayMin">
                                        <label class="control-label">Apellido Materno</label>
                                        <input type="text" name="ape_materno" id="ape_materno" value="<?php echo $alm->__GET('ape_materno'); ?>" class="form-control" placeholder="Ingrese apellido materno" required autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div class="row block05" style="display: block;">
                                <div class="col-lg-6">
                                    <div class="form-group ent">
                                        <label class="control-label">Fecha de Nacimiento</label>
                                        <input type="text" name="fecha_nac" id="fecha_nac" data-mask="99-99-9999" value="<?php echo $alm->__GET('fecha_nac'); ?>" class="form-control" placeholder="Ingrese fecha de nacimiento" autocomplete="off" />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group ent">
                                        <label class="control-label">Tel&eacute;fono</label>
                                        <input type="text" name="telefono" id="telefono" value="<?php echo $alm->__GET('telefono'); ?>" class="form-control" placeholder="Ingrese tel&eacute;fono" autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div class="row block06" style="display: block;">
                                <div class="col-lg-12">
                                    <div class="form-group">
                                        <label class="control-label">Correo electr&oacute;nico</label>
                                        <input type="text" name="correo" id="correo" value="<?php echo $alm->__GET('correo'); ?>" class="form-control" placeholder="Ingrese correo electr&oacute;nico" autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row block07" style="display: none;">
                        <div class="col-lg-12">
                            <div class="form-group letNumMayMin">
                                <label class="control-label">Raz&oacute;n Social</label>
                                <input type="text" name="razon_social" id="razon_social" value="<?php echo $alm->__GET('razon_social'); ?>" class="form-control" placeholder="Ingrese raz&oacute;n social" required autocomplete="off" />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="form-group letNumMayMin">
                                <label class="control-label">Direcci&oacute;n</label>
                                <input type="text" name="direccion" id="direccion" value="<?php echo $alm->__GET('direccion'); ?>" class="form-control" placeholder="Ingrese direcci&oacute;n" required autocomplete="off" />
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
                        <h2 class="ich m-t-none">Registra y modifica los datos del Cliente</h2>
                        <i class="fa fa-long-arrow-left fa-3x"></i>
                        <p class="ng-binding">Ingrese los datos en los campos para registrar o modificar a un cliente.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
 
<script src="assets/scripts/cliente/func_cliente_e.js"></script>
<script src="assets/js/jquery.email-autocomplete.min.js"></script>
<script type="text/javascript">
  $(function () {
    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
      checkboxClass: 'icheckbox_flat-red',
      radioClass: 'iradio_square-blue'
    });
    $("#correo").emailautocomplete({
        domains: [
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "live.com",
            "facebook.com",
            "outlook.com"
            ]
        });
    });
</script>