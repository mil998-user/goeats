$(function(){
    $('.scroll_subitems').slimscroll({
        height: 300
    });
});

/* Sub pedido de la lista */
var subPedido = function(cod,prod){
    var moneda = $("#moneda").val();
    $('#list-subitems').empty();
    var tp = $('#cod_tipe').val();
    if($('#rol_usr').val() == 4){
        disp = 'none';
    }else{
        disp = 'block';
    }
    $.ajax({
        dataType: 'JSON',
        type: 'POST',
        url: '?c=Inicio&a=ListarDetalleSubPed',
        data: {tp: tp, cod: cod, prod: prod},
        success: function (data) {
            $.each(data.Detalle, function(i, item) {

                $('.title-subitems').html('Detalle por orden de pedido:<br>'+item.Producto.nombre_prod+' <span class="label label-warning text-uppercase">'+item.Producto.pres_prod+'</span>');
                var opc = item.estado;
                switch(opc){
                    case 'a':
                        estado = '<span class="label label-primary">PENDIENTE</span>'
                        borlef = 'border-left: 5px solid #1ab394';
                    break;
                    case 'p':
                        estado = '<span class="label label-warning">EN PREPARACION</span>'
                        borlef = 'border-left: 5px solid #f8ac59';
                    break;
                    case 'c':
                        estado = '<span class="label label-success">PREPARADO</span>'
                        borlef = 'border-left: 5px solid #1c84c6';
                    break;
                    case 'i':
                        borlef = 'border-left: 5px solid #ed5565';
                    break;
                    case 'x':
                        estado = '<span class="label label-default">ENTREGADO</span>'
                        borlef = 'border-left: 5px solid #666666';
                    break;
                }

                if (item.estado != 'i'){
                    $('#list-subitems')
                    .append(
                        $('<blockquote style="'+borlef+'"/>')
                        .append('<span class="product-name"><i class="fa fa-calendar"></i> '+moment(item.fecha_pedido).format('DD-MM-Y')+' <i class="fa fa-clock-o"></i> '+moment(item.fecha_pedido).format('h:mm:ss A')+'</span>'
                        +'<span class="price" style="display: '+disp+'"><button type="button" class="btn btn-xs btn-danger pull-right"'
                                +'onclick="cancelarPedido('+cod+','+item.id_pres+',\''+item.cantidad+' '+item.Producto.nombre_prod+' '+item.Producto.pres_prod+'\',\''+item.fecha_pedido+'\')">'
                                +'<i class="fa fa-times"></i></button></span>'
                        +'<small>'+estado+' :: <em>'+item.cantidad+'</em> Unidad(es)</small>') 
                        );
                } else {
                    $('#list-subitems')
                    .append(
                        $('<blockquote class="bg" style="'+borlef+'"/>')
                        .append('<span class="product-name"><i class="fa fa-calendar"></i> '+moment(item.fecha_pedido).format('DD-MM-Y')+' <i class="fa fa-clock-o"></i> '+moment(item.fecha_pedido).format('h:mm:ss A')+'</span>'
                        +'<small><em>'+item.cantidad+'</em> Unidad(es)</small>') 
                        );
                }
            });
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        }   
    });
    $("#mdl-sub-pedido").modal('show');
}

/* Cancelar pedido de la lista */
var cancelarPedido = function(cod_ped,cod_pres,des_ped,fec_ped){
    console.log($('#cod_pag').val());
    console.log($('#cod_tipe').val());
    $('input[name="cod_pag"]').val($('#cod_pag').val());
    $('input[name="cod_tipe"]').val($('#cod_tipe').val());
    $('#cod_ped').val(cod_ped);
    $('#cod_pres').val(cod_pres);
    $('#fec_ped').val(fec_ped);      
    $("#mdl-cancelar-pedido").modal('show');
    $("#mensaje-e").html('<center>¿Estas seguro de eliminar el pedido?<br><br><strong>'+des_ped+'</strong></center>');       
}