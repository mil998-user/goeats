$(function() {
	nropedidosMesa();
	setInterval(nropedidosMesa, 10000);
	nropedidosMostrador();
	setInterval(nropedidosMostrador, 10000);
	nropedidosDelivery();
	setInterval(nropedidosDelivery, 10000);
});	

/* Mostrar todos los pedidos realizados en las mesas */
var contMe = 0;
var nropedidosMesa = function(){
	$.ajax({     
        type: "post",
        dataType: "json",
        url: '?c=AreaProd&a=ListarM',
        success: function (data){
	        $.each(data, function(i, item) {
				var nroPedMe = parseInt(item.Total.nro_p);
				$('#cant_pedidos_mesa').text(nroPedMe);
	    		if(parseInt(nroPedMe) !== contMe){
	    			contMe = 0;
	    			pedidosMesa();
	    			var sound = new buzz.sound("assets/sound/ding_ding", {
						formats: [ "ogg", "mp3", "aac" ]
					});
					sound.play();
					contMe = nroPedMe + contMe;
	    		}
	    		console.log('contMe = '+contMe+' <> NroPedMe = '+nroPedMe);
			})
		}
	})
}

var pedidosMesa = function(){
	moment.locale('es');
	$('#list_pedidos_mesa').empty();
	$.ajax({     
        type: "post",
        dataType: "json",
        url: '?c=AreaProd&a=ListarM',
        success: function (data){
        $.each(data, function(i, item) {
    		var horaPedido = moment(item.fecha_pedido).fromNow();
    		if (item.id_tipo == 2){
				probar = 'primary';
				nombar = 'En espera';
				accion = 'despMe';
    		} else if(item.id_tipo == 1){
    			if(item.estado == 'a'){
					probar = 'primary';
					nombar = 'En espera';
					accion = 'prepMe';
	    		} else if(item.estado == 'p'){
					probar = 'warning';
					nombar = 'En preparacion';
					accion = 'despMe';
	    		}
    		}

    		$('#list_pedidos_mesa')
				.append(
					$('<li class="success-element limost"/>')
					.append(
						$('<div class="row"/>')
							.append(
								$('<div class="col-md-1" style="text-align: center;"/>')
									.append(
										$('<strong/>')
										.html(item.nro_mesa+'<br>'+item.desc_m)
								)
							)
							.append(
								$('<div class="col-md-4"/>')
									.append(
										$('<span/>')
										.html(item.cantidad+' '+item.nombre_prod+' <span class="label label-info">'+item.pres_prod+
										'</span>&nbsp;<span class="label label-warning">'+item.CProducto.desc_c+
										'</span><br><i class="fa fa-comment"></i> <small class="text-navy"><em>'+item.comentario+'</em>')
								)
							)
							.append(
								$('<div class="col-md-2" style="text-align: center;"/>')
									.append(
										$('<span/>')
										.html(horaPedido)
								)
							)
							.append(
								$('<div class="col-md-2" style="text-align: center;"/>')
									.append(
										$('<div class="progress progress-striped active" style="margin-bottom: -20px;"/>')
										.append(
											$('<div style="width: 100%" aria-valuemax="50" aria-valuemin="0" role="progressbar" class="progress-bar progress-bar-'+probar+'"/>')
												.append(
													$('<span/>')
													.html(nombar)
										)
									)
								)
							)
							.append(
								$('<div class="col-md-2"/>')
									.append(
										$('<span/>')
										.html(item.nombres+' '+item.ape_paterno)
								)
							)
							.append(
								$('<div class="col-md-1" style="text-align: center;"/>')
									.append(
											$('<a onclick="'+accion+'('+item.id_pedido+','+item.id_pres+',\''+item.fecha_pedido+'\');"/>')
												.append(
												$('<button class="btn btn-outline btn-primary dim" type="button" style="margin-bottom: 0px !important;margin-top: -5px !important;"/>')
												.append(
													$('<i class="fa fa-check"/>')
										)
									)
								)
							)
						)
					);				
    		})
        }
    });
}

/* Mostrar todos los pedidos realizados en el mostrador o para llevar */
var contMo = 0;
var nropedidosMostrador = function(){
	$.ajax({     
        type: "post",
        dataType: "json",
        url: '?c=AreaProd&a=ListarMO',
        success: function (data){
        	$.each(data, function(i, item) {
				var nroPedMo = parseInt(item.Total.nro_p);
				$('#cant_pedidos_most').text(nroPedMo);
	    		if(parseInt(nroPedMo) !== contMo){
	    			contMo = 0;
	    			pedidosMostrador();
	    			var sound = new buzz.sound("assets/sound/ding_ding", {
						formats: [ "ogg", "mp3", "aac" ]
					});
					sound.play();
					contMo = nroPedMo + contMo;
	    		}
	    		console.log('contMo = '+contMo+' <> NroPedMo = '+nroPedMo);
			})
		}
	})
}

var pedidosMostrador = function(){
	moment.locale('es');
	$('#list_pedidos_most').empty();
	$.ajax({     
        type: "post",
        dataType: "json",
        url: '?c=AreaProd&a=ListarMO',
        success: function (data){
        $.each(data, function(i, item) {
    		var horaPedido = moment(item.fecha_pedido).fromNow();
    		if (item.id_tipo == 2){
	    			mprobar = 'primary';
	    			mnombar = 'En espera';
	    			maccion = 'despMo';
    		} else if(item.id_tipo == 1){
    				if(item.estado == 'a'){
	    			mprobar = 'primary';
	    			mnombar = 'En espera';
	    			maccion = 'prepMo';
	    		} else if(item.estado == 'p'){
	    			mprobar = 'warning';
	    			mnombar = 'En preparacion';
	    			maccion = 'despMo';
	    		}
    		}
    		$('#list_pedidos_most')
				.append(
					$('<li class="success-element limost"/>')
					.append(
						$('<div class="row"/>')
							.append(
								$('<div class="col-md-1" style="text-align: center;"/>')
									.append(
										$('<strong/>')
										.html('<i class="fa fa-slack"></i> '+item.nro_pedido)
								)
							)
							.append(
								$('<div class="col-md-4"/>')
									.append(
										$('<span/>')
										.html(item.cantidad+' '+item.nombre_prod+' <span class="label label-info">'+item.pres_prod+
										'</span>&nbsp;<span class="label label-warning">'+item.CProducto.desc_c+
										'</span><br><i class="fa fa-comment"></i> <small class="text-navy"><em>'+item.comentario+'</em>')
								)
							)
							.append(
								$('<div class="col-md-2" style="text-align: center;"/>')
									.append(
										$('<span/>')
										.html(horaPedido)
								)
							)
							.append(
								$('<div class="col-md-2" style="text-align: center;"/>')
									.append(
										$('<div class="progress progress-striped active" style="margin-bottom: -20px;"/>')
										.append(
											$('<div style="width: 100%" aria-valuemax="50" aria-valuemin="0" role="progressbar" class="progress-bar progress-bar-'+mprobar+'"/>')
												.append(
													$('<span/>')
													.html(mnombar)
										)
									)
								)
							)
							.append(
								$('<div class="col-md-2"/>')
									.append(
										$('<span/>')
										.html(item.nombres+' '+item.ape_paterno)
								)
							)
							.append(
								$('<div class="col-md-1" style="text-align: center;"/>')
									.append(
											$('<a onclick="'+maccion+'('+item.id_pedido+','+item.id_pres+',\''+item.fecha_pedido+'\');"/>')
												.append(
												$('<button class="btn btn-outline btn-primary dim" type="button" style="margin-bottom: 0px !important;margin-top: -5px !important;"/>')
												.append(
													$('<i class="fa fa-check"/>')
										)
									)
								)
							)
						)
					);			
    		})
        }
    });
}

/* Mostrar todos los pedidos realizados en el mostrador o para llevar */
var contDe = 0;
var nropedidosDelivery = function(){
	$.ajax({     
        type: "post",
        dataType: "json",
        url: '?c=AreaProd&a=ListarDE',
        success: function (data){
	        $.each(data, function(i, item) {
				var nroPedDe = parseInt(item.Total.nro_p);
				$('#cant_pedidos_del').text(nroPedDe);
	    		if(parseInt(nroPedDe) !== contDe){
	    			contDe = 0;
	    			pedidosDelivery();
	    			var sound = new buzz.sound("assets/sound/ding_ding", {
						formats: [ "ogg", "mp3", "aac" ]
					});
					sound.play();
					contDe = nroPedDe + contDe;
	    		}
	    		console.log('contDe = '+contDe+' <> NroPedDe = '+nroPedDe);
			})
		}
	})
}

var pedidosDelivery = function(){
	moment.locale('es');
	$('#list_pedidos_del').empty();
	$.ajax({     
        type: "post",
        dataType: "json",
        url: '?c=AreaProd&a=ListarDE',
        success: function (data){
        $.each(data, function(i, item) {
    		var horaPedido = moment(item.fecha_pedido).fromNow();
    		$('#cant_pedidos_del').text(item.Total.nro_p);
    		if (item.id_tipo == 2){
	    			mprobar = 'primary';
	    			mnombar = 'En espera';
	    			maccion = 'despDe';
    		} else if(item.id_tipo == 1){
    				if(item.estado == 'a'){
	    			mprobar = 'primary';
	    			mnombar = 'En espera';
	    			maccion = 'prepDe';
	    		} else if(item.estado == 'p'){
	    			mprobar = 'warning';
	    			mnombar = 'En preparacion';
	    			maccion = 'despDe';
	    		}
    		}
    		$('#list_pedidos_del')
				.append(
					$('<li class="success-element limost"/>')
					.append(
						$('<div class="row"/>')
							.append(
								$('<div class="col-md-1" style="text-align: center;"/>')
									.append(
										$('<strong/>')
										.html('<i class="fa fa-slack"></i> '+item.nro_pedido)
								)
							)
							.append(
								$('<div class="col-md-4"/>')
									.append(
										$('<span/>')
										.html(item.cantidad+' '+item.nombre_prod+' <span class="label label-info">'+item.pres_prod+
										'</span>&nbsp;<span class="label label-warning">'+item.CProducto.desc_c+
										'</span><br><i class="fa fa-comment"></i> <small class="text-navy"><em>'+item.comentario+'</em>')
								)
							)
							.append(
								$('<div class="col-md-2" style="text-align: center;"/>')
									.append(
										$('<span/>')
										.html(horaPedido)
								)
							)
							.append(
								$('<div class="col-md-2" style="text-align: center;"/>')
									.append(
										$('<div class="progress progress-striped active" style="margin-bottom: -20px;"/>')
										.append(
											$('<div style="width: 100%" aria-valuemax="50" aria-valuemin="0" role="progressbar" class="progress-bar progress-bar-'+mprobar+'"/>')
												.append(
													$('<span/>')
													.html(mnombar)
										)
									)
								)
							)
							.append(
								$('<div class="col-md-2"/>')
									.append(
										$('<span/>')
										.html(item.nombres+' '+item.ape_paterno)
								)
							)
							.append(
								$('<div class="col-md-1" style="text-align: center;"/>')
									.append(
											$('<a onclick="'+maccion+'('+item.id_pedido+','+item.id_pres+',\''+item.fecha_pedido+'\');"/>')
												.append(
												$('<button class="btn btn-outline btn-primary dim" type="button" style="margin-bottom: 0px !important;margin-top: -5px !important;"/>')
												.append(
													$('<i class="fa fa-check"/>')
										)
									)
								)
							)
						)
					);			
    		})
        }
    });
}

$('#tab1').on('click', function() { 
	nropedidosMesa();
});

$('#tab2').on('click', function() {
	nropedidosMostrador();
});

$('#tab3').on('click', function() { 
	nropedidosDelivery();
});

var prepMe = function(cod_ped,cod_prod,fecha_p){
	$.ajax({
      dataType: 'JSON',
      type: 'POST',
      url: '?c=AreaProd&a=Preparacion',
      data: {
      	cod_ped: cod_ped,
      	cod_prod: cod_prod,
      	fecha_p: fecha_p
      },
      success: function (datos) {
      	$('#cant_pedidos_mesa').text('');
      	nropedidosMesa();
      	pedidosMesa();
      },
      error: function(jqXHR, textStatus, errorThrown){
          console.log(errorThrown + ' ' + textStatus);
      }   
  });
}

var prepMo = function(cod_ped,cod_prod,fecha_p){
	$.ajax({
      dataType: 'JSON',
      type: 'POST',
      url: '?c=AreaProd&a=Preparacion',
      data: {
      	cod_ped: cod_ped,
      	cod_prod: cod_prod,
      	fecha_p: fecha_p
      },
      success: function (datos) {
      	nropedidosMostrador();
      	pedidosMostrador();
      },
      error: function(jqXHR, textStatus, errorThrown){
          console.log(errorThrown + ' ' + textStatus);
      }   
  });
}

var prepDe = function(cod_ped,cod_prod,fecha_p){
	$.ajax({
      dataType: 'JSON',
      type: 'POST',
      url: '?c=AreaProd&a=Preparacion',
      data: {
      	cod_ped: cod_ped,
      	cod_prod: cod_prod,
      	fecha_p: fecha_p
      },
      success: function (datos) {
      	nropedidosDelivery();
      	pedidosDelivery();
      },
      error: function(jqXHR, textStatus, errorThrown){
          console.log(errorThrown + ' ' + textStatus);
      }   
  });
}

var despMe = function(cod_ped,cod_prod,fecha_p){
	$.ajax({
      dataType: 'JSON',
      type: 'POST',
      url: '?c=AreaProd&a=Atendido',
      data: {
      	cod_ped: cod_ped,
      	cod_prod: cod_prod,
      	fecha_p: fecha_p
      },
      success: function (datos) {
      	nropedidosMesa();
      	pedidosMesa();
      	$('#cant_pedidos_mesa').text('');
		contMe = contMe - 1;
      },
      error: function(jqXHR, textStatus, errorThrown){
          console.log(errorThrown + ' ' + textStatus);
      }   
  });
}

var despMo = function(cod_ped,cod_prod,fecha_p){
	$.ajax({
      dataType: 'JSON',
      type: 'POST',
      url: '?c=AreaProd&a=Atendido',
      data: {
      	cod_ped: cod_ped,
      	cod_prod: cod_prod,
      	fecha_p: fecha_p
      },
      success: function (datos) {
      	nropedidosMostrador();
      	pedidosMostrador();
      	$('#cant_pedidos_most').text('');
		contMo = contMo - 1;
      },
      error: function(jqXHR, textStatus, errorThrown){
          console.log(errorThrown + ' ' + textStatus);
      }   
  });
}

var despDe = function(cod_ped,cod_prod,fecha_p){
	$.ajax({
      dataType: 'JSON',
      type: 'POST',
      url: '?c=AreaProd&a=Atendido',
      data: {
      	cod_ped: cod_ped,
      	cod_prod: cod_prod,
      	fecha_p: fecha_p
      },
      success: function (datos) {
      	nropedidosDelivery();
      	pedidosDelivery();
      	$('#cant_pedidos_del').text('');
		contDe = contDe - 1;
      },
      error: function(jqXHR, textStatus, errorThrown){
          console.log(errorThrown + ' ' + textStatus);
      }   
  });
}


