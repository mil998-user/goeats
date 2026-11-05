$(function() {
    moment.locale('es');
	listar();
    $('#frm-credito').formValidation({
        framework: 'bootstrap',
        excluded: ':disabled',
        fields: {
            pago_cuo: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            monto_ec: {
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

$('#cod_prov').change( function() {
	listar();
});

/* Mostrar datos en la tabla compras al credito */
var listar = function(){

    var moneda = $("#moneda").val();
    cprov = $("#cod_prov").selectpicker('val');
    var t_deuda = 0,
        t_inte = 0,
        t_amor = 0;

    $.ajax({
        type: "POST",
        url: "?c=Credito&a=listar",
        data: {
            cprov: cprov
        },
        dataType: "json",
        success: function(item){

            if (item.data.length != 0) {
                $.each(item.data, function(i, campo) {
                    t_deuda += parseFloat(campo.total);
                    t_inte += parseFloat(campo.interes);
                    t_amor += parseFloat(campo.Amortizado.total);
                });
            }

            var t_total = t_deuda - t_amor;

            $('#t_deuda').text(moneda+' '+formatNumber(t_deuda));
            $('#t_inte').text(moneda+' '+formatNumber(t_inte));
            $('#t_amor').text(moneda+' '+formatNumber(t_amor));
            $('#t_total').text(moneda+' '+formatNumber(t_total));
        }
    });

	var	table =	$('#table')
	.DataTable({
		"destroy": true,
        "responsive": true,
		"dom": "<'row'<'col-sm-6'><'col-sm-6'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
		"bSort": true,
		"ajax":{
			"method": "POST",
			"url": "?c=Credito&a=listar",
			"data": {
                cprov: cprov
            }
		},
		"columns":[
			{"data": null,"render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data.fecha).format('DD-MM-Y');
            }},
            {"data":"desc_prov"},
            {"data":"desc_td"},
            {
                "data": null,
                "render": function ( data, type, row) {
                    return data.numero;
                }
            },
            {"data":"total","render": function ( data, type, row) {
                return '<span class="label label-danger"> '+moneda+' '+formatNumber(data)+'</span>';
            }},
            {"data":"interes","render": function ( data, type, row) {
                return moneda+' '+formatNumber(data);
            }},
            {"data":"Amortizado.total","render": function ( data, type, row) {
                return moneda+' '+formatNumber(data);
            }},
            {"data":null,"render": function ( data, type, row) {
                var cal = (data.total - data.Amortizado.total).toFixed(2);
                return '<span class="label label-warning"> '+moneda+' ' +formatNumber(cal)+'</span>';
            }},
            {"data":null,"render": function ( data, type, row ) {
                var call = (data.total - data.Amortizado.total).toFixed(2);
                return '<p class="text-center">'
                +'<a class="btn btn-sm btn-info" onclick="detalle('+data.id_credito+',\''+data.desc_td+'\',\''+data.numero+'\')"><i class="fa fa-eye"></i></a> '
                +'<a class="btn btn-sm btn-primary" onclick="pagoCuota('+data.id_credito+',\''+data.desc_td+'\',\''+data.numero+'\',\''+call+'\',\''+data.total+'\',\''+data.Amortizado.total+'\')">Pago</a></p>';
            }}
		]
	});

};

/* Pago o amortizacion de cuota */
var pagoCuota = function(id_credito,desc_td,numero,call,total,amort){
    var moneda = $("#moneda").val();
    $('#mdl-credito').modal('show');
    $('.title-detalle').text(desc_td+' - '+numero);
    $('.c-monto-pend').text(moneda+' '+formatNumber(call));
    $('#cod_cuota').val(id_credito);
    $('#total_cuota').val(total);
    $('#amort_cuota').val(amort);
    $.ajax({
        type: "POST",
        url: "?c=Credito&a=listarCuota",
        data: {
            cod: id_credito
        },
        dataType: "json",
        success: function(item){
            $('.c-fecha-comp').text(moment(item['data'].fecha).format('DD-MM-Y'));  
            $('.c-datos-prov').text(item['data'].desc_prov);   
        }
    });
};

/* Detalle de la cuota(s) al credito */
var detalle = function(id_credito,desc_td,numero){
    var moneda = $("#moneda").val();
    $('.title-detalle').text(desc_td+' - '+numero);
    $('#table-cuota').empty();
    $('#mdl-detalle').modal('show');
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "?c=Credito&a=detalle",
        data: {
            cod: id_credito
        },
        success: function(data){
            $.each(data, function(i, item) {
                $('#table-cuota')
                .append(
                  $('<tr/>')
                    .append($('<td/>').html(item.Usuario.nombre))
                    .append($('<td/>').html(moment(item.fecha).format('DD-MM-Y h:mm A')))
                    .append($('<td class="text-right"/>').html(moneda+' '+formatNumber(item.importe)))
                    );
            });
        }
    });
}

/* Opcion egreso de caja */
$('.egre_caja').on('ifChanged', function(event){
    var moneda = $("#moneda").val();
    if( $(this).is(':checked') ) {
        $('#egre_caja').val('1');
        $('#cont-egre').empty();
        $('#cont-egre')
            .append(
                $('<div class="col-sm-12" />')
                    .append(
                        $('<div class="form-group" />')
                            .append(
                                $('<div class="input-group" />')
                                .html('<span class="input-group-addon">'+moneda+'</span>'
                                    +'<input type="text" name="monto_ec" id="monto_ec" class="form-control" placeholder="Ingrese el monto" required="required" autocomplete="off" />'
                                    +'<span class="input-group-addon"><span class="fa fa-money"></span></span>')
                            )
                    )
                );
        
    } else {
        $('#egre_caja').val('2');
        $('#cont-egre').empty();
    }
    $('#frm-credito').formValidation('revalidateField', 'monto_ec');
});

$('#mdl-credito').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-credito').formValidation('resetForm', true);
    $('.egre_caja').iCheck('uncheck');
    $('.icheckbox_flat-red').removeClass('checked');
    $('#cont-egre').empty();
});
