var facturador = {
    detalle: {
        id_ope: 0,
        motivo: 0,
        items:    []
    },

    /* Encargado de agregar un producto a nuestra colección */
    registrar: function(item)
    {
        var existe = false;
        
        //item.total = (item.cantidad * item.precio);
        
        this.detalle.items.forEach(function(x){
            if(x.producto_id === item.producto_id) {
                x.cantidad += item.cantidad;
                existe = true;
            }
        });

        if(!existe) {
            this.detalle.items.push(item);
        }

        this.refrescar();
    },

    /* Encargado de actualizar el precio/cantidad de un producto */
    actualizar: function(id, row)
    {
        /* Capturamos la fila actual para buscar los controles por sus nombres */
        row = $(row).closest('.list-group-item');

        /* Buscamos la columna que queremos actualizar */
        $(this.detalle.items).each(function(indice, fila){
            if(indice == id)
            {
                /* Agregamos un nuevo objeto para reemplazar al anterior */
                facturador.detalle.items[indice] = {
                    producto_id: row.find("input[name='producto_id']").val(),
                    producto_tipo: row.find("input[name='producto_tipo']").val(),
                    producto: row.find("input[name='producto']").val(),
                    cantidad: row.find("input[name='cantidad']").val(),
                    precio:   row.find("input[name='precio']").val(),
                };
                return false;
            }
        })

        this.refrescar();
    },

    /* Encargado de retirar el producto seleccionado */
    retirar: function(id)
    {
        /* Declaramos un ID para cada fila */
        $(this.detalle.items).each(function(indice, fila){
            if(indice == id)
            {
                facturador.detalle.items.splice(id, 1);
                return false;
            }
        })

        this.refrescar();
    },

    /* Refresca todo los productos elegidos */
    refrescar: function()
    {
        /* Declaramos un id y calculamos el total */
        $(this.detalle.items).each(function(indice, fila){
            facturador.detalle.items[indice].id = indice;
        })

        var template   = $.templates("#table-ing-detalle-template");
        var htmlOutput = template.render(this.detalle);

        $("#table-ing-detalle").html(htmlOutput);
    }
};

$(function() {
    moment.locale('es');
    $('#inventario').addClass("active");
    $('#i-entsal').addClass("active");

    $('#frm-inv').formValidation({
        framework: 'bootstrap',
        fields: {
        }
    })

    .on('success.form.fv', function(e) {
        var form = $(this);

        if(facturador.detalle.items.length == 0){
        	toastr.warning('Advertencia, Debe agregar por lo menos un insumo o producto a la lista.');
        }else{
            facturador.detalle.id_ope = $('#id_ope').val();
        	facturador.detalle.motivo = $('#motivo').val();
            $.ajax({
                dataType: 'JSON',
                type: 'POST',
                url: form.attr('action'),
                data: facturador.detalle,
                success: function (r) {
                	if(r) window.location.href = '?c=inventario';
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown + ' ' + textStatus);
                }   
            });            
        }

        return false;
    });
    
    $("#busq_ins").autocomplete({
        autoFocus: true,
        dataType: 'JSON',
        delay: 1,
        source: function (request, response) {
            jQuery.ajax({
                url: '?c=inventario&a=buscarInsumo',
                type: "post",
                dataType: "json",
                data: {
                    cadena: request.term
                },
                success: function (data) {
                    response($.map(data, function (item) {
                        return {
                            id: item.id_ins,
                            value: item.nomb_ins,
                            nombre: item.nomb_ins,
                            id_tipo: item.id_tipo_ins,
                            id_m: item.id_med,
                            desc_m: item.nomb_med,
                            grup_m: item.Medida.grupo
                        }
                    }))
                }
            })
        },
        select: function (e, ui) {
        	$('.nvo-ins').css('display','block');
        	comboUnidadMedida(ui.item.grup_m);
			$('#cod_med option[value="'+ui.item.id_med+'"]').prop('selected', true);
            $("#insCod").val(ui.item.id);
            $("#insTipo").val(ui.item.id_tipo);
            $("#insumo").text(ui.item.nombre);
            $("#medida").text(ui.item.desc_m);
            $("#desc_m").text(ui.item.desc_m);
            $("#ins_cant").focus();
        },
	    change: function() {
	        $("#busq_ins").val('');
	    }
    })
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
        return $('<li>')
        .append(item.nombre)
        .appendTo( ul );
    };
});

/* Combo Unidad de medida */
var comboUnidadMedida = function(cod){
    var var1=0,var2=0;1==cod?(var1=1,var2=1):2==cod?(var1=2,var2=4):3==cod&&(var1=3,var2=4);
    $('#cod_med').selectpicker('destroy');
    $.ajax({
        type: "POST",
        url: "?c=inventario&a=ComboUniMed",
        data: {
        	va1: var1,
        	va2: var2
        },
        success: function (response) {
            $('#cod_med').html(response);
            $('#cod_med').selectpicker();
        },
        error: function () {
            $('#cod_med').html('There was an error!');
        }
    });
}

$(".btn-agregar").click(function(){
    $('#frm-inv').formValidation('revalidateField', 'id_ope');
	$('#frm-inv').formValidation('revalidateField', 'motivo');
    var producto_id = $("#insCod"),
    	producto_tipo = $("#insTipo"),
        producto = $("#insumo").text(),
        medida = $("#medida"),
        cantidad = $("#con_n").text(),
        precio =   $("#ins_prec");

    // Validaciones
    if(producto_id.val() === '0') {
    	toastr.warning('Advertencia, Debe seleccionar un insumo o producto.');
        return;
    }
    
    //if(!isNumber($('#ins_cant').val())) {
    //	toastr.warning('Advertencia, Debe ingresar una cantidad válida.');
      //  return;
    //} else if( parseInt($('#ins_cant').val()) <= 0 ) {
      //  toastr.warning('Advertencia, Debe ingresar una cantidad válida.');
        //return;
    //}

    if(!isNumber($('#ins_prec').val())) {
        toastr.warning('Advertencia, Debe ingresar un precio.');
        return;
    }

    if(producto_tipo.val() == 1){
    	tipo = 'Insumo';
    }else{
    	tipo = 'Producto';
    }
    facturador.registrar({
        producto_id: parseInt(producto_id.val()),
        producto_tipo: parseInt(producto_tipo.val()),
        producto: producto,
        tipo: tipo,
        cantidad: parseFloat(cantidad),
        precio: parseFloat(precio.val()),
    });
    producto_id.val('0');
    precio.val('');
    $("#busq_ins").val('');
    $('.nvo-ins').css('display','none');
    $("#ins_cant").val('');
    $('#con_n').text('0');
});

$('.btn-eliminar').on('click', function(){
    $('.nvo-ins').css('display','none');
    $("#busq_ins").val('');
    $('#ins_prec').val('');
    $('#ins_cant').val('');
    $('#con_n').text('0');
});

$('#ins_cant').on('keyup', function(){
	var opc=$("#cod_med").val();if(1==opc){var cal=($("#ins_cant").val()/1).toFixed(6);$("#con_n").text(cal)}else if(2==opc){var cal=($("#ins_cant").val()/1).toFixed(6);$("#con_n").text(cal)}else if(3==opc){var cal=($("#ins_cant").val()/1e3).toFixed(6);$("#con_n").text(cal)}else if(4==opc){var cal=($("#ins_cant").val()/1e6).toFixed(6);$("#con_n").text(cal)}else if(5==opc){var cal=($("#ins_cant").val()/1).toFixed(6);$("#con_n").text(cal)}else if(6==opc){var cal=($("#ins_cant").val()/1e3).toFixed(6);$("#con_n").text(cal)}else if(7==opc){var cal=($("#ins_cant").val()/2.20462).toFixed(6);$("#con_n").text(cal)}else if(8==opc){var cal=($("#ins_cant").val()/35.274).toFixed(6);$("#con_n").text(cal)}
	$("#busq_ins").val('');
});

$('#cod_med').on('change', function(){
    var opc=$("#cod_med").val();if(1==opc){var cal=($("#ins_cant").val()/1).toFixed(6);$("#con_n").text(cal)}else if(2==opc){var cal=($("#ins_cant").val()/1).toFixed(6);$("#con_n").text(cal)}else if(3==opc){var cal=($("#ins_cant").val()/1e3).toFixed(6);$("#con_n").text(cal)}else if(4==opc){var cal=($("#ins_cant").val()/1e6).toFixed(6);$("#con_n").text(cal)}else if(5==opc){var cal=($("#ins_cant").val()/1).toFixed(6);$("#con_n").text(cal)}else if(6==opc){var cal=($("#ins_cant").val()/1e3).toFixed(6);$("#con_n").text(cal)}else if(7==opc){var cal=($("#ins_cant").val()/2.20462).toFixed(6);$("#con_n").text(cal)}else if(8==opc){var cal=($("#ins_cant").val()/35.274).toFixed(6);$("#con_n").text(cal)}
});

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}