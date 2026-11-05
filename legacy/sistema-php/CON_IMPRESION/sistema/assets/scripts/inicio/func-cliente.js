$(function() {
    $('input[type="radio"].flat-red').iCheck({
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

    $('#form_c').formValidation({
        framework: 'bootstrap',
        fields: {
        }
    })
    .on('success.form.fv', function(e) {
        // Prevent form submission
        e.preventDefault();
        var $form = $(e.target);
        var fv = $form.data('formValidation');

        var ruc = $('#ruc').val();
        var dni = $('#dni').val();
        var nombres = $('#nombres').val();
        var ape_paterno = $('#ape_paterno').val();
        var ape_materno = $('#ape_materno').val();
        var fecha_nac = $('#fecha_nac').val();
        var telefono = $('#telefono').val();
        var correo = $('#correo').val();
        var razon_social = $('#razon_social').val();
        var direccion = $('#direccion').val();

        $.ajax({
            type: 'POST',
            dataType: 'json',
            data: {
                    ruc:ruc,
                    dni:dni,
                    nombres:nombres,
                    ape_paterno:ape_paterno,
                    ape_materno:ape_materno,
                    fecha_nac:fecha_nac,
                    telefono:telefono,
                    correo:correo,
                    razon_social:razon_social,
                    direccion:direccion
            },
            url: '?c=Inicio&a=NuevoCliente',
            success: function(data){
                if(data.dup == 1){
                    toastr.warning('Advertencia, Datos duplicados.');
                    return false;
                }else {
                    $('#mdl-nuevo-cliente').modal('hide');
                    $('#mdl-facturar').modal('show');

                    $('#cliente_id').val(data.cod);
                    $('#nombre_c').val(nombres+' '+ape_paterno+' '+ape_materno);
                    /*
                    var tipoCliente = $('input:radio[name=tipo_docc]:checked').val();
                    if( tipoCliente == 1){
                        $('#cliente').val(dni);
                    } else{
                        $('#cliente').val(ruc);
                    }
                    */
                    toastr.success('Datos registrados, correctamente.');
                }
            }
        });

        return false;

    });

});

/* Nuevo Cliente */
var nuevoCliente = function(){
    $('#mdl-nuevo-cliente').modal('show');
}

$('input:radio[id=td_dni]').on('ifChecked', function(event){
    $(".block01").css("display","block");
    $(".block02").css("display","none");
    $(".block03").css("display","block");
    $(".block04").css("display","block");
    $(".block05").css("display","block");
    $(".block06").css("display","block");
    $(".block07").css("display","none");
});

$('input:radio[id=td_ruc]').on('ifChecked', function(event){
    $(".block01").css("display","none");
    $(".block02").css("display","block");
    $(".block03").css("display","none");
    $(".block04").css("display","none");
    $(".block05").css("display","none");
    $(".block06").css("display","none");
    $(".block07").css("display","block");
});

/* Consultar dni del nuevo cliente */
$("#btnBuscarDni").click(function(event) {
    event.preventDefault();
    $.getJSON("http://www.facturacionsunat.com/vfpsws/vfpsconsbsapi.php?dni="+$("#dni").val()+"&token=87290E49D50B519", {
        format: "json"
    })
    .done(function(data) {
        $("#dni").val(data.dni);
        $("#nombres").val(data.nombres);
        $("#ape_paterno").val(data.ape_paterno);
        $("#ape_materno").val(data.ape_materno);
        $("#direccion").val(data.domicilio);
        $('#form_c').formValidation('revalidateField', 'nombres');
        $('#form_c').formValidation('revalidateField', 'ape_paterno');
        $('#form_c').formValidation('revalidateField', 'ape_materno');
        $('#form_c').formValidation('revalidateField', 'direccion');
    });
});

/* Consultar ruc del nuevo cliente */
$("#btnBuscarRuc").click(function(event) {
    event.preventDefault();
    $.getJSON("https://py-devs.com/api/ruc/" + $("#ruc").val(), {
        format: "json"
    })
    .done(function(data) {
        $("#dni").val(data.numero_documento);
        $("#ruc").val(data.ruc);
        $("#razon_social").val(data.nombre);
        $("#direccion").val(data.domicilio_fiscal);
        $('#form_c').formValidation('revalidateField', 'razon_social');
        $('#form_c').formValidation('revalidateField', 'direccion');
    });
});

$('#mdl-nuevo-cliente').on('hidden.bs.modal', function() {
	$('#dni_numero').val('');
	$('#ruc_numero').val('');
	$("#td_dni").iCheck('check');
    $(this).find('#form_c')[0].reset();
    $('#mdl-facturar').modal('show');
});