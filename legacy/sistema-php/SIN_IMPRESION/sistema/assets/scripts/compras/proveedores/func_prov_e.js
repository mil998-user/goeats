$(function() {
    $('#frm-proveedor').formValidation({
        framework: 'bootstrap',
        fields: {
        }
    })

    .on('success.form.fv', function(e) {
        // Prevent form submission
        e.preventDefault();
        var $form = $(e.target);
        var fv = $form.data('formValidation');
        fv.defaultSubmit();
    });
});

/* Consultar ruc del nuevo PROVEEDOR */
$("#btnBuscarRuc").click(function(event) {
    event.preventDefault();
    $.getJSON("https://py-devs.com/api/ruc/" + $("#ruc").val(), {
        format: "json"
    })
    .done(function(data) {
        $("#ruc").val(data.ruc);
        $("#razon_social").val(data.nombre);
        $("#direccion").val(data.domicilio_fiscal);
        $('#frm-proveedor').formValidation('revalidateField', 'razon_social');
        $('#frm-proveedor').formValidation('revalidateField', 'direccion');
    });
});
