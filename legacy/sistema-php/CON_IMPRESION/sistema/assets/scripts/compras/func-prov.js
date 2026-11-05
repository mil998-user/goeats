$(function() {
		$('#frm-proveedor').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
        }
    })
    .on('success.form.fv', function(e) {

        e.preventDefault();
        var $form = $(e.target),
        fv = $form.data('formValidation');

        var ruc = $('#ruc').val(),
			razon_social = $('#razon_social').val(),
			direccion = $('#direccion').val(),
			telefono = $('#telefono').val(),
			email = $('#email').val(),
			contacto = $('#contacto').val();

			$.ajax({
				type: 'POST',
				dataType: 'json',
				data: {
						ruc:ruc,
						razon_social:razon_social,
						direccion:direccion,
						telefono:telefono,
						email:email,
						contacto:contacto
				},
				url: '?c=Compra&a=nuevoProveedor',
				success: function(data){
					if(data.dup == 1){
						toastr.warning('Advertencia, Datos duplicados.');
						return false;
					}else {
						$('#cod_prov').val(data.cod);
                        $('#dato_prov').val(razon_social);
                        $('#mdl-proveedor').modal('hide');
                        toastr.success('Datos registrados, correctamente.');
						}
					}
				});
        return false;
    });
});

/* Nuevo Proveedor */
var nuevoProveedor = function(){
    $('#frm-proveedor').formValidation('revalidateField', 'ruc');
    $('#frm-proveedor').formValidation('revalidateField', 'razon_social');
    $('#frm-proveedor').formValidation('revalidateField', 'direccion');
    $('#mdl-proveedor').modal('show');
}

/* Consultar ruc del nuevo cliente */
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

$('#mdl-proveedor').on('hidden.bs.modal', function() {
		$('#ruc_numero').val('');
    $(this).find('#frm-proveedor')[0].reset();
});