$(function() {
    $('#compras').addClass("active");
    $('#c-compras').addClass("active");
    moment.locale('es');
	listar();
    mensaje();

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

/* Filtros */
$('#tipo_doc, #cod_prov').change( function() {
	listar();
});

/* Mostrar datos en la tabla */
var listar = function(){

    var moneda = $("#moneda").val();
	ifecha = $("#start").val();
    ffecha = $("#end").val();
    tdoc = $("#tipo_doc").selectpicker('val');
    cprov = $("#cod_prov").selectpicker('val');

    var vsbt = 0,
        vigv = 0,
        vtotal = 0,
        igvGlobal = 0;

    $.ajax({
        type: "POST",
        url: "?c=Compra&a=listar",
        data: {
            ifecha: ifecha,
            ffecha: ffecha,
            tdoc: tdoc,
            cprov: cprov
        },
        dataType: "json",
        success: function(item){

            if (item.data.length != 0) {
                $.each(item.data, function(i, campo) {
                    vtotal += parseFloat(campo.total);
                    vsbt += parseFloat(campo.total /  (1+parseFloat(campo.igv)));
                    vigv += parseFloat((campo.total / (1+parseFloat(campo.igv))) * campo.igv);
                });
            }

            $('#total_c').text(moneda+' '+formatNumber(vtotal));
            $('#subt_c').text(moneda+' '+formatNumber(vsbt));
            $('#igv_c').text(moneda+' '+formatNumber(vigv));
        }
    });

	var	table =	$('#table')
	.DataTable({
		"destroy": true,
        "responsive": true,
		"dom": "<'row'<'col-sm-6'><'col-sm-6'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
		"bSort": false,
		"ajax":{
			"method": "POST",
			"url": "?c=Compra&a=listar",
			"data": {
                ifecha: ifecha,
                ffecha: ffecha,
                tdoc: tdoc,
                cprov: cprov
            }
		},
		"columns":[
            {"data": null,"render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data.fecha_reg).format('DD-MM-Y');
            }},
			{"data": null,"render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data.fecha_c).format('DD-MM-Y');
            }},
            {"data":"desc_td"},
            {
                "data": null,
                "render": function ( data, type, row) {
                    return data.serie_doc+' - '+data.num_doc;
                }
            },
            {"data":"desc_prov"},
            {"data":"total","render": function ( data, type, row) {
                return '<div class="text-right bold"> '+moneda+' '+formatNumber(data)+'</div>';
            }},
            {
                "data": null,
                "render": function ( data, type, row) {
                    if(data.id_tipo_compra == 1){
                        return '<div class="text-left"><span class="label label-success">'+data.desc_tc+'</span></div>';
                    } else if(data.id_tipo_compra == 2){
                        return '<div class="text-left"><span class="label label-warning">'+data.desc_tc+'</span></div>';
                    }
                }
            },
            {"data":null,"render": function ( data, type, row ) {
                if(data.estado == 'a'){
                    return '<div class="text-center"><span class="label label-primary">APROBADA</span></div>';
                }else if(data.estado == 'i'){
                    return '<div class="text-center"><span class="label label-danger">ANULADA</span></div>';
                }
            }},
            {"data":null,"render": function ( data, type, row ) {
                return '<div class="text-right">'
                +'<button type="button" class="btn btn-info btn-xs" onclick="detalle('+data.id_compra+');"><i class="fa fa-eye"></i> Ver</button>'
                +'&nbsp;<button type="button" class="btn btn-danger btn-xs" onclick="anular('+data.id_compra+');"><i class="fa fa-ban"></i> Anular</button>' 
                +'</div>';
            }}
		]
	});
};

/* Detalle de la compra */
var detalle = function(id_compra){
    var moneda = $("#moneda").val();
    $('#table-detalle').empty();
    $('#mdl-detalle').modal('show');
    $.ajax({
      type: "post",
      dataType: "json",
      data: {
          cod: id_compra
      },
      url: '?c=Compra&a=detalle',
      success: function (data){
        $.each(data, function(i, item) {
            var importe = item.precio * item.cant;
            $('#table-detalle')
            .append(
              $('<tr/>')
                .append($('<td/>').html(item.Pres.cod_ins))
                .append($('<td/>').html(item.Pres.nomb_ins))
                .append($('<td/>').html(item.cant+' <span class="label label-warning">'+item.Pres.nomb_med+'</span>'))
                .append($('<td/>').html(moneda+' '+formatNumber(item.precio)))
                .append($('<td class="text-right"/>').html(moneda+' '+formatNumber(importe)))
                );
            });
        }
    });
};

/* Anular Compra */
var anular = function(id_compra){
    $('#mdl-anular').modal('show');
    $('#cod_compra').val(id_compra);
};

var mensaje = function(){
    if($("#m").val() == 'c'){
        toastr.success('Datos anulados, correctamente');
    }else if ($("#m").val() == 'e'){
        toastr.warning('Advertencia, La compra ya ha sido anulada.');
    }
}