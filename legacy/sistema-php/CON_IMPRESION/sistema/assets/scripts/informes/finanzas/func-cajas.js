$(function() {
    $('#informes').addClass("active");
    moment.locale('es');
	listar();

    $('#start').datetimepicker({
        format: 'DD-MM-YYYY',
        locale: 'es-do'
    });

    $('#end').datetimepicker({
        useCurrent: false,
        format: 'DD-MM-YYYY',
        locale: 'es-do'
    });
    
    $("#start").on("dp.change", function (e) {
        $('#end').data("DateTimePicker").minDate(e.date);
        listar();
    });

    $("#end").on("dp.change", function (e) {
        $('#start').data("DateTimePicker").maxDate(e.date);
        listar();
    });
});

var listar = function(){

    var moneda = $("#moneda").val();
	ifecha = $("#start").val();
    ffecha = $("#end").val();

	var	table =	$('#table')
	.DataTable({
		"destroy": true,
        "responsive": true,
		"dom": "tp",
		"bSort": false,
		"ajax":{
			"method": "POST",
			"url": "?c=Informe&a=listar",
			"data": {
                ifecha: ifecha,
                ffecha: ffecha
            }
		},
		"columns":[
            {"data": "desc_caja"},
            {"data": "desc_per"},
			{"data":"fecha_a","render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y')+'<br><i class="fa fa-clock-o"></i> '
                +moment(data).format('h:mm A');
            }},
            {"data":"fecha_c","render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y')+'<br><i class="fa fa-clock-o"></i> '
                +moment(data).format('h:mm A');
            }},
            {
                "data": "monto_s",
                "render": function ( data, type, row) {
                    return '<p class="bold-d"> '+moneda+' '+formatNumber(data)+'</p>';
                }
            },
            {
                "data": "monto_c",
                "render": function ( data, type, row) {
                    return '<p class="bold-d"> '+moneda+' '+formatNumber(data)+'</p>';
                }
            },
            {
                "data": null,
                "render": function ( data, type, row) {
                    var dif = data.monto_c - data.monto_s
                    return '<p class="bold-d"> '+moneda+' '+formatNumber(dif)+'</p>';
                }
            },
            {"data":null,"render": function ( data, type, row ) {
                return '<p class="text-center"><a class="btn btn-sm btn-info" onclick="detalle('+data.id_apc+',\''+data.fecha_a+'\')"><i class="fa fa-eye"></i> Ver</a></p>';
            }}
		]
	});
};

var detalle = function(id_apc,fecha_a){
    var moneda = $("#moneda").val();
    moment.locale('es');
    $("#detalle").modal('show');
    $.ajax({
        data: { id_apc : id_apc,
                fecha_a : fecha_a},
        url:   '?c=Informe&a=detalle',
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

            $(".c-monto-cierre").html(moneda+' '+formatNumber(item.Apertura.monto_c));

            var montoDiferencia = (parseFloat(montoEstimado) - parseFloat(item.Apertura.monto_c)).toFixed(2);
            $(".c-monto-diferencia").html(moneda+' '+formatNumber(montoDiferencia));            
        }
    }); 
}
