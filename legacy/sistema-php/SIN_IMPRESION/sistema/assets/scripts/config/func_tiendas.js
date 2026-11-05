$(function(){
	listarTiendas();
});

$(function() {

  /* Formulario de area de produccion */
  $('#frm-tienda')
  .formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
    fields: {
    }
    })
  .on('success.form.fv', function(e) {

    e.preventDefault();
    var $form = $(e.target),
    fv = $form.data('formValidation');

      $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Config&a=CrudTienda',
        data: {
            codTie: $('#codTie').val(),
            nomb: $('#nomb').val(),
            direc: $('#direc').val(),
            telef: $('#telef').val(),
            est: $('#est').val()
        },
        success: function (cod) {
            if(cod == 0){
                toastr.warning('Advertencia, Datos duplicados.');
                return false;
            } else if(cod == 1){
                listarTiendas();
                $('#mdl-tienda').modal('hide');
                toastr.success('Datos registrados, correctamente.');
            } else if(cod == 2) {
                listarTiendas();
                $('#mdl-tienda').modal('hide');
                toastr.success('Datos modificados, correctamente.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        }   
      });
    	return false;

  });
});

/* Mostrar datos en la tabla Area de produccion */
var listarTiendas = function(){
	var table = $('#table-tienda')
	.DataTable({
        "destroy": true,
        "responsive": true,
        "dom": "ftp",
        "bSort": false,
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=ListaTiendas",
            "data": function ( d ) {
                d.cod = '%';
            }
        },
        "columns":[
            {"data":"nombre"},
            {"data":"direccion"},
            {"data":"telefono"},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado == 'a'){
                    return '<span class="label label-primary">ACTIVO</span>';
                } else if (data.estado == 'i'){
                    return '<span class="label label-danger">INACTIVO</span>'
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><button class="btn btn-success btn-xs" onclick="editarTienda('+data.id_tie+');"><i class="fa fa-edit"></i>Editar</button>';
            }}
        ]
	});
}

/* Editar Area de produccion */
var editarTienda = function(cod){
    //ComboAlm();
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaTiendas",
        data: {
            cod: cod
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
                $('#codTie').val(campo.id_tie);
                $('#nomb').val(campo.nombre);
                $('#direc').val(campo.direccion);
                $('#telef').val(campo.telefono);
                $('#est').selectpicker('val', campo.estado);
                $('#title-tienda').text('Editar Tienda');
                $('#mdl-tienda').modal('show');
            });
        }
    });
}

/* Boton nueva area de produccion */
$('.btn-tienda').click( function() {
    $('#codTie').val('');
    $('#title-tienda').text('Nueva Tienda');
    //ComboAlm();
    $('#mdl-tienda').modal('show');
});

$('#mdl-tienda').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-tienda').formValidation('resetForm', true);
    $('#est').selectpicker('val', 'a');
});