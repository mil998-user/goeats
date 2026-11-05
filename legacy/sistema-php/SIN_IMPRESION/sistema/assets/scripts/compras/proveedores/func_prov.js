$(function() {
    listar();
    mensaje();
    $('#compras').addClass("active");
    $('#c-proveedores').addClass("active");
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
            "url": "?c=Proveedor&a=listar"
        },
        "columns":[
        {"data":null,"render": function ( data, type, row ) {
            return '<i class="fa fa-user"></i> '+data.razon_social;
        }},
        {"data": "ruc"},
        {"data":null,"render": function ( data, type, row ) {
            return '<i class="fa fa-map-marker"></i> '+data.direccion;
        }},
        {"data":null,"render": function ( data, type, row ) {
            if(data.estado == 'a'){
                return '<div class="text-center"><a onclick="estado('+data.id_prov+',\''+data.ruc+'\''+');"><span class="label label-primary">ACTIVO</span></a></div>';
            }else if(data.estado == 'i'){
                return '<div class="text-center"><a onclick="estado('+data.id_prov+',\''+data.ruc+'\''+');"><span class="label label-danger">INACTIVO</span></a></div>';
            }
        }},
        {"data":null,"render": function ( data, type, row ) {
            return '<div class="text-right"><a href="?c=Proveedor&a=obtenerDatos&cod='+data.id_prov+'" class="btn btn-success btn-xs"><i class="fa fa-edit"></i> Editar</a></div>';
        }}
        ]
    });
    
    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    });
};

/* Estado del proveedor Activo - Inactivo */
var estado = function(id_prov,ruc){
    $('#cod_prov').val(id_prov);
    $(".c-proveedor").text(ruc); 
    $("#mdl-estado").modal('show');
}

/* Modal estado del proveedor */
$('#mdl-estado').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-estado').formValidation('resetForm', true);
    $("#estado").val('').selectpicker('refresh');
});

var mensaje = function(){
    if($("#m").val() == 'n'){
        toastr.success('Datos registrados, correctamente.');
    }else if ($("#m").val() == 'u'){
        toastr.success('Datos modificados, correctamente.');
    }else if ($("#m").val() == 'd'){
        toastr.warning('Estas intentando ingresar datos que ya existen.');
    }else if ($("#m").val() == 'e'){
        toastr.warning('El proveedor no puede ser eliminado.');
    }
}