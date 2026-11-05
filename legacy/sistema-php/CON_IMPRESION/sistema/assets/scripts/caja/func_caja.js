$(function() {
    moment.locale('es');
    listar();
    mensaje();

    $('#frm-apertura').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
            id_per: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            id_caja: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            id_turno: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            monto_aper: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            }
        }
    })

    $('#frm-cierre').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
            monto_cierre: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            monto_sis: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            fecha_cierre: {
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

    $('#caja').addClass("active");
    $('#c-apc').addClass("active");
    $('#fecha_cierre').datetimepicker({
        format: 'DD-MM-YYYY LT',
        locale: 'es-do'
    });

    if($('#codRol').val() == 1){
        $('.cont01').css('display','block');
        $("#id_tie").removeAttr('disabled');
        $("#id_usu").removeAttr('disabled');
    } else if($('#codRol').val() == 2){
        $('.cont01').css('display','none');
        $("#id_tie").attr('disabled','true');
        $("#id_usu").attr('disabled','true');
    }
});

/* Mostrar datos en la tabla (Cajero, caja, turno, fecha apertura, etc) */
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
        {"data": "desc_per"},
        {"data": "desc_caja"},
        {"data": "desc_turno"},
        {"data":"fecha_a","render": function ( data, type, row ) {
            return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y');
        }},
        {"data":"fecha_a","render": function ( data, type, row ) {
            return '<i class="fa fa-clock-o"></i> '+moment(data).format('h:mm A');
        }},
            {"data":"monto_a","render": function ( data, type, row ) {
            return moneda+' '+formatNumber(data);
        }},
        {"data":null,"render": function ( data, type, row ) {
            if(data.estado == 'a'){
                return '<div class="text-right"><a class="btn btn-sm btn-info btn-xs" onclick="detalle('+data.id_apc+',\''+data.fecha_a+'\')"><i class="fa fa-eye"></i> Ver</a>'
                +'&nbsp;<a class="btn btn-sm btn-danger btn-xs" onclick="cierreCaja('+data.id_apc+',\''+data.desc_per+'\',\''+data.desc_caja+'\',\''+data.desc_turno+'\',\''+moment(data.fecha_a).format('DD-MM-Y hh:mm A')+'\')"><i class="fa fa-unlock"></i> Cerrar</a></div>';
            }
        }}
        ]
    });
    
    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    });
};

$('#id_tie').change( function() {
    comboUsuario();
});

/* Combo Usuario - Tienda*/
var comboUsuario = function(){
    $('#id_usu').find('option').remove();
    //$('#id_usu').append("<option value='1' active>Administrador</option>").selectpicker('refresh');
    $.ajax({
        type: "POST",
        url: "?c=Caja&a=comboUsuario",
        data: {
            id_tie: $("#id_tie").selectpicker('val')
        },
        dataType: "json",
        success: function(data){
            $('#id_usu').append('<optgroup>');
            $.each(data, function (index, value) {
                $('#id_usu').append("<option value='" + value.id_usu + "'>" + value.nombres + "</option>").selectpicker('refresh');            
            });
            $('#id_usu').append('</optgroup>');
            $('#id_usu').prop('disabled', false);
            $('#id_usu').selectpicker('refresh');
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        } 
    });
}

/* Cierre de caja */
var cierreCaja = function(id_apc,desc_per,desc_caja,desc_turno,fecha_a){
    $('#cod_apc').val(id_apc);
    $('#fecha_aper').val(fecha_a);
    $("#monto_cierre").val('');
    $('#frm-cierre').formValidation('revalidateField', 'monto_cierre');
    $('.c-usuario').text(desc_per);
    $('.c-caja').text(desc_caja);
    $('.c-turno').text(desc_turno);       
    $("#mdl-cierre").modal('show');
    $.ajax({
        data: { id_apc : id_apc,
                fecha_ape : $("#fecha_aper").val(),
                fecha_cie : $("#fecha_cierre").val()},
        url:   '?c=Caja&a=montoSistema',
        type:  'POST',
        dataType: 'json',
        success: function(data) {
            if (data.total != '') {
                //var montoSist = (parseFloat(data.Apertura.monto_a) + parseFloat(data.total) + parseFloat(data.Ingresos.total) - parseFloat(data.EgresosA.total) - parseFloat(data.EgresosB.total)).toFixed(2);
                //var montoEstimado = (parseFloat(data.Apertura.monto_a) + parseFloat(data.Ingresos.total) - parseFloat(data.EgresosA.total)).toFixed(2);
                var totalIng = (parseFloat(data.total) + parseFloat(data.Ingresos.total)).toFixed(2);
                var totalEgr = (parseFloat(data.EgresosA.total) + parseFloat(data.EgresosB.total) ).toFixed(2);
                var montoEstimado = (parseFloat(data.Apertura.monto_a) + parseFloat(totalIng) - parseFloat(totalEgr)).toFixed(2);
            //var montoSist = (parseFloat(montoEstimado) - parseFloat(data.pago_tar)).toFixed(2);
                $("#monto_sis").val(formatNumber(montoEstimado));
                $("#monto_sistema").val(montoEstimado);
            }
        }
    });
}

/* Modal cierre de caja */
$('#mdl-cierre').on('hidden.bs.modal', function() {
    $("#monto_sis").val('0.00');
    $("#fecha_cierre").val($("#fechaC").val());
});

/* Detalle de Apertura, ingresos, egresos, etc */
var detalle = function(id_apc,fecha_a){
    var moneda = $("#moneda").val();
    moment.locale('es');
    $("#mdl-detalle").modal('show');
    $.ajax({
        data: { id_apc : id_apc,
                fecha_a : fecha_a},
        url:   '?c=Caja&a=detalle',
        type:  'POST',
        dataType: 'json',
   
        success: function(item) {

            var fechaApertura = moment(item.Apertura.fecha_a).format('Do MMMM YYYY, hh:mm A');
            var fechaCierre = moment(item.Apertura.fecha_c).format('Do MMMM YYYY, hh:mm A');
            $(".c-fecha-apertura").html(fechaApertura);
            $(".c-fecha-cierre").html(fechaCierre);
            $(".c-usuario").html(item.Apertura.desc_per);
            $(".c-caja").html(item.Apertura.desc_caja);
            $(".c-turno").html(item.Apertura.desc_turno);
            $(".c-monto-apertura").html(moneda+' '+formatNumber(item.Apertura.monto_a));

            var totalIng = (parseFloat(item.total) + parseFloat(item.Ingresos.total)).toFixed(2);
            $('.c-total-ingreso').html(moneda+' '+formatNumber(totalIng));
            $('.c-total-ingreso-efe').html(moneda+' '+formatNumber(item.pago_efe));
            $('.c-total-ingreso-tar').html(moneda+' '+formatNumber(item.pago_tar));
            $('.c-total-ingreso-ing').html(moneda+' '+formatNumber(item.Ingresos.total));

            var totalEgr = (parseFloat(item.EgresosA.total) + parseFloat(item.EgresosB.total) ).toFixed(2);
            $('.c-total-egreso').html(moneda+' '+formatNumber(totalEgr));
            $('.c-total-egreso-egr').html(moneda+' '+formatNumber(item.EgresosA.total));
            $('.c-total-egreso-com').html(moneda+' '+formatNumber(item.EgresosB.total));
            $('.c-monto-descuento').html(moneda+' '+formatNumber(item.descu));

            var montoEstimado = (parseFloat(item.Apertura.monto_a) + parseFloat(totalIng) - parseFloat(totalEgr)).toFixed(2);
            $(".c-monto-estimado").html(moneda+' '+formatNumber(montoEstimado));

            var montoFisico = (parseFloat(montoEstimado) - parseFloat(item.pago_tar)).toFixed(2);
            $(".c-monto-fisico").html(moneda+' '+formatNumber(montoFisico));         
        }
    }); 
}

/* Nueva Apertura de caja */
$('#mdl-apertura').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-apertura').formValidation('resetForm', true);
    $("#id_usu").val('').selectpicker('refresh');
    $("#id_caja").val('').selectpicker('refresh');
    $("#id_turno").val('').selectpicker('refresh');
});

/* Accion desde la fecha */
$('#fecha_cierre').on('dp.change', function(e) { 
    $.ajax({
        data: { cod_apc : $("#cod_apc").val(),
                fecha_ape : $("#fecha_aper").val(),
                fecha_cie : $("#fecha_cierre").val()},
        url:   '?c=Caja&a=montoSistema',
        type:  'POST',
        dataType: 'json',
        success: function(data) {
            if (data.total_i != '') {
                var montoSist = (parseFloat(data.Datos.monto_a) + parseFloat(data.total_i) + parseFloat(data.Ingresos.total_i) - parseFloat(data.Gastos.total_g)).toFixed(2);
                $("#monto_sis").val(formatNumber(montoSist));
                $("#monto_sistema").val(montoSist);
            }
        }
    }); 
});

$(".dec input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9.]')!=0 && keycode!=8){
        return false;
    }
});

var mensaje = function(){
    if($("#m").val() == 'n'){
        toastr.success('Caja aperturada, correctamente.');
    }else if ($("#m").val() == 'd'){
        toastr.warning('Advertencia, Datos duplicados.');
    }else if ($("#m").val() == 'e'){
        toastr.warning('Advertencia, No se puede eliminar.');
    }else if ($("#m").val() == 'c'){
        toastr.success('Caja cerrada, correctamente.');
    }
}