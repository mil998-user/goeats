$(function() {
    validarApertura();
    listDelivery();
    listMostrador();
    listarPedidosComandas();
    horaPedido();
    setInterval(horaPedido, 1000);
    mensaje();

    $('#frm-gral').formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
        fields: {

        }
    })

    $('.scroll_pedidos').slimscroll({
        height: 350
    });

    $('#frm-mesa').formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
        fields: {
            nombClie: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            }
        }
    })

    $('#frm-mostrador').formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
        fields: {
            nombClie: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            }
        }
    })

    $('#frm-delivery').formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
        fields: {
            nombClie: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            },
            telefClie: {
                validators: {
                    notEmpty: {
                        message: 'Dato obligatorio'
                    }
                }
            }
        }
    })

    $('#frm-cambiar-mesa').formValidation({
    framework: 'bootstrap',
    excluded: ':disabled',
        fields: {
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

/* Validar apertura de caja */
var validarApertura = function(){
    if($('#cod_ape').val() == 0){
        $('#mdl-validar-apertura').modal('show');
    }
}

/* Hora de pedido */
function horaPedido(){
    moment.locale('es');
    $('input[name^="hora_pe"]').each(function(i) {
        var fechaConvertida = moment($(this).val()).fromNow();
        $("#hora_p"+i).text(fechaConvertida);
    });
}

/* Listar Mostrador */
var listMostrador = function(){
    $('#list-mostrador').empty();
    var moneda = $("#moneda").val();
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=ListarMostrador',
        success: function (data) {
            $.each(data, function(i, item) {
                if(item.estado == 'a'){
                    $('#list-mostrador')
                    .append(
                        $('<a onclick="listarPedidos(2,'+item.id_pedido+',\''+item.nro_pedido+'\',1)"/>')
                        .append(
                           $('<li class="warning-element limost"/>')
                            .append(
                            $('<div class="row"/>')
                            .append(
                                $('<div class="col-md-2 text-center"/>')
                                .html('<strong><i class="fa fa-slack"></i>&nbsp;'+item.nro_pedido+'</strong>')
                                )
                            .append(
                                $('<div class="col-md-2 text-center"/>')
                                .html('<i class="fa fa-clock-o"></i>&nbsp;'+moment(item.fecha_pedido).format('h:mm A'))
                                )
                            .append(
                                $('<div class="col-md-3 text-center"/>')
                                .html('<div class="progress progress-striped active" style="margin-bottom: -20px;">'
                                    +'<div style="width: 100%" aria-valuemax="50" aria-valuemin="0" role="progressbar" class="progress-bar progress-bar-warning">'
                                    +'<span>Pedido abierto...</span></div></div>')
                                )
                            .append(
                                $('<div class="col-md-3"/>')
                                .html('<i class="fa fa-user"></i>&nbsp;'+item.nomb_cliente)
                                )
                            .append(
                                $('<div class="col-md-2 text-right"/>')
                                .html(moneda+' '+formatNumber(item.Total.total))
                                )
                            )
                        )
                    );
                }
            });
        }
    });
}

/* Listar Delivery (EN PREPARACION) */
var listDelivery = function(){
    $('#list-preparacion').empty();
    $('#list-enviados').empty();
    var moneda = $("#moneda").val();
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=ListarDelivery',
        success: function (data) {
            $.each(data, function(i, item) {
                if(item.estado == 'a'){
                    $('#list-preparacion')
                    .append(
                        $('<a onclick="listarPedidos(3,'+item.id_pedido+',\''+item.nro_pedido+'\',1)"/>')
                        .append(
                           $('<li class="warning-element limost"/>')
                            .append(
                            $('<div class="row"/>')
                            .append(
                                $('<div class="col-md-2 text-center"/>')
                                .html('<strong><i class="fa fa-slack"></i>&nbsp;'+item.nro_pedido+'</strong>')
                                )
                            .append(
                                $('<div class="col-md-2 text-center"/>')
                                .html('<i class="fa fa-clock-o"></i>&nbsp;'+moment(item.fecha_pedido).format('h:mm A'))
                                )
                            .append(
                                $('<div class="col-md-3"/>')
                                .html('<i class="fa fa-phone"></i>&nbsp;'+item.telefono)
                                )
                            .append(
                                $('<div class="col-md-3"/>')
                                .html('<i class="fa fa-user"></i>&nbsp;'+item.nomb_cliente)
                                )
                            .append(
                                $('<div class="col-md-2 text-right"/>')
                                .html(moneda+' '+formatNumber(item.Total.total))
                                )
                            )
                        )
                    );
                } 
                
                else if(item.estado == 'x' && item.fecha == $('#fecha').val()) {
                    $('#list-enviados')
              
                        .append(
                           $('<li class="success-element limost"/>')
                            .append(
                            $('<div class="row"/>')
                            .append(
                                $('<div class="col-md-2 text-center"/>')
                                .html('<strong><i class="fa fa-slack"></i>&nbsp;'+item.nro_pedido+'</strong>')
                                )
                            .append(
                                $('<div class="col-md-2 text-center"/>')
                                .html('<i class="fa fa-clock-o"></i>&nbsp;'+moment(item.fecha_pedido).format('h:mm A'))
                                )
                            .append(
                                $('<div class="col-md-3"/>')
                                .html('<i class="fa fa-phone"></i>&nbsp;'+item.telefono)
                                )
                            .append(
                                $('<div class="col-md-3"/>')
                                .html('<i class="fa fa-user"></i>&nbsp;'+item.nomb_cliente)
                                )
                            .append(
                                $('<div class="col-md-2 text-right"/>')
                                .html(moneda+' '+formatNumber(item.Total.total))
                                )
                            )
                        
                    );
                }
                
            });
        }
    });
}

var listarPedidos = function(c,cod,nro,salon){
    if(c == 1){
        tipaten = 'pedido_mesa';
        $('.title-cab').html('Salon: '+salon+' - Mesa: '+nro);
    } else if (c == 2){
        tipaten = 'pedido_mostrador';
        $('.title-cab').html('Detalle: <br><i class="fa fa-slack"></i> '+nro);
    } else if (c == 3){
        tipaten = 'pedido_delivery';
        $('.title-cab').html('Detalle: <br><i class="fa fa-slack"></i> '+nro);
    }
    $('.cont01').css('display','none');
    $('.cont02').css('display','none');
    $('.cont03').css('display','block');
    $('#list-nprod').empty();
    var moneda = $("#moneda").val();
    
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=listarPedidos',
        data: {cod: cod},
        success: function (data) {
            var totPed = 0,
                total = 0;
            if (data.length != 0) {
                $.each(data, function(i, item) {
                    total = (item.cantidad * item.precio);
                    $('#list-nprod')
                    .append(
                        $('<blockquote class="animated fadeInLeft" style="cursor: pointer;" onclick="subPedido('+item.id_pedido+','+item.id_pres+');"/>')
                        .append('<span class="product-name text-navy">'+item.Producto.nombre_prod+' <span class="label label-warning text-uppercase">'+item.Producto.pres_prod+'</span></span>'
                        +'<span class="price">'+moneda+formatNumber(total)+'</span>'
                        +'<small><em>'+item.cantidad+'</em> Unidad(es) en '+moneda+''+formatNumber(item.precio)+' / Unidad(es)</small>') 
                        );
                    totPed = total + totPed;    
                });
                $('.totalPagar').html('<span class="icon"><i class="fa fa-money fa-2x"></i></span><div class="text">'
                    +'<span>'+moneda+''+formatNumber(totPed)+'</span>por pagar</span>');
            } else {
                $('#list-nprod').html('<div class="panel panel-transparent tip-sales text-center">'
                +'<div class="row"><div class="col-sm-8 col-sm-push-2"><h2 class="ich m-t-none">Ingrese pedidos...</h2></p></div></div></div>');
                $('.totalPagar').html('<span class="icon"><i class="fa fa-money fa-2x"></i></span><div class="text">'
                    +'<span>'+moneda+''+formatNumber(totPed)+'</span>por pagar</span>');
            }
        }
    });
    $('.btn-footer').css('display','block');
    $('.btn-form').html('<a class="btn btn-primary" href="'+tipaten+'.php?Cod='+cod+'"><i class="fa fa-sign-in"></i> Ingresar</a>');
}

 
/* Mostrar datos en la tabla caja */

var listarPedidosComandas = function(){
    var table = $('#list-comandas')
    .DataTable({ 
        "destroy": true,
        "responsive": true,
        "dom": "<'row'<'col-sm-6'><'col-sm-6'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "bSort": true,
        "ajax":{
            "method": "POST", 
            "url": "?c=Inicio&a=listarPedidosComandas"
        },
        "columns":[
            {"data":"estado"},
            {"data":"estado"},
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><a href="?c=Config&a=obtenerDatos&cod='+data.codigo+'"</div>';
            }}
        ]
    });
}




var nuevoPed = function(cod,mesa,salon){
    $('.txt-telf').css('display','none');
    $('.txt-direc').css('display','none');
    $('.txt-mozo').css('display','block');
    $("#telefClie").attr('disabled','true');
    $("#direcClie").attr('disabled','true');
    $('.codMesa').val(cod);
    $('.cont01').css('display','none');
    $('.cont02').css('display','block');
    $('.cont03').css('display','none');
    $('.title-cab').html('Salon: '+salon+' - Mesa: '+mesa);
    $('#frm-gral').data('formValidation').resetForm($('#frm-gral'));
    $('.btn-footer').css('display','block');
    $('.btn-form').html('<button type="submit" class="btn btn-primary btn-form"><i class="fa fa-sign-in"></i> Aceptar</button>');
    $('.totalPagar').html('');
}

/* Registrar mesa */
var registrarMesa = function(cod_mesa,nro_mesa,desc_c){
    $('.codMesa').val(cod_mesa);
    $("#mdl-mesa").modal('show');
    $("#nombClie").val('Mesa '+ nro_mesa);
    $(".s-mesa").text(nro_mesa);
    $(".mtp").html(desc_c);
}

/* Combo mesa origen */
var comboMesaOrigen = function(cod){
    $('#c_mesa').selectpicker('destroy');
    $.ajax({
        type: "POST",
        url: "?c=Inicio&a=ComboMesaOri",
        data: {cod: cod},
        success: function (response) {
            $('#c_mesa').html(response);
            $('#c_mesa').selectpicker();
        },
        error: function () {
            $('#c_mesa').html('There was an error!');
        }
    });
}

/* Combo mesa destino */
var comboMesaDestino = function(cod){
    //var cod = $('#co_salon').val();
    $('#co_mesa').selectpicker('destroy');
    $.ajax({
        type: "POST",
        url: "?c=Inicio&a=ComboMesaDes",
        data: {cod: cod},
        success: function (response) {
            $('#co_mesa').html(response);
            $('#co_mesa').selectpicker();
        },
        error: function () {
            $('#co_mesa').html('There was an error!');
        }
    });
}

/* Combo salon origen */
$('#cbo-salon-o').change( function() {
    var cod = $('#cbo-salon-o').val();
    comboMesaOrigen(cod);
    $('#frm-cambiar-mesa').formValidation('revalidateField', 'c_mesa');
});

/* Combo salon destino */
$('#cbo-salon-d').change( function() {
    var cod = $('#cbo-salon-d').val();
    comboMesaDestino(cod);
});

/* Boton cambiar mesa */
$('.btn-cm').click( function() {
    var cod = $('#cbo-salon-o').val();
    var cdm = $('#cbo-salon-d').val();
    comboMesaOrigen(cod);
    comboMesaDestino(cdm);
});

/*  */
$('.tab01').click( function() {
    $('.div-btn-nuevo').css('display','none');
    $('.cont01').css('display','block');
    $('.nomPed').html('una mesa');
    $('.cont02').css('display','none');
    $('.cont03').css('display','none');
    $('.txt-telf').css('display','none');
    $('.txt-direc').css('display','none');
    $('.txt-mozo').css('display','block');
    $('#frm-gral').attr('action','?c=Inicio&a=RMesa');
    $("#telefClie").attr('disabled','true');
    $("#direcClie").attr('disabled','true');
    $("#codMozo").removeAttr('disabled');
    $('.title-cab').html('Detalle:');
    $('.totalPagar').html('');
    $('.btn-footer').css('display','none');
});

$('.tab02').click( function() {
    $('input[name^="cod_tipe"]').val(2);
    $('.div-btn-nuevo').css('display','block');
    $('.cont01').css('display','block');
    $('.nomPed').html('un pedido');
    $('.cont02').css('display','none');
    $('.cont03').css('display','none');
    $('.txt-telf').css('display','none');
    $('.txt-direc').css('display','none');
    $('.txt-mozo').css('display','none');
    $('#frm-gral').attr('action','?c=Inicio&a=RMostrador');
    $("#telefClie").attr('disabled','true');
    $("#direcClie").attr('disabled','true');
    $("#codMozo").attr('disabled','true');
    $('.title-cab').html('Detalle:');
    $('.totalPagar').html('');
    $('.btn-footer').css('display','none');
});

$('.tab03').click( function() {
    $('input[name^="cod_tipe"]').val(3);
    $('.div-btn-nuevo').css('display','block');
    $('.cont01').css('display','block');
    $('.nomPed').html('un pedido');
    $('.cont02').css('display','none');
    $('.cont03').css('display','none');
    $('.txt-telf').css('display','block');
    $('.txt-direc').css('display','block');
    $('.txt-mozo').css('display','none');
    $('#frm-gral').attr('action','?c=Inicio&a=RDelivery');
    $("#telefClie").removeAttr('disabled');
    $("#direcClie").removeAttr('disabled');
    $("#codMozo").attr('disabled','true');
    $('.title-cab').html('Detalle:');
    $('.totalPagar').html('');
    $('.btn-footer').css('display','none');
});

$('.btn-nped').click( function() {
    $('.cont01').css('display','none');
    $('.cont02').css('display','block');
    $('.cont03').css('display','none');
    $('#frm-gral').data('formValidation').resetForm($('#frm-gral'));
    $('.btn-footer').css('display','block');
    $('.btn-form').html('<button type="submit" class="btn btn-primary btn-form"><i class="fa fa-sign-in"></i> Aceptar</button>');
    $('.totalPagar').html('');
    $('.title-cab').html('Detalle:');
});

$('.btn-canc').click( function(){
    $('#frm-gral').data('formValidation').resetForm($('#frm-gral'));
    $('.cont01').css('display','block');
    $('.cont02').css('display','none');
    $('.cont03').css('display','none');
    $('.btn-footer').css('display','none');
    $('.totalPagar').html('');
    $('.title-cab').html('Detalle:');
});

$('#mdl-mesa').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-mesa').formValidation('resetForm', true);
    $("#cod_mozo").val('').selectpicker('refresh');
});

$('#mdl-mostrador').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-mostrador').formValidation('resetForm', true);
});

$('#mdl-cambiar-mesa').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-cambiar-mesa').formValidation('resetForm', true);
    $("#c_mesa").val('').selectpicker('refresh');
    $("#co_mesa").val('').selectpicker('refresh');
});

$('#mdl-delivery').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-delivery').formValidation('resetForm', true);
});

var mensaje = function(){
    if($("#cod_m").val() == 'd'){
        toastr.warning('Advertencia, Mesa ocupada.');
    }else if ($("#cod_m").val() == 'f'){
        toastr.warning('Advertencia, La mesa ya ha sido facturada.');
    }
}

var refresh = function(){
    location.reload();
};