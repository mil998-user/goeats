<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-truck"></i> <a href="?c=Proveedor" class="a-c">Proveedores</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Proveedores</strong>
            </li>
            <li>
                Edici&oacute;n
            </li>
        </ol>
    </div>
</div>

<div class="wrapper wrapper-content">
    <div class="row">
        <div class="col-lg-8 animated fadeIn">
            <div class="ibox float-e-margins">
                <div class="ibox-title">
                    <h5>Datos del proveedor</h5>
                </div>
                <form id="frm-proveedor" action="?c=Proveedor&a=crud" method="post" enctype="multipart/form-data">
                <input type="hidden" name="id_prov" value="<?php echo $alm->__GET('id_prov'); ?>" />
                <div class="ibox-content">
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="form-group letNumMayMin">
                                        <label class="control-label">Raz&oacute;n Social</label>
                                        <input type="text" name="razon_social" id="razon_social" value="<?php echo $alm->__GET('razon_social'); ?>" class="form-control" placeholder="Ingrese raz&oacute;n social" autocomplete="off" required />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="control-label"><?php echo $_SESSION["tribAcr"]; ?></label>
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
                                <div class="col-lg-6">
                                    <div class="form-group letNumMayMin">
                                        <label class="control-label">Direcci&oacute;n</label>
                                        <input type="text" name="direccion" id="direccion" value="<?php echo $alm->__GET('direccion'); ?>" class="form-control" placeholder="Ingrese direcci&oacute;n" autocomplete="off" required />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group ent">
                                        <label class="control-label">Tel&eacute;fono</label>
                                        <input type="text" name="telefono" id="telefono" data-mask="999999999" value="<?php echo $alm->__GET('telefono'); ?>" class="form-control" placeholder="Ingrese tel&eacute;fono" autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="control-label">Correo electr&oacute;nico</label>
                                        <input type="text" name="email" id="email" value="<?php echo $alm->__GET('email'); ?>" class="form-control" placeholder="Ingrese correo electr&oacute;nico de la empresa" autocomplete="off" />
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group letMayMin">
                                        <label class="control-label">Contacto</label>
                                        <input type="text" name="contacto" id="contacto" value="<?php echo $alm->__GET('contacto'); ?>" class="form-control" placeholder="Ingrese nombre del contacto" autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ibox-footer">
                    <div class="text-right">
                        <a href="lista_comp_prov.php" class="btn btn-white"> Cancelar</a>
                        <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i>&nbsp;Guardar</button>
                    </div>
                </div>
                </form>
            </div>
        </div>
        <div class="col-lg-4 animated fadeInRight">
            <div class="panel panel-transparent panel-dashed text-center" style="padding-top: 6rem;padding-bottom: 6rem;">
                <div class="row">
                    <div class="col-sm-8 col-sm-push-2">
                        <h2 class="ich m-t-none">Registra y modifica los datos del Proveedor</h2>
                        <i class="fa fa-long-arrow-left fa-3x"></i>
                        <p class="ng-binding">Ingrese los datos en los campos para registrar o modificar a un proveedor.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="assets/scripts/compras/proveedores/func_prov_e.js"></script>
<script src="assets/js/jquery.email-autocomplete.min.js"></script>
<script type="text/javascript">
  $(function () {
    $('#compras').addClass("active");
    $('#c-proveedores').addClass("active");
    $("#email").emailautocomplete({
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