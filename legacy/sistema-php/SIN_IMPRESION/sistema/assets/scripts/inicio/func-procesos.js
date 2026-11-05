var searchRequest = null;
$(function() {
    DatosGrles();
    listarPedidos();
    listarProdsMasVend();
    listarCategorias();
   
    $('.scroll_cmesa').slimscroll({
        height: 210
    });
    $('.scroll_izq').slimscroll({
        height: 400
    });
    $('.scroll_der').slimscroll({
        height: 485
    });
    
    var minlength = 1;

    $("#busq_prod").keyup(function () {
        
        $(".catP").removeClass("active");
        $(".catS").removeClass("active");
        var moneda = $("#moneda").val();
        $('#list-prods').empty();

        var that = this,
        value = $(this).val();

        if (value.length >= minlength ) {
            if (searchRequest != null) 
                searchRequest.abort();
                searchRequest = $.ajax({
                type: "POST",
                url: "?c=Inicio&a=BuscarProds",
                data: {
                    'cod' : value
                },
                dataType: "JSON",
                success: function(data){
                    //we need to check if the value is the same
                    if (value==$(that).val()) {
                    //Receiving the result of search here
                        $.each(data, function(i, item) {
                            $('#list-prods')
                                .append(
                                $('<article class="product animated fadeIn" onclick="add('+item.id_areap+','+item.id_pres+',\''+item.nombre_prod+'\',\''+item.pres_prod+'\','+item.precio+',\''+item.Impresora.nombre+'\');"/>')
                                .append(
                                    $('<div class="product-img"/>')
                                    .html('<img src="assets/img/productos/'+item.imagen+'"></img><span class="price-tag">'+moneda+' '+item.precio+'</span><span class="pres-tag">'+item.pres_prod+'</span>')
                                )
                                .append(
                                    $('<div class="product-nam"/>')
                                    .html(item.nombre_prod)
                                )
                            );
                        });
                    }
                }
            });
        } else {
            $(".catP").addClass("active");
            listarProdsMasVend();
            return false;
        }
    });
});

var DatosGrles = function(){
    var moneda = $("#moneda").val();
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=DatosGrles',
        data: {
            cod: $('#cod_p').val(),
            tp: $('#cod_tipe').val()
        },
        success: function (data) {
            var sbtot = 0;
            var total = 0;
            $.each(data.Detalle, function(i, item) {
                var importe = (item.cantidad * item.precio).toFixed(2);
                if(item.estado != 'i' && item.cantidad > 0){
                    sbtot = parseFloat(importe) + parseFloat(sbtot);   
                }
            });
            total = parseFloat(sbtot) + parseFloat(total);
            $('#totalPagar').text(moneda+''+formatNumber(total));
            $('#totalPed').val(total.toFixed(2));
            console.log('rol: ' + $("#rol_usr").val());
            var rol = $("#rol_usr").val();
            if(total != '0.00'){
                $('.opc1').css('display','block');
                $('.opc2').css('display','none');
            }else{
                $('.opc1').css('display','none');
                $('.opc2').css('display','block');
            }
            if (rol == 1){
            	$('.opc2').css('display','block');
            }
            var additionalBottom = '';
            var additionalBottomComanda = '';
            if(data.id_tipo_p == 1){
                $('.mes_dg').text(data.nro_mesa);
                $('#salon_dg').val(data.desc_m);
                $("#ico-ped").addClass("fa fa-cutlery");
                additionalBottom = '<a onclick="impPreCuenta('+data.id_pedido+','+data.id_mesa+',\''+data.est_m+'\')" title="Imprimir Pre Cuenta" class="btn btn-botija btn-lg"><i class="fa fa-print"></i></a>';
                additionalBottomComanda = '<a onclick="impPreComanda('+data.id_pedido+','+data.id_mesa+',\''+data.est_m+'\')" title="Imprimir Comanda" class="btn btn-botija btn-lg"><i class="fa fa-print"></i></a>';
            }else if(data.id_tipo_p == 2){
                $('.mes_dg').text(data.nro_pedido);
                $("#ico-ped").addClass("fa fa-slack");
            }else if(data.id_tipo_p == 3){
                $('.mes_dg').text(data.nro_pedido);
                $("#ico-ped").addClass("fa fa-slack");
                additionalBottom = '<a href="pedido_mesa.php?c=Inicio&a=ImprimirPCDelivery&Cod='+data.id_pedido + '" target="_blank" title="Imprimir Ticket Delivery" class="btn btn-botija btn-lg"><i class="fa fa-print"></i></a>';
            }
            
            $('.btn-imp').html('<a class="btn btn-botija btn-lg" href="inicio.php" title="Punto de Venta"><i class="fa fa-desktop"></i></a>' + additionalBottom + additionalBottomComanda);
            
            $('#cod_tipe').val(data.id_tipo_p);
            $('.cli_dg').text(data.nomb_c);
            $('.fec_dg').text(moment(data.fecha_p).format('DD-MM-Y'));
            $('.hor_dg').text(moment(data.fecha_p).format('h:mm A'));
        }
    });
};    

var listarPedidos = function(){
    $('#list-detped').empty();
    var moneda = $("#moneda").val();
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=listarPedidos',
        data: {cod: $('#cod_p').val()},
        success: function (data) {
            $.each(data, function(i, item) {
              
                var total = (item.cantidad * item.precio).toFixed(2);
                $('#list-detped')
                .append(
                    $('<blockquote class="animated fadeInLeft" style="cursor: pointer;" onclick="subPedido('+$('#cod_p').val()+','+item.id_pres+');"/>')
                    .append('<a class="text-navy"><span class="product-name text-navy">'+item.Producto.nombre_prod+' <span class="label label-warning text-uppercase">'+item.Producto.pres_prod+'</span></span></a>'
                    +'<span class="price">'+moneda+formatNumber(total)+'</span>'
                    +'<small><em>'+item.cantidad+'</em> Unidad(es) en '+moneda+''+formatNumber(item.precio)+' / Unidad(es)</small>') 
                    )
                      
            });
        }
    });
};

var listarCategorias = function(){
    $('#list-catgrs').empty();
    $('#list-catgrs').html('<li class="catP active"><a data-toggle="tab" href="#tab-1" onclick="listarProdsMasVend();">&nbsp;<i class="fa fa-star"></i>&nbsp;</a></li>');
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=listarCategorias',
        success: function (data) {
            $.each(data, function(i, item) {
                $('#list-catgrs')
                    .append(
                    $('<li class="catS animated fadeInRight"/>')
                    .append(
                        $('<a data-toggle="tab" href="#tab-1" onclick="listarProductos('+item.id_catg+');"/>')
                        .html(item.descripcion)
                    )
                );
            });
        }
    });
}

var listarProdsMasVend = function(){
    $('#busq_prod').val('');
    var moneda = $("#moneda").val();
    $('#list-prods').empty();
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=listarProdsMasVend',
        success: function (data) {
            $.each(data, function(i, item) {
                $('#list-prods')
                    .append(
                    $('<article class="product animated fadeIn" onclick="add('+item.id_areap+','+item.id_pres+',\''+item.nombre_prod+'\',\''+item.pres_prod+'\','+item.precio+',\''+item.Impresora.nombre+'\');"/>')
                    .append(
                        $('<div class="product-img"/>')
                        .html('<img src="assets/img/productos/'+item.imagen+'"></img><span class="price-tag">'+moneda+' '+item.precio+'</span><span class="pres-tag">'+item.pres_prod+'</span>')
                    )
                    .append(
                        $('<div class="product-nam"/>')
                        .html(item.nombre_prod)
                    )
                );
            });
        }
    });
}

var listarProductos = function(cod){
    $('#busq_prod').val('');
    var moneda = $("#moneda").val();
    $('#list-prods').empty();
    $.ajax({
        url: '?c=Inicio&a=listarProductos',
        dataType: 'JSON',
        type: 'POST',
        data: {cod: cod},
        success: function (data) {
            $.each(data, function(i, item) {
                $('#list-prods')
                    .append(
                    $('<article class="product animated fadeIn" onclick="add('+item.id_areap+','+item.id_pres+',\''+item.nombre_prod+'\',\''+item.pres_prod+'\','+item.precio+',\''+item.Impresora.nombre+'\');"/>')
                    .append(
                        $('<div class="product-img"/>')
                        .html('<img src="assets/img/productos/'+item.imagen+'"></img><span class="price-tag">'+moneda+' '+item.precio+'</span><span class="pres-tag">'+item.pres_prod+'</span>')
                    )
                    .append(
                        $('<div class="product-nam"/>')
                        .html(item.nombre_prod)
                    )
                );
            });
        }
    });
};

var add = function(id_areap,id_pres,nombre_prod,pres_prod,precio,nombre_imp){
    $("#nvo-ped").css('display','block');
    $(".bc").css('display','block');
    pedido.registrar({
        area_id: parseInt(id_areap),
        nombre_imp: nombre_imp,
        producto_id: parseInt(id_pres),
        producto: nombre_prod,
        presentacion: pres_prod,
        cantidad: parseInt(1),
        precio: parseFloat(precio),
        comentario: "",
    });
    if($('#rol_usr').val() == 4){
        toastr.success('Agregado correctamente a la lista.');
    }
    $("#btn-confirmar").removeAttr('disabled');
};

$("#btn-confirmar").on("click", function(){
    $("#btn-confirmar").attr('disabled','true');
    if(pedido.detalle.items.length == 0)
    {
        toastr.warning('Advertencia, Agregar producto(s) a la lista.');
        return false;
    }else{

        pedido.detalle.cod_ped = $('#cod_p').val();
         
        $.ajax({
            type: 'POST', 
            url: '?c=Inicio&a=RegistrarPedido',
            data: pedido.detalle,
            success: function (data) {
                if(data == 1){
                    DatosGrles();
                    listarPedidos();
                    pedido.detalle.items.length = 0;
                    $('#nvo-ped-det').empty();
                    $("#nvo-ped").css('display','none');
                    $(".bc").css('display','none');
                    return false;
                } else if (data == 2){
                    window.open('inicio.php?Cod=f','_self');
                }
            },
            error: function(jqXHR, textStatus, errorThrown){
                console.log(errorThrown + ' ' + textStatus);
            }   
        });
        
        var array = pedido.detalle.items;
        var contador = new Array();
        var nuevoarray = new Array();
        var i,y,z;

        for(i=0; i < array.length; i++){
            contador.push(array[i].area_id);
        }

        cont = [...new Set(contador)];

        for(y=0; y < cont.length; y++){
            for(z=0; z < array.length; z++){
                if(array[z].area_id == cont[y]){
                    nuevoarray.push(array[z]);
                    nombre_impresora = array[z].nombre_imp;
                }
            }
            var nuevopedido = {
                cod_tped : $('#cod_tipe').val(),
                nro_pedido : $('.mes_dg').text(),
                desc_salon : $('#salon_dg').val(),
                nombre_imp : nombre_impresora,
                items : nuevoarray
            }

            window.open('view/inicio/imprimir/ticket.php?matriz='+JSON.stringify(nuevopedido)+'','_blank');
            var nuevoarray = new Array();

        }

    }
});

var pedido = {
    detalle: {
        cod_ped:    0,
        items: []
    },

    /* Encargado de agregar un producto a nuestra colección */
    registrar: function(item)
    {
        var existe = false;
        
        item.total = (item.cantidad * item.precio);
        
        this.detalle.items.forEach(function(x){
            if(x.producto_id === item.producto_id) {
                x.cantidad += item.cantidad;
                x.total += item.total;
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
        row = $(row).closest('.warning-element');

        /* Buscamos la columna que queremos actualizar */
        $(this.detalle.items).each(function(indice, fila){
            if(indice == id)
            {
                /* Agregamos un nuevo objeto para reemplazar al anterior */
                pedido.detalle.items[indice] = {
                    producto_id: row.find("input[name='producto_id']").val(),
                    area_id: row.find("input[name='area_id']").val(),
                    nombre_imp: row.find("input[name='nombre_imp']").val(),
                    producto: row.find("span[name='producto']").text(),
                    presentacion: row.find("span[name='presentacion']").text(),
                    comentario: row.find("input[name='comentario']").val(),
                    cantidad: row.find("input[name='cantidad']").val(),
                    precio: row.find("input[name='precio']").val(),
                };

                pedido.detalle.items[indice].total = pedido.detalle.items[indice].precio * pedido.detalle.items[indice].cantidad;

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
                pedido.detalle.items.splice(id, 1);
                return false;
            }
        })

        this.refrescar();
    },

    /* Refresca todo los productos elegidos */
    refrescar: function()
    {
        this.detalle.total = 0;

        /* Declaramos un id y calculamos el total */
        $(this.detalle.items).each(function(indice, fila){
            pedido.detalle.items[indice].id = indice;
            pedido.detalle.total += fila.total;
        })

        /* Calculamos el subtotal e IGV */
        this.detalle.igv      = (this.detalle.total * 0.18).toFixed(2); // 18 % El IGV y damos formato a 2 deciamles
        this.detalle.subtotal = (this.detalle.total - this.detalle.igv).toFixed(2); // Total - IGV y formato a 2 decimales
        this.detalle.total    = this.detalle.total.toFixed(2);

        var template   = $.templates("#nvo-ped-det-template");
        var htmlOutput = template.render(this.detalle);

        $("#nvo-ped-det").html(htmlOutput);

        if(this.detalle.total == 0){
            $("#nvo-ped").css('display','none');
            $(".bc").css('display','none');
        }

        $(".touchspin1").TouchSpin({
            buttondown_class: 'btn btn-warning',
            buttonup_class: 'btn btn-warning',
            min: 1,
            max: 99,
            step: 1,
            booster: false,
            stepintervaldelay: 600000
        });
    },

    comentar: function(id)
    {
        $("#com"+id).each(function(i) {
            if ( this.style.display !== "block" ) {
                this.style.display = "block";

            } else {
                this.style.display = "none";
            }
            return false;
        });
        
    },
};

$(function() {
/* Buscar cliente */
date = moment(new Date());
var diactual = moment(date).format('D MMMM');
$("#busq_cli").autocomplete({
    delay: 1,
    autoFocus: true,
    source: function (request, response) {
        $.ajax({
            url: '?c=Inicio&a=BuscarCliente',
            type: "post",
            dataType: "json",
            data: {
                criterio: request.term
            },
            success: function (data) {
                response($.map(data, function (item) {
                    return {
                        id: item.id_cliente,
                        dni: item.dni,
                        nombres: item.nombre,
                        fecha_n: item.fecha_nac
                    }
                }))
            }
        })
    },
    select: function (e, ui) {

        /* Validar si cumple años el cliente */
        var cumple = moment(ui.item.fecha_n).format('D MMMM');
        $("#cliente_id").val(ui.item.id);
        $("#nombre_c").val(ui.item.nombres);
        if(diactual == cumple){
            $("#hhb").addClass("mhb");
        }
        $(this).blur(); 

    },
    change: function() {
        $("#busq_cli").val('');
        $("#busq_cli").focus();
    }
})
.autocomplete( "instance" )._renderItem = function( ul, item ) {
  return $( "<li>" )
    .append(item.nombres)
    .appendTo( ul );
};

$("#busq_cli").autocomplete("option", "appendTo", ".frm-facturar");

});

/* Desocupar mesa */
var desocuparMesa = function(cod_ped){    
    $('#cod_pede').val(cod_ped);
    $("#mdl-desocupar-mesa").modal('show');      
}

/* Imprimir Pre Cuenta*/
var impPreCuenta = function(ped,cod,est){
    $.ajax({
        url: '?c=Inicio&a=preCuenta',
        type: "post",
        dataType: "json",
        data: {
            cod: cod,
            est: est
        },
        success: function (r) {
            return true;
        }
    }).done(function(){
        var ini = window.open('pedido_mesa.php?c=Inicio&a=ImprimirPC&Cod='+ped,'_blank');
    }); 
}
 
/* Imprimir Pre Cuenta*/
var impPreComanda = function(ped,cod,est){
    $.ajax({
        url: '?c=Inicio&a=preCuenta',
        type: "post",
        dataType: "json",
        data: {
            cod: cod,
            est: est
        },
        success: function (r) {
            return true;
        }
    }).done(function(){ 
        var ini = window.open('pedido_mesa.php?c=Inicio&a=ImprimirPComanda&Cod='+ped,'_blank');
    }); 
}

var facturar = function(cod,tip){
    $("#btn-fact").removeAttr('disabled');
    $('#list-items').empty();
    $('#cod_pedido').val(cod);
    $('#tipoEmision').val(tip);
    var tp = $('#cod_tipe').val();
    var moneda = $("#moneda").val();

   
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=listarTirajes',
        success: function (data) {

            $.each(data, function(i, item) {
                $('#disponibles').val(item.disponibles);

                
            }); 

            
        }
    });

    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=ListarDetallePed',
        data: {cod: cod, tp: tp},
        success: function (data) {
        	var sum_bolsa = 0;
            $.each(data.Detalle, function(i, item) {
            	if (item.Producto.nombre_prod=='BOLSA'){
            		sum_bolsa = sum_bolsa + parseInt(item.cantidad);
            	}
                var totped = $("#totalPed").val();
                var calc = (item.cantidad * item.precio).toFixed(2);
                if (1 == tip && item.cantidad > 0){
                    $(".totalP").val(totped);
                    $(".totalP").text(formatNumber(totped));
                    $("#total_pedido").val(totped);
                    $('#list-items')
                    .append(
                    $('<li class="success-element liwrithe"/>')
                    .append(
                        $('<div class="row"/>')
                        .append(
                            $('<div class="col-xs-1 col-sm-1 col-md-1"/>')
                            .html('<input type="hidden" name="cantProd[]" value="'+item.cantidad+'"/>'
                                +'<input type="hidden" name="precProd[]" value="'+item.precio+'"/>'
                                +item.cantidad)
                            )
                        .append(
                            $('<div class="col-xs-8 col-sm-8 col-md-8"/>')
                            .html('<input type="hidden" name="idProd[]" value="'+item.id_pres+'"/>'
                                +item.Producto.nombre_prod+' <span class="label label-warning text-uppercase">'+item.Producto.pres_prod+'</span>')
                            )
                        .append(
                            $('<div class="col-xs-3 col-sm-3 col-md-3 text-right"/>')
                            .html(moneda+' '+formatNumber(calc))
                            )
                        )
                    );
                } else if (2 == tip && item.cantidad > 0){
                    $(".totalP").val('0.00');
                    $(".totalP").text('0.00');
                    $("#total_pedido").val(0.00);
                    $(".t_sbt").val('0.00');
                    $(".t_sbt").text('0.00');
                    $('#list-items')
                    .append(
                    $('<li class="success-element priceU" data-price="'+item.precio+'"/>')
                    .append(
                        $('<div class="row"/>')
                        .append(
                            $('<div class="col-xs-2 col-sm-2 col-md-2"/>')
                            .html('<input type="hidden" class="cantidad" name="cantProd[]" value="0"/>'
                                +'<input type="hidden" name="precProd[]" value="'+item.precio+'"/>'
                                +'<input type="hidden" value="'+item.cantidad+'" class="cantOrg"/>'
                                +'<input type="hidden" value="1" class="cantTemp"/>'
                                +'<b></b> '+item.cantidad)
                            )
                        .append(
                            $('<div class="col-xs-7 col-sm-7 col-md-7"/>')
                            .html('<input type="hidden" name="idProd[]" value="'+item.id_pres+'"/>'
                                +item.Producto.nombre_prod+' <p class="label label-warning text-uppercase">'+item.Producto.pres_prod+'</p>')
                            )
                        .append(
                            $('<div class="col-xs-3 col-sm-3 col-md-3 text-right"/>')
                            .html(moneda+' <span>0.00</span>')
                            )
                        )
                    );
                }

            });
            $("#c_bolsa").val(sum_bolsa);

            $(".priceU").on("click",function(){
                var totalTemp = $(this).find(".cantTemp").val();
                $(this).css('cssText','background: #f9e79f !important; color: #424949 !important;');
                $(this).find(".cantTemp").val(parseInt(totalTemp)+1);
                var totalCant = $(this).find(".cantOrg").val();
                var cantB = parseInt(totalCant) - 1;
                $(this).find("b").text(totalTemp+' /');
                var valorItem = $(this).find("span").text();
                var valorPrice = $(this).attr("data-price");
                var totalItem = (parseFloat(valorItem)+parseFloat(valorPrice)).toFixed(2);
                $(this).find("span").text(totalItem);
                var totalGneral=0;
                $(this).find(".cantidad").val(totalTemp);
                if(parseInt(totalCant) < parseInt(totalTemp)){
                    $(this).find(".cantTemp").val(1);
                    $(this).css('cssText','background: none !important');
                    $(this).find("span").text('0.00');
                    $(this).find("b").text('');
                    $(this).find(".cantidad").val(0);
                }
                $(".priceU").each(function() {
                  totalGneral += parseFloat($( this ).find("span").text());
                });
                $(".totalP").val((totalGneral).toFixed(2));
                $(".totalP").text(formatNumber(totalGneral));
                $("#total_pedido").val(totalGneral);
                $(".t_sbt").val((totalGneral).toFixed(2));
                $(".t_sbt").text(formatNumber(totalGneral));
            });
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        }   
    });
    $("#mdl-facturar").modal('show');
}

$("#frm-facturar").submit(function(){

   
    

    if($(".totalP").val() == '0.00'){
        toastr.warning('Advertencia, Seleccionar item de la lista.');
        return false;
    }else if( $("#tipo_doc").val()=='4' && $("#disponibles").val() <1){
        toastr.warning('Advertencia, Generar un nuevo tiraje de comprobante.');
        return false;
    }else if($("#tipo_pago").find("option:selected").val() == ''){
        toastr.warning('Advertencia, Seleccionar tipo de pago.');
        return false;
    }else if($("#tipo_doc").val() == ""){
        toastr.warning('Advertencia, Seleccionar tipo de documento.');
        return false;
    }else if($("#cliente_id").val() == ""){
        toastr.warning('Advertencia, Agregar un cliente al comprobante.');
        return false;
    }else{
        $("#btn-fact").attr('disabled','disabled');
        var form = $(this);
        var venta = {
            tipo_pedido: 0,
            tipoEmision: 0,
            cod_pedido: 0,
            cliente_id: 0,
            tipo_doc: 0,
            tipo_pago: 0,
            pago_t: 0,
            m_desc: 0,
            total_pedido: 0,
            idProd: [],
            cantProd: [],
            precProd: []
        }

        venta.tipo_pedido = $('#cod_tipe').val();
        venta.tipoEmision = $('#tipoEmision').val();
        venta.cod_pedido = $('#cod_pedido').val();
        venta.cliente_id = $('#cliente_id').val();
        venta.tipo_doc = $('#tipo_doc').val();
        venta.tipo_pago = $('#tipo_pago').val();
        venta.pago_t = $('#pago_t').val();
        var descuento = 0;
        if ($('#m_desc').val()){
        	descuento = $('#m_desc').val()
        }
        venta.m_desc = descuento;
        venta.c_bolsa = $('#c_bolsa').val();
        venta.total_pedido = $('#total_pedido').val();
        venta.idProd = $("input[name='idProd[]']").map(function(){return $(this).val();}).get();
        venta.cantProd = $("input[name='cantProd[]']").map(function(){return $(this).val();}).get();
        venta.precProd = $("input[name='precProd[]']").map(function(){return $(this).val();}).get();

        var cod = $('#cod_pedido').val();

        $.ajax({
            //dataType: 'JSON',
            type: 'POST',
            url: '?c=Inicio&a=RegistrarVenta',
            data: venta,
            success: function (r) { 
            	var cadena = r.replace(/['"]+/g, ''); 
            	VentanaCentrada('./view/inicio/sunat/enviar_sunat.php?id_venta='+ cadena + '&id_cliente=' +venta.cliente_id,'Enviando a Sunat','','650','600','true');
            }, 
            error: function(jqXHR, textStatus, errorThrown){
                console.log(errorThrown + ' ' + textStatus);
            }   
        }).done(function(){
            
            if(1 == $('#tipoEmision').val()){
                var ini = window.open('inicio.php','_self');
                return true;
            } else if (2 == $('#tipoEmision').val()){
                if(1 == $('#cod_tipe').val()){
                    var ini = window.open('pedido_mesa.php?Cod='+cod,'_self');
                    return true;
                } else if(2 == $('#cod_tipe').val()){
                    var ini = window.open('pedido_mostrador.php?Cod='+cod,'_self');
                    return true;
                } else if(3 == $('#cod_tipe').val()){
                    var ini = window.open('pedido_delivery.php?Cod='+cod,'_self');
                    return true;
                }
            }
            return true;
        });
        return false;
    }
});

function VentanaCentrada(theURL,winName,features, myWidth, myHeight, isCenter) { //v3.0
	  if(window.screen)if(isCenter)if(isCenter=="true"){
	    var myLeft = (screen.width-myWidth)/2;
	    var myTop = (screen.height-myHeight)/2;
	    features+=(features!='')?',':'';
	    features+=',left='+myLeft+',top='+myTop;
	  }
	  window.open(theURL,winName,features+((features!='')?',':'')+'width='+myWidth+',height='+myHeight);
	}

/* DISEÑO Porcentaje del total de la cuenta */
var porcentajeTotal = function(){
    $("#desc").each(function(i) {
        if ( this.style.display !== "block" ) {
            this.style.display = "block";
            $("#sbt").css("display","block");
            var total = $(".totalP").val();
            $(".t_sbt").val(total);
            $(".t_sbt").text(formatNumber(total));
            $("#pago_e").val('0.00');
            $("#pago_t").val('0.00');
            $("#vuelto").text('0.00');
        } else {
            this.style.display = "none";
            var s_total = $(".t_sbt").val();
            $(".totalP").val(s_total);
            $(".totalP").text(formatNumber(s_total));
            $("#sbt").css("display","none");
            $("#pago_e").val('0.00');
            $("#pago_t").val('0.00');
            $("#vuelto").text('0.00');
            $("#porcentaje").val('');
            $("#m_desc").val('');
        }
        return false;
    });
}

/* Tipo de pagos */
$('#tipo_pago').on('change', function(){
    var selected = $(this).find("option:selected").val();
    if (selected == 1) {
        $("#pago_e").val('');
        $("#pago_t").val('');
        $("#pt").css("display","none");
        $("#pe").css("display","block");
        $("#vuelto").text('0.00');
        $("#pago_t").val('0.00');
    }else if(selected == 2){
        $("#pago_e").val('');
        $("#pago_t").val('');
        $("#pe").css("display","none");
        $("#pt").css("display","block");
        $("#vuelto").text('0.00');
        $("#pago_e").val('0.00');
    }else if(selected == 3){
        $("#pago_e").val('');
        $("#pago_t").val('');
        $("#pe").css("display","block");
        $("#pt").css("display","block");
        $("#vuelto").text('0.00');
    }else{
        $("#pago_e").val('');
        $("#pago_t").val('');
        $("#pt").css("display","none");
        $("#pe").css("display","block");
        $("#vuelto").text('0.00');
        $("#pago_t").val('0.00');
    }
});

/* Pago efectivo */
$('#pago_e').on('keyup', function(){

    var total = $(".totalP").val();
    var pago_e = $("#pago_e").val();
    var pago_t =  $("#pago_t").val();

    var cal = (parseFloat(pago_e) + parseFloat(pago_t));
    var calculo = (parseFloat(cal) - parseFloat(total)).toFixed(2);

    if(isNaN(calculo)){
        calculo = 0;
    }

    $("#vuelto").text(formatNumber(calculo));
});

/* Pago tarjeta */
$('#pago_t').on('keyup', function(){
    var total = $(".totalP").val();
    var pago_e = $("#pago_e").val();
    var pago_t =  $("#pago_t").val();

    var cal = (parseFloat(pago_e) + parseFloat(pago_t));
    var calculo = (parseFloat(cal) - parseFloat(total)).toFixed(2);

    if(isNaN(calculo)){
        calculo = 0;
    }

    $("#vuelto").text(formatNumber(calculo));
});

/* Calculo del porcentaje desde porcentaje */
$('#porcentaje').on('keyup', function(){
    var s_total = $(".t_sbt").val();
    var por = ($("#porcentaje").val() / 100).toFixed(2);
    var cal = (s_total * por).toFixed(2);
    $("#m_desc").val(cal);
    var total = (s_total - cal).toFixed(2);
    $(".totalP").val(total);        
    $(".totalP").text(formatNumber(total));        
});

/* Calculo del porcentaje desde entero o decimal (dinero)*/
$('#m_desc').on('keyup', function(){
    var s_total = $(".t_sbt").val();
    var desc = $("#m_desc").val();
    var total = (s_total - desc).toFixed(2);
    $(".totalP").val(total);
    $(".totalP").text(formatNumber(total));
    $("#porcentaje").val('');       
});

/* Boton limpiar datos del cliente (modal) */
$("#btnClienteLimpiar").click(function() {
    $("#cliente_id").val('');
    $("#cliente").val('');
    $("#nombre_c").val('');
    $("#cliente").focus();
    $("#hhb").removeClass("mhb");
});

$(".ent input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9]')!=0 && keycode!=8){
        return false;
    }
});

$(".dec input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9.]')!=0 && keycode!=8){
        return false;
    }
});