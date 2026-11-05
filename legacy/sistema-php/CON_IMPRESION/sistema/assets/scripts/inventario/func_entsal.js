$(function() {
    moment.locale('es');
    $('#inventario').addClass("active");
    $('#i-entsal').addClass("active");
    listar();
    mensaje();
});

var listar = function(){
    var moneda = $("#moneda").val();
	var	table =	$('#table')
	.DataTable({
		"destroy": true,
        "responsive": true,
		"dom": "<'row'<'col-sm-6'><'col-sm-6'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
		"bSort": true,
        "order": [[ 0, "desc" ]],
		"ajax":{
			"method": "POST",
			"url": "?c=Inventario&a=listar"
		},
		"columns":[
			{"data":"fecha","render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y');
            }},
            {
                "data": null,
                "render": function ( data, type, row) {
                    if(data.id_tipo == 3){
                        return 'ENTRADA';
                    } else if(data.id_tipo == 4){
                        return 'SALIDA';
                    }
                }
            },
            {"data":"motivo"},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado =='a'){
                    return '<div class="text-center"><span class="label label-primary">ACTIVO</span></div>';
                } else if (data.estado == 'i'){
                    return '<div class="text-center"><span class="label label-danger">INACTIVO</span></div>';
                }
            }},
            {"data":null,"render": function ( data, type, row ) {
                return '<div class="text-right">'
                +'<button type="button" class="btn btn-info btn-xs" onclick="detalle('+data.id_tipo+','+data.id_es+');"><i class="fa fa-eye"></i> Ver</button>'
                +'&nbsp;<button type="button" class="btn btn-danger btn-xs" onclick="anular('+data.id_es+','+data.id_tipo+');"><i class="fa fa-ban"></i> Anular</button>' 
                +'</div>';
            }}
		]
	});
};

var detalle = function(id_tipo,id_es){
    var moneda = $("#moneda").val();
    $('#table-detalle').empty();
    $('#mdl-detalle').modal('show');
    $.ajax({
      type: "post",
      dataType: "json",
      data: {
          cod_top: id_tipo,
          cod_ope: id_es
      },
      url: '?c=Inventario&a=detalle',
      success: function (data){
        $.each(data, function(i, item) {
            $('#table-detalle')
            .append(
              $('<tr/>')
                .append($('<td/>').html(item.Pres.cod_ins))
                .append($('<td/>').html(item.Pres.nomb_ins))
                .append($('<td/>').html(item.cant))
                .append($('<td/>').html('<span class="label label-warning">'+item.Pres.nomb_med+'</span>'))
                .append($('<td/>').html($('#moneda').val()+' '+item.cos_uni))
                );
            });
        }
    });
};

var anular = function(id_es,id_tipo){
    $('#mdl-anular').modal('show');
    $('#cod_es').val(id_es);
    $('#cod_tipo').val(id_tipo);
};

var mensaje = function(){
    if($("#m").val() == 'c'){
        toastr.success('Datos anulados, correctamente');
    }else if ($("#m").val() == 'e'){
        toastr.warning('Advertencia, Datos anulados anteriormente.');
    }
}