$(function(){
	listarImpresoras();
});

$(function() {
    $('#frm-impresora')
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
            
    cod_imp = $('#cod_imp').val();
    nomb_imp = $('#nomb_imp').val();
    estado_imp = $('#estado_imp').val();

        $.ajax({
            dataType: 'JSON',
            type: 'POST',
            url: '?c=Config&a=Crud',
            data: {
                cod_imp: cod_imp,
                nomb_imp: nomb_imp,
                estado_imp: estado_imp
            },
            success: function (cod) {
                if(cod == 0){
                    toastr.warning('Advertencia, Datos duplicados.');
                    return false;
                } else if(cod == 1){
                    listarImpresoras();
                    $('#mdl-impresora').modal('hide');
                    toastr.success('Datos registrados, correctamente.');
                } else if(cod == 2) {
                    listarImpresoras();
                    $('#mdl-impresora').modal('hide');
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

var listarImpresoras = function(){
	var table = $('#table-impresora')
	.DataTable({
        "destroy": true,
        "responsive": true,
        "dom": "ftp",
        "bSort": false,
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=listar",
            "data": function ( d ) {
                d.codigo = '%';
            }
        },
        "columns":[
            {"data":"nombre"},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado == 'a'){
                    return '<span class="label label-primary">ACTIVO</span>';
                } else if (data.estado == 'i'){
                    return '<span class="label label-danger">INACTIVO</span>'
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><button class="btn btn-success btn-xs" onclick="editar('+data.id_imp+');"><i class="fa fa-edit"></i>Editar</button>';
            }}
        ]
	});
}

/* Editar Area de produccion */
var editar = function(id_imp){
    $.ajax({
        type: "POST",
        url: "?c=Config&a=listar",
        data: {
            codigo: id_imp
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
                $('#cod_imp').val(campo.id_imp);
                $('#nomb_imp').val(campo.nombre);
                $('#estado_imp').selectpicker('val', campo.estado);
                $('.modal-title').text('Editar Impresora');
                $('#mdl-impresora').modal('show');
            });
        }
    });
}

/* Boton nueva area de produccion */
$('.btn-impresora').click( function() {
    $('#cod_imp').val('');
    $('.modal-title').text('Nueva Impresora');
    $('#mdl-impresora').modal('show');
});

$('#mdl-impresora').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-impresora').formValidation('resetForm', true);
    $('#estado_imp').selectpicker('val', 'a');
});