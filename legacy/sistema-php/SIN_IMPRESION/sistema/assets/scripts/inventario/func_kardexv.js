$(function() {
    moment.locale('es');
    ComboInsumoProducto(1);
    listar();
    $('#inventario').addClass("active");
    $('#i-karval').addClass("active");
});

$('#start, #end, #id_ip').change( function() {
	listar();
});

$("#tipo_ip").change(function(){
	$('#id_ip').selectpicker('destroy');
	$("#tipo_ip option:selected").each(function(){
	cod=$(this).val();
	   $.post("?c=Inventario&a=ComboInsumoProducto",{cod: cod},function(data){
    	   $("#id_ip").html(data);
    	   $('#id_ip').selectpicker();
	   });
	});
})

var ComboInsumoProducto = function(cod){
	$('#id_ip').selectpicker('destroy');
    $.ajax({
        type: "POST",
        url: "?c=Inventario&a=ComboInsumoProducto",
        data: {cod: cod},
        success: function (response) {
            $('#id_ip').html(response);
            $('#id_ip').selectpicker();
        },
        error: function () {
            $('#id_ip').html('There was an error!');
        }
    });
}

var listar = function(){
    tipo_ip = $("#tipo_ip").val();
    id_ip = $("#id_ip").val();
    var stock = 0,
        desc = '';

    $.ajax({
        type: "POST",
        url: "?c=Inventario&a=listar",
        data: {
            //ifecha: ifecha,
            //ffecha: ffecha,
            tipo_ip: tipo_ip,
            id_ip: id_ip
        },
        dataType: "json",
        success: function(item){
            if (item.data.length != 0) {
                $.each(item.data, function(i, campo) {
                    $('.umed').text(campo.Dato.nomb_med);
                });
            }
        }
    });

    var org_buildButton = $.fn.DataTable.Buttons.prototype._buildButton;
    $.fn.DataTable.Buttons.prototype._buildButton = function(config, collectionButton) {
    var button = org_buildButton.apply(this, arguments);
    $(document).one('init.dt', function(e, settings, json) {
        if (config.container && $(config.container).length) {
           $(button.inserter[0]).detach().appendTo(config.container)
        }
    })    
    return button;
    }

    var cante = 0,
        cants = 0,
        cantt = 0,
        ent = 0,
        sal = 0,
        tote = 0,
        tots = 0,
        tott = 0,
        scu = 0;
        table =	$('#table')
	    .DataTable({
            buttons: [
                {
                    extend: 'excel', title: 'Kardex_Valorizado', text:'Excel', className: 'btn btn-primary', text: '<i class="glyphicon glyphicon-th-large"></i> Excel', titleAttr: 'Descargar Excel',
                    container: '#btn-excel'
                }
            ],
            "destroy": true,
            "responsive": true,
            "dom": "tp",
    		"bSort": false,
    		"ajax":{
    		"method": "POST",
    		"url": "?c=Inventario&a=listar",
    		"data": {
                //ifecha: ifecha,
                //ffecha: ffecha,
                tipo_ip: tipo_ip,
                id_ip: id_ip
              }
    		},
            "columns":[
                {"data": null,"render": function ( data, type, row ) {
                    return moment(data.fecha_r).format('DD-MM-Y');
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 1){
          				return 'COMPRA, '+data.Comp.desc_td+' '+data.Comp.ser_doc+'-'+data.Comp.nro_doc;
          			}else if(data.id_tipo_ope == 2){
          				return 'VENTA, '+data.Comp.desc_td+' '+data.Comp.ser_doc+'-'+data.Comp.nro_doc;
          			}else if(data.id_tipo_ope == 3){
                        return 'ENTRADA, '+data.Comp.motivo;
                    }else if(data.id_tipo_ope == 4){
                        return 'SALIDA, '+data.Comp.motivo;
                    }
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 1 || data.id_tipo_ope == 3){
          				var cante = (data.cant * 1).toFixed(6);
          				return '<div class="text-navy text-center">'+cante+'</div>';
          			}else{
          				//var cante = 0;
          				return '-';
          			}
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 1 || data.id_tipo_ope == 3){
                        return formatNumber(data.cos_uni);
                    }else{
                        return '-';
                    }
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 1 || data.id_tipo_ope == 3){
                        var tote = (data.cant * data.cos_uni).toFixed(6);
                        return tote;
                    }else{
                        return '-';
                    }
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 2 || data.id_tipo_ope == 4){
          				var cants = (data.cant * 1).toFixed(6);
          				return '<div class="text-danger text-center">'+cants+'</div>';
          			}else{
          				//var cants = 0;
          				return '-';
          			}
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 2 || data.id_tipo_ope == 4){
                        return formatNumber(data.cos_uni);
                    }else{
                        return '-';
                    }
                }},
                {"data": null,"render": function ( data, type, row ) {
                    if(data.id_tipo_ope == 2 || data.id_tipo_ope == 4){
                        var tots = (data.cant * data.cos_uni).toFixed(6);
                        return tots;
                    }else{
                        return '-';
                    }
                }},
                {"data": null,"render": function ( data, type, row ) {
                   
                    if(data.id_tipo_ope == 1 || data.id_tipo_ope == 3){
                        var ent = data.cant;
                    } else {
                        ent = 0;
                    }

                    if(data.id_tipo_ope == 2 || data.id_tipo_ope == 4){
                        var sal = data.cant;
                    } else {
                        sal = 0;
                    }

                    cantt = (ent-sal) + cantt;
              
                    return '<div class="text-success text-center">'+cantt.toFixed(6)+'</div>';
                }},
                {"data": null,"render": function ( data, type, row ) {
                   
                    if(data.id_tipo_ope == 1 || data.id_tipo_ope == 3){
                        scu = formatNumber(data.cos_uni);
                    } else if(data.id_tipo_ope == 2 || data.id_tipo_ope == 4){
                        scu = formatNumber(data.Precio.cos_pro);
                    }               
                    return scu;
                }},
                {"data": null,"render": function ( data, type, row ) {
                    tott = (scu * cantt).toFixed(6);
                    return '<div class="text-primary text-center">'+formatNumber(tott)+'</div>';
                }},
            ],
	});
};