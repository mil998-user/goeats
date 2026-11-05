$(function() {
    listar();
    mensaje();

    $('#clientes').addClass("active");

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

    var moneda = $("#moneda").val();
    function filterGlobal () {
        $('#table').DataTable().search( 
            $('#global_filter').val()
        ).draw();
    }

    var table = $('#table')
    .DataTable({
        "destroy": true,
        "dom": "<'row'<'col-sm-6'><'col-sm-6'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "bSort": true,
        "ajax":{
            "method": "POST",
            "url": "?c=Cliente&a=listar"
        },
        "columns":[
        {"data":null,"render": function ( data, type, row ) {
            return '<i class="fa fa-user"></i> '+data.nombre;
        }},
        {"data": "dni"},
        {"data": "ruc"},
        {"data":null,"render": function ( data, type, row ) {
            return '<i class="fa fa-map-marker"></i> '+data.direccion;
        }},
        {"data":null,"render": function ( data, type, row ) { 
            if(data.estado == 'a'){
                return '<div class="text-center"><a onclick="estado('+data.id_cliente+',\''+data.nombre+'\''+');"><span class="label label-primary">ACTIVO</span></a></div>';
            }else if(data.estado == 'i'){
                return '<div class="text-center"><a onclick="estado('+data.id_cliente+',\''+data.nombre+'\''+');"><span class="label label-danger">INACTIVO</span></a></div>';
            }
        }},
        {"data":null,"render": function ( data, type, row ) {
            return '<div class="text-right"><a href="?c=Cliente&a=obtenerDatos&cod='+data.id_cliente+'" class="btn btn-success btn-xs"><i class="fa fa-edit"></i> Editar</a>'
                +'&nbsp;<button type="button" class="btn btn-danger btn-xs" onclick="eliminar('+data.id_cliente+',\''+data.nombre+'\''+');"><i class="fa fa-trash-o"></i></button></div>';
        }}
        ]
    });
    
    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    });
};

/* Estado del cliente Activo - Inactivo */
var estado = function(id_cliente,nombre){
    $('input[name~="cod_cliente"]').val(id_cliente);
    $(".c-cliente").text(nombre); 
    $("#mdl-estado").modal('show');
}

 /* Modal estado del cliente */
$('#mdl-estado').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-estado').formValidation('resetForm', true);
    $("#estado").val('').selectpicker('refresh');
});

/* Eliminar Cliente */
var eliminar = function(id_cliente,nombre){
    $('input[name~="cod_cliente"]').val(id_cliente);  
    $(".c-cliente").text(nombre);         
    $("#mdl-eliminar").modal('show');
}

var mensaje = function(){
    if($("#m").val() == 'n'){
        toastr.success('Datos registrados, correctamente.');
    }else if ($("#m").val() == 'u'){
        toastr.success('Datos modificados, correctamente.');
    }else if ($("#m").val() == 'd'){
        toastr.warning('Estas intentando ingresar datos que ya existen.');
    }else if ($("#m").val() == 'e'){
        toastr.warning('El cliente no puede ser eliminado.');
    }
}