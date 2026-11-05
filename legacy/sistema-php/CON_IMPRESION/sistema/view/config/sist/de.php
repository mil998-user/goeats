<input type="hidden" id="m" value="<?php echo $_GET['m']; ?>"/>
<div class="row wrapper border-bottom white-bg page-heading">
    <div class="col-lg-9">
        <h2><i class="fa fa-cogs"></i> <a class="a-c" href="lista_tm_otros.php">Ajustes</a></h2>
        <ol class="breadcrumb">
            <li class="active">
                <strong>Empresa</strong>
            </li>
            <li>Datos de la empresa</li>
        </ol>
    </div>
</div>

<div class="col-lg-8">
    <div class="wrapper wrapper-content animated fadeIn">
        <div class="ibox">
            <div class="ibox-content">
                <form id="form" class="wizard-big" action="?c=Config&a=GuardarDE" method="post" enctype="multipart/form-data">
                <input type="hidden" name="id" value="<?php echo $alm->__GET('id_de'); ?>"/>
                    <h1>Identificaci&oacute;n</h1>
                    <fieldset>
                        <div class="row">
                            <div class="col-sm-6 b-r">
                                <h4>Identificaci&oacute;n Tributaria</h4>
                                <p>Utilizado con el fin de poder identificar inequívocamente a toda persona natural o jurídica susceptible de tributar, asignado a éstas por los Estados, con el que confeccionan el registro o censo de las mismas, para efectos administrativo-tributarios.</p>
                                <br>
                                <div class="row">
                                    <div class="col-sm-12">       
                                        <div class="form-group letMay">
                                            <label class="control-label">Acr&oacute;nico</label>
                                            <input type="text" name="tribAcr" value="<?php echo $alm->__GET('trib_acr'); ?>" class="form-control required" pattern="[A-Za-z]{3}" autocomplete="off"/>
                                        </div>
                                    </div>
                                    <div class="col-sm-12">
                                        <div class="form-group ent">
                                            <label class="control-label">N&uacute;mero de caracteres</label>
                                            <input type="text" name="tribCar" value="<?php echo $alm->__GET('trib_car'); ?>" class="form-control required" autocomplete="off"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <h4>Documento de Identidad</h4>
                                <p>Documento público que contiene datos de identificación personal. <br>Emitido por un empleado público con autoridad competente para permitir la identificación personal e inequívoca de los ciudadanos.</p>
                                <br>
                                <div class="row">
                                    <div class="col-sm-12">       
                                        <div class="form-group letNumMay">
                                            <label class="control-label">Acr&oacute;nico</label>
                                            <input type="text" name="diAcr" value="<?php echo $alm->__GET('di_acr'); ?>" class="form-control required" autocomplete="off">
                                        </div>
                                    </div>
                                    <div class="col-sm-12">
                                        <div class="form-group ent">
                                            <label class="control-label">N&uacute;mero de caracteres</label>
                                            <input type="text" name="diCar" value="<?php echo $alm->__GET('di_car'); ?>" class="form-control required" autocomplete="off">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <h1>Informacion Inicial</h1>
                    <fieldset>
                        <div class="row">
                            <div class="col-sm-6 col-sm-offset-6">
                                <div class="form-group">
                                    <label class="control-label lblruc"><?php echo $_SESSION["tribAcr"]; ?></label>
                                    <input type="text" name="ruc" value="<?php echo $alm->__GET('ruc'); ?>" class="form-control required" maxlength="11" autocomplete="off"/>
                                </div> 
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group letNumMayMin">
                                    <label class="control-label">Raz&oacute;n social / Nombre de la empresa</label>
                                    <input type="text" name="razSoc" value="<?php echo $alm->__GET('raz_soc'); ?>" class="form-control required" autocomplete="off"/>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="form-group letNumMayMin">
                                    <label class="control-label">Direcci&oacute;n de correo electr&oacute;nico</label>
                                    <input type="text" name="direc" value="<?php echo $alm->__GET('direccion'); ?>" class="form-control required" autocomplete="off"/>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <h1>Impuesto/Moneda</h1>
                    <fieldset>
                        <div class="row">
                            <div class="col-sm-6 b-r">
                                <h4>Impuesto</h4>
                                <p>Tributo, exacci&oacute;n o la cantidad de dinero que se paga al Estado.</p>
                                <br>
                                <div class="row">
                                    <div class="col-sm-6">       
                                        <div class="form-group letNumMay">
                                            <label class="control-label">Acr&oacute;nico</label>
                                            <input type="text" name="impAcr" value="<?php echo $alm->__GET('imp_acr'); ?>" class="form-control required" autocomplete="off"/>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="form-group ent">
                                            <label class="control-label">Valor (%)</label>
                                            <input type="text" name="impVal" value="<?php echo $alm->__GET('imp_val'); ?>" class="form-control required" autocomplete="off"/>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="form-group ent">
                                            <label class="control-label">Impuesto ICBPER</label>
                                            <input type="text" name="imp_icbper" value="<?php echo $alm->__GET('imp_icbper'); ?>" class="form-control required" autocomplete="off"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <h4>Moneda</h4>
                                <p>Medida de cambio, de dinero para adquirir productos.</p>
                                <br>
                                <div class="row">
                                    <div class="col-sm-6">       
                                        <div class="form-group letNumMay">
                                            <label class="control-label">Acr&oacute;nico</label>
                                            <input type="text" name="monAcr" value="<?php echo $alm->__GET('mon_acr'); ?>" class="form-control required" autocomplete="off">
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="form-group ent">
                                            <label class="control-label">S&iacute;mbolo</label>
                                            <input type="text" name="monVal" value="<?php echo $alm->__GET('mon_val'); ?>" class="form-control required" autocomplete="off">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <h1>Logo Institucional</h1>
                    <fieldset>
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="ct-wizard-blue" id="wizardProfile">
                                   <div class="picture-container">
                                        <div class="picture">
                                            <img src="assets/img/<?php echo $alm->__GET('logo'); ?>" class="picture-src" id="wizardPicturePreview" title=""/>
                                            <input type="hidden" name="logo" value="<?php echo $alm->__GET('logo'); ?>" />
                                            <input type="file" name="logo" id="wizard-picture">
                                        </div>      
                                        <h6>Cambiar Logo de la Empresa</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function(){
        $("#wizard").steps();
        $("#form").steps({
            bodyTag: "fieldset",
            onStepChanging: function (event, currentIndex, newIndex)
            {
                // Always allow going backward even if the current step contains invalid fields!
                if (currentIndex > newIndex)
                {
                    return true;
                }

                // Forbid suppressing "Warning" step if the user is to young
                if (newIndex === 3 && Number($("#age").val()) < 18)
                {
                    return false;
                }

                var form = $(this);

                // Clean up if user went backward before
                if (currentIndex < newIndex)
                {
                    // To remove error styles
                    $(".body:eq(" + newIndex + ") label.error", form).remove();
                    $(".body:eq(" + newIndex + ") .error", form).removeClass("error");
                }

                // Disable validation on fields that are disabled or hidden.
                form.validate().settings.ignore = ":disabled,:hidden";

                // Start validation; Prevent going forward if false
                return form.valid();
            },
            onStepChanged: function (event, currentIndex, priorIndex)
            {
                // Suppress (skip) "Warning" step if the user is old enough.
                if (currentIndex === 2 && Number($("#age").val()) >= 18)
                {
                    $(this).steps("next");
                }

                // Suppress (skip) "Warning" step if the user is old enough and wants to the previous step.
                if (currentIndex === 2 && currentIndex === 3 && priorIndex === 4)
                {
                    $(this).steps("previous");
                }
            },
            onFinishing: function (event, currentIndex)
            {
                var form = $(this);

                // Disable validation on fields that are disabled.
                // At this point it's recommended to do an overall check (mean ignoring only disabled fields)
                form.validate().settings.ignore = ":disabled";

                // Start validation; Prevent form submission if false
                return form.valid();
            },
            onFinished: function (event, currentIndex)
            {
                var form = $(this);

                // Submit form input
                form.submit();
            }
        }).validate({
            errorPlacement: function (error, element)
            {
                element.before(error);
            },
            rules: {
                confirm: {
                    equalTo: "#password"
                }
            }
        });
        $("input[name='tribAcr']").keyup(function() {
            var value = $( this ).val();
            $( ".lblruc" ).text( value );
        }).keyup();
        $("input[name='tribCar']").keyup(function() {
            var value = $( this ).val();
            $('input[name="ruc"]').attr('maxlength', value);
        }).keyup();
   });
</script>
<script src="assets/scripts/config/func_de.js"></script>
<script src="assets/js/plugins/wizard/jquery.bootstrap.wizard.js" type="text/javascript"></script>
<script src="assets/js/plugins/wizard/wizard.js"></script>