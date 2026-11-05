$(function() {
    $('#informes').addClass("active");
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

$('#codCat').change( function() {
    $('#codPre').find('option').remove();
    $('#codPre').append("<option value='%' active>Mostrar todo</option>").selectpicker('refresh');
    combPro();
    listar();
});

$('#codPro').change( function() {
    combPre();
    listar();
});

$('#codPre').change( function() {
    listar();
});

var combPro = function(){
    $('#codPro').find('option').remove();
    $('#codPro').append("<option value='%' active>Mostrar todo</option>").selectpicker('refresh');
    $.ajax({
        type: "POST",
        url: "?c=Informe&a=combPro",
        data: {
            cod: $("#codCat").selectpicker('val')
        },
        dataType: "json",
        success: function(data){
            $('#codPro').append('<optgroup>');
            $.each(data, function (index, value) {
                $('#codPro').append("<option value='" + value.id_prod + "'>" + value.nombre + "</option>").selectpicker('refresh');            
            });
            $('#codPro').append('</optgroup>');
            $('#codPro').prop('disabled', false);
            $('#codPro').selectpicker('refresh');
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        } 
    });
}

var combPre = function(){
    $('#codPre').find('option').remove();
    $('#codPre').append("<option value='%' active>Mostrar todo</option>").selectpicker('refresh');
    $.ajax({
        type: "POST",
        url: "?c=Informe&a=combPre",
        data: {
            cod: $("#codPro").selectpicker('val')
        },
        dataType: "json",
        success: function(data){
            $('#codPre').append('<optgroup>');
            $.each(data, function (index, value) {
                $('#codPre').append("<option value='" + value.id_pres + "'>" + value.presentacion + "</option>").selectpicker('refresh');            
            });
            $('#codPre').append('</optgroup>');
            $('#codPre').prop('disabled', false);
            $('#codPre').selectpicker('refresh');
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        } 
    });
}

var listar = function(){

    var moneda = $("#moneda").val();
	ifecha = $("#start").val();
    ffecha = $("#end").val();
    codCat = $("#codCat").selectpicker('val');
    codPro = $("#codPro").selectpicker('val');
    codPre = $("#codPre").selectpicker('val');
    
    var cant = 0,
        tot = 0;

    $.ajax({
        type: "POST",
        url: "?c=Informe&a=Datos",
        data: {
            ifecha: ifecha,
            ffecha: ffecha,
            codCat: codCat,
            codPro: codPro,
            codPre: codPre
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {  
                cant += parseFloat(campo.cantidad);
                tot += parseFloat(campo.total);
            });
            $('#cant_v').text(cant);
            $('#total_v').text(moneda+' '+formatNumber(tot));
        }
    });

	var	table =	$('#table')
	.DataTable({
		"destroy": true,
		"dom": "tp",
		"bSort": false,
		"ajax":{
			"method": "POST",
			"url": "?c=Informe&a=Datos",
			"data": {
                ifecha: ifecha,
                ffecha: ffecha,
                codCat: codCat,
                codPro: codPro,
                codPre: codPre
            }
		},
		"columns":[
            {"data":"fecha_venta","render": function ( data, type, row ) {
                return '<i class="fa fa-calendar"></i> '+moment(data).format('DD-MM-Y');
            }},
			{"data":"Producto.desc_c"},
            {"data":"Producto.nombre_prod"},
            {"data":"Producto.pres_prod"},
            {
                "data": "cantidad",
                "render": function ( data, type, row) {
                    return '<p class="text-right">'+data+'</p>';
                }
            },
			{
                "data": "precio",
                "render": function ( data, type, row) {
                    return '<p class="text-right"> '+moneda+' '+formatNumber(data)+'</p>';
                }
            },
			{
                "data": "total",
                "render": function ( data, type, row) {
                    return '<p class="text-right"> '+moneda+' '+formatNumber(data)+'</p>';
                }
            }
		]
	});
}