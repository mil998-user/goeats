$(function() {
    validarApertura();
    listar();
    mensaje();
    $('#caja').addClass("active");
    $('#c-ing').addClass("active");
    $('input[type="radio"].flat-red').iCheck({
      radioClass: 'iradio_square-blue'
    });
    $('#frm-nuevo').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
            importe: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    },
                    regexp: {
                        regexp: /^[0-9.]+$/i,
                        message: 'Solo se permite números'
                    }
                }
            },
            motivo: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    },
                    regexp: {
                        regexp: /^[0-9-a-záéíóúàèìòùäëïöüñ./\s]+$/i,
                        message: 'Solo se permite algunos caracteres'
                    }
                }
            }
        }
    })

    $('#frm-anular').formValidation({
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

/* Validar si se aperturo caja */
var validarApertura = function(){
  if($('#cod_ape').val() == 0){
    $('#mdl-validar-apertura').modal('show');
  }
}

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
            "url": "?c=Caja&a=listar"
        },
        "columns":[
        {"data":"fecha_reg","render": function ( data, type, row ) {
            return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y');
        }},
        {"data":"fecha_reg","render": function ( data, type, row ) {
            return '<i class="fa fa-clock-o"></i> '+moment(data).format('h:mm A');
        }},
        {"data": "motivo"},
        {"data":null,"render": function ( data, type, row ) {
            return moneda+' '+formatNumber(data.importe);
        }},
        {"data":null,"render": function ( data, type, row ) {
            if(data.estado == 'a'){
                return '<div class="text-center"><span class="label label-primary">APROBADO</span></div>';
            }else if(data.estado == 'i'){
                return '<div class="text-center"><span class="label label-danger">ANULADO</span></div>';
            }
        }},
        {"data":null,"render": function ( data, type, row ) {
            return '<div class="text-right"><button type="button" class="btn btn-danger btn-xs" onclick="anular('+data.id_ing+',\''+data.importe+'\',\''+data.motivo+'\''+');"><i class="fa fa-ban"></i> Anular</button></div>';
        }}
        ]
    });
    
    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    });
};

/* Anular ingreso administrativo */
function anular(id_ing,importe,motivo){
    $('#cod_ing').val(id_ing);
    $('.c-importe').text(importe);
    $('.c-concepto').text(motivo);
    $("#mdl-anular").modal('show');
}
 /* Modal de anular ingreso administrativo */
$('#mdl-anular').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-anular').formValidation('resetForm', true);
});

/* Nuevo ingreso administrativo */
$('#mdl-nuevo').on('hidden.bs.modal', function() {
    $('#frm-nuevo').formValidation('resetForm', true);
    $("#importe").val('');
    $("#motivo").val('');
});

var mensaje = function(){
    if($("#m").val() == 'n'){
        toastr.success('Datos registrados, correctamente.');
    }else if ($("#m").val() == 'd'){
        toastr.warning('Advertencia, Datos duplicados.');
    }else if ($("#m").val() == 'e'){
        toastr.error('No puedes eliminar el elemento seleccionado');
    }else if ($("#m").val() == 'a'){
        toastr.success('Datos anulados, correctamente');
    }
}