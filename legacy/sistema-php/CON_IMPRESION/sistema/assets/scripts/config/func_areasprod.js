$(function(){
	//listarAlmacenes();
	listarAreaProd();
});

$(function() {
    $('#frm-areaprod')
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
            
    cod_area = $('#cod_area').val();
    cod_imp = $('#cod_imp').val();
    nomb_area = $('#nomb_area').val();
    estado_area = $('#estado_area').val();

        $.ajax({
            dataType: 'JSON',
            type: 'POST',
            url: '?c=Config&a=CrudAreaP',
            data: {
                cod_area: cod_area,
                nomb_area: nomb_area,
                cod_imp: cod_imp,
                estado_area: estado_area
            },
            success: function (cod) {
                if(cod == 0){
                    toastr.warning('Advertencia, Datos duplicados.');
                    return false;
                } else if(cod == 1){
                    listarAreaProd();
                    $('#mdl-areaprod').modal('hide');
                    toastr.success('Datos registrados, correctamente.');
                } else if(cod == 2) {
                    listarAreaProd();
                    $('#mdl-areaprod').modal('hide');
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
var listarAreaProd = function(){
	var table = $('#table-area')
	.DataTable({
        "destroy": true,
        "responsive": true,
        "dom": "ftp",
        "bSort": false,
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=ListaAreasP",
            "data": function ( d ) {
                d.codigo = '%';
            }
        },
        "columns":[
            {"data":"nombre"},
            {"data":"Impresora.nombre"},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado == 'a'){
                    return '<span class="label label-primary">ACTIVO</span>';
                } else if (data.estado == 'i'){
                    return '<span class="label label-danger">INACTIVO</span>'
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><button class="btn btn-success btn-xs" onclick="editar_area('+data.id_areap+');"><i class="fa fa-edit"></i>Editar</button>';
            }}
        ]
	});
}

/* Editar Area de produccion */
var editar_area = function(cod){
    //ComboAlm();
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaAreasP",
        data: {
            codigo: cod
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
                $('#cod_area').val(campo.id_areap);
                $('#nomb_area').val(campo.nombre);
                $('#estado_area').selectpicker('val', campo.estado);
                $('#cod_imp').selectpicker('val', campo.id_imp);
                $('.modal-title').text('Editar Área de producción');
                $('#mdl-areaprod').modal('show');
            });
        }
    });
}

/* Boton nueva area de produccion */
$('.btn-area').click( function() {
    $('#cod_area').val('');
    $('.modal-title').text('Nueva Área de producción');
    $('#mdl-areaprod').modal('show');
});

$('#mdl-areaprod').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-areaprod').formValidation('resetForm', true);
    $('#estado_area').selectpicker('val', 'a');
});