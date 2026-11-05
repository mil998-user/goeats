var datetime = null;
var dateday = null;
var datedays = null;
date = null;
var update = function () {
    date = moment(new Date());
    dateday.html(date.format('dddd'));
    datedays.html(date.format('Do MMM'));
    datetime.html(date.format('h:mm A'));
};
$(function() {
    contadorPedidosPreparados();
    setInterval(contadorPedidosPreparados, 10000);
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": true,
        "preventDuplicates": false,
        "positionClass": "toast-bottom-left",
        "onclick": null,
        "showDuration": "400",
        "hideDuration": "1000",
        "timeOut": "7000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    moment.locale('es');
    $('.scroll_pedpre').slimscroll({
        height: 300
    });
    $('.DatePicker')
    .datepicker({
        format: 'dd-mm-yyyy'
    });
    $('.input-daterange').datepicker({
        keyboardNavigation: false,
        forceParse: false,
        autoclose: true
    });
    datetime = $('#datetime');
    dateday = $('#dateday');
    datedays = $('#datedays');
    update();
    setInterval(update, 1000);
});

$(".listar-pedidos-preparados").on("click", function(){
    listarPedidosPreparados();
});

var contadorPedidosPreparados = function(){
    $('.contador-pedido').empty();
    $('.fa-bell').removeClass('animated swing');
    $.ajax({     
        type: "post",
        dataType: "json",
        url: 'inicio.php?c=Inicio&a=contadorPedidosPreparados',
        success: function (data){
            $.each(data, function(i, item) {
                var cantidadPedido = parseInt(item.cantidad);
                if(parseInt(cantidadPedido) > 0){
                    $('.contador-pedido').text(item.cantidad);
                    $('.fa-bell').addClass('animated swing');
                    var sound = new buzz.sound("assets/sound/ding_ding", {
                        formats: [ "ogg", "mp3", "aac" ]
                    });
                    sound.play();
                }
            });
        }
    })
}

var listarPedidosPreparados = function(){
    $('.lista-pedidos-preparados').empty();
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: 'inicio.php?c=Inicio&a=listarPedidosPreparados',
        success: function (item) {
            if (item.data.length != 0) {
                $.each(item.data, function(i, campo) {
                    $('.lista-pedidos-preparados')
                        .append(
                            $('<blockquote style="border-left: 5px solid #1c84c6; cursor: pointer;" onclick="pedidoEntregado('+campo.id_pedido+','+campo.id_pres+',\''+campo.fecha_pedido+'\')"/>')
                            .append('<span class="product-name">'+campo.cantidad+' '+campo.nombre_prod+' <span class="label label-warning">'+campo.pres_prod+'</span></span>'
                            +'<small>Salon: '+campo.desc_m+' - Mesa: '+campo.nro_mesa) 
                            );
                });
            } else {
                $('.lista-pedidos-preparados').html('<center>Sin pedidos en la lista.</center>');
            }
        }
    });
}

var pedidoEntregado = function(id_pedido,id_pres,fecha_pedido){
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: 'inicio.php?c=Inicio&a=pedidoEntregado',
        data: {
            cod_ped: id_pedido,
            cod_pre: id_pres,
            fecha: fecha_pedido
        },
        success: function (data) {
            contadorPedidosPreparados();
            listarPedidosPreparados();
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        }   
    });
}

function formatNumber(num) {
    if (!num || num == 'NaN') return '0.00';
    if (num == 'Infinity') return '&#x221e;';
    num = num.toString().replace(/\$|\,/g, '');
    if (isNaN(num))
        num = "0";
    sign = (num == (num = Math.abs(num)));
    num = Math.floor(num * 100 + 0.50000000001);
    cents = num % 100;
    num = Math.floor(num / 100).toString();
    if (cents < 10)
        cents = "0" + cents;
    for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3) ; i++)
        num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
    return (((sign) ? '' : '-') + num + '.' + cents);
}

//BLOQUEO DE CARACTERES
$(".letMay input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[A-ZÁÉÍÓÚÑ ]')!=0 && keycode!=8 && keycode!=20){
        return false;
    }
});

$(".letNumMay input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9,A-ZÁÉÍÓÚÑ ]')!=0 && keycode!=8 && keycode!=20){
        return false;
    }
});

$(".letMin input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[a-záéíóúñ ]')!=0 && keycode!=8 && keycode!=20){
        return false;
    }
});

$(".letNumMin input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9,a-záéíóúñ ]')!=0 && keycode!=8 && keycode!=20){
        return false;
    }
});

$(".letMayMin input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[aA-zZáÁéÉíÍóÓúÚñÑ ]')!=0 && keycode!=8 && keycode!=20){
        return false;
    }
});

$(".letNumMayMin input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9,aA-zZáÁéÉíÍóÓúÚñÑ/ ]')!=0 && keycode!=8 && keycode!=20){
        return false;
    }
});

$(".letNumMayMin textarea").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9,aA-zZáÁéÉíÍóÓúÚñÑ/ ]')!=0 && keycode!=8 && keycode!=20){
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

$(".ent input").keypress(function(event) {
    var valueKey=String.fromCharCode(event.which);
    var keycode=event.which;
    if(valueKey.search('[0-9]')!=0 && keycode!=8){
        return false;
    }
});

$("input,textarea").on('paste', function(e){
    e.preventDefault();
})

$("input,textarea").on('copy', function(e){
    e.preventDefault();
})