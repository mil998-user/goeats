$(function() {
    listar();
    mensaje();
    $('#frm-estado').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
            estado: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            }
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

var listar = function(){
    var table = $('#table')
    .DataTable({
        "destroy": true,
        "responsive": true,
        "dom": "<'row'<'col-sm-6'><'col-sm-6'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "bSort": true,
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=listar"
        },
        "columns":[
            {"data":"nombres"},
            {"data":"ape_paterno"},
            {"data":"ape_materno"},
            {"data":"desc_t"},
            {"data":null,"render": function ( data, type, row) {
                if(data.id_rol == 1){
                    return '<span class="label label-danger">'+data.desc_r+'</span>';
                } else if (data.id_rol == 2){
                    return '<span class="label label-primary">'+data.desc_r+'</span>';
                } else if (data.id_rol == 3){
                    return '<span class="label label-warning">'+data.desc_r+'</span>';
                } else if (data.id_rol == 4){
                    return '<span class="label label-default">'+data.desc_r+'</span>';
                } else{
                    return '<span class="label label-success">'+data.desc_r+'</span>';
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado =='a'){
                    return '<div class="text-center"><a onclick="estado('+data.id_usu+');"><span class="label label-primary">ACTIVO</span></a></div>';
                } else if (data.estado == 'i'){
                    return '<div class="text-center"><a onclick="estado('+data.id_usu+');"><span class="label label-danger">INACTIVO</span></a></div>';
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><a href="?c=Config&a=obtenerDatos&cod='+data.id_usu+'"'
                +'<button type="button" class="btn btn-success btn-xs"><i class="fa fa-edit"></i> Editar</button></a>&nbsp;'
                +'<button type="button" class="btn btn-danger btn-xs" onclick="eliminar('+data.id_usu+',\''+data.nombres+' '+data.ape_paterno+' '+data.ape_materno+'\');"><i class="fa fa-trash-o"></i></button></div>';
            }}
        ]
    });
}

/* Estado usuario */
var estado = function(id_usu){
    $('#cod_usu').val(id_usu);     
    $("#mdl-estado").modal('show');
}

$('#mdl-estado').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-estado').formValidation('resetForm', true);
    $("#estado_usu").val('').selectpicker('refresh');
});

/* Eliminar usuario */
var eliminar = function(id_usu,desc_usu){
    $('#cod_usu_e').val(id_usu);   
    $(".c-body").html("<center><h4>" + desc_usu + "</h4></center>");         
    $("#mdl-eliminar").modal('show');
}

var mensaje = function(){
    if($("#m").val() == 'n'){
        toastr.success('Se ha registrado correctamente un nuevo usuario.');
        //return true;
    }else if ($("#m").val() == 'u'){
        toastr.info('Se ha modificado correctamente los datos del usuario.');
    }else if ($("#m").val() == 'd'){
        toastr.warning('Estas intentando ingresar datos que ya existen.');
    }else if ($("#m").val() == 'e'){
        toastr.error('No puedes eliminar los datos del usuario');
    }
}