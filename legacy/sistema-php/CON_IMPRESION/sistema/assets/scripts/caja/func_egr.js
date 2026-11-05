$(function() {
    validarApertura();
    listar();
    mensaje();
    $('#caja').addClass("active");
    $('#c-egr').addClass("active");
    $('input[type="radio"].flat-red').iCheck({
      radioClass: 'iradio_square-blue'
    });
    $('.DatePicker')
        .datepicker({
            format: 'dd-mm-yyyy'
        })
    .on('changeDate', function(e) {
            $('#frm-nuevo-gasto').formValidation('revalidateField', 'fecha_comp');
        });
    $('#frm-nuevo-gasto').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
            id_tipo_doc: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
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

    $('#frm-anular-gasto').formValidation({
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
            "url": "?c=ECaja&a=listar"
        },
        "columns":[
        {"data":"fecha_re","render": function ( data, type, row ) {
            return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y');
        }},
        {"data":"fecha_re","render": function ( data, type, row ) {
            return '<i class="fa fa-clock-o"></i> '+moment(data).format('h:mm A');
        }},
        {"data": "des_tg"},
        {"data":null,"render": function ( data, type, row ) {
            return data.desc_per+' - '+data.motivo;
        }},
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
            return '<div class="text-right"><button type="button" class="btn btn-danger btn-xs" onclick="anularGasto('+data.id_ga+',\''+data.des_tg+'\',\''+data.importe+'\',\''+data.desc_per+' - '+data.motivo+'\''+');"><i class="fa fa-ban"></i> Anular</button></div>';
        }}
        ]
    });
    
    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    });
};

/* Anular gasto administrativo */
function anularGasto(cod,tipo,importe,concepto){
    $('#cod_ga').val(cod);
    $('.tipo').text(tipo);
    $('.importe').text(importe);
    $('.concepto').text(concepto);
    $("#mdl-anular-gasto").modal('show');
}
 /* Modal de anular gasto administrativo */
$('#mdl-anular-gasto').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-anular-gasto').formValidation('resetForm', true);
});

/* Nuevo gasto administrativo */
$('#mdl-nuevo-gasto').on('hidden.bs.modal', function() {
    $("#rating_0").iCheck('check');
    $('#frm-nuevo-gasto').formValidation('resetForm', true);
    $("#id_tipo_doc").val('').selectpicker('refresh');
    $("#id_per").val('').selectpicker('refresh');
    $("#importe").val('');
    $("#serie_doc").val('');
    $("#num_doc").val('');
    $("#fecha_comp").val('');
    $("#motivo").val('');
});

/* Opciones de Gastos Administrativos. Servicios-Compras-Remuneraciones */
$('input:radio[id=rating_0]').on('ifChecked', function(event){
  $("#opc").css("display","block");
  $("#opc-per").css("display","none");
  $("#id_per").val('').selectpicker('refresh');
  $("#id_tipo_doc").val('').selectpicker('refresh');
});
$('input:radio[id=rating_1]').on('ifChecked', function(event){
  $("#opc").css("display","block");
  $("#opc-per").css("display","none");
  $("#id_per").val('').selectpicker('refresh');
  $("#id_tipo_doc").val('').selectpicker('refresh');
});
$('input:radio[id=rating_2]').on('ifChecked', function(event){
  $("#id_tipo_doc").val('').selectpicker('refresh');
  $("#serie_doc").val('');
  $("#num_doc").val('');
  $("#fecha_comp").val('');
  $("#opc").css("display","none");
  $("#opc-per").css("display","block");
  $('#id_per').prop('required',true);
  $('#frm-nuevo-gasto').formValidation('revalidateField', 'id_per');
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