$(function() {
    var cat = '%';
    listarCategorias();
    listarProductos(cat);
    //ComboCatg();
    mensaje();
    $('.scroll_cat').slimscroll({
        height: 250
    });
    $('.scroll_pres').slimscroll({
        height: 450
    });
});

/* Mostrar datos en la lista categorias */
var listarCategorias = function(){
    $('#ul-cat').empty();
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaCatgs",
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
                $('#ul-cat')
                .append(
                    $('<li/>')
                        .html('<a style="display: inline-block;" onclick="listarProductos('+campo.id_catg+')"><i class="fa fa-caret-right"></i> '+campo.descripcion+'</a>'
                        +'<a style="display: inline-block;" class="pull-right" onclick="eliminarCategoria('+campo.id_catg+')"><i class="fa fa-trash"></i></a>'
                        +'<a style="display: inline-block;" class="pull-right" onclick="editarCategoria('+campo.id_catg+',\''+campo.descripcion+'\')"><i class="fa fa-edit"></i></a>')
                )
            });
        }
    });
}

/* Mostrar datos en la tabla productos */
var listarProductos = function(cat){
    $('#head-p').empty();
    $('#body-c').empty();
    $('#body-p').empty();
    var table = $('#table-productos')
    .DataTable({
        "destroy": true,
        "responsive": true,
        "dom": "tp",
        "bSort": false,
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=ListaProd",
            "data": function ( d ) {
                d.cod = '%';
                d.cat = cat;
            }
        },
        "columns":[
            {"data":null,"render": function ( data, type, row) {
                return '<a onclick="listarPresentaciones('+data.id_prod+',\''+data.nombre+'\')">'+data.nombre+'</a>';
            }},
            {"data":null,"render": function ( data, type, row) {
                if(data.id_tipo == 1){
                    return '<div class="text-center"><span class="text-navy"><i class="fa fa-check"></i> Si </span></div>';
                } else if (data.id_tipo == 2){
                    return '<div class="text-center"><span class="text-danger"><i class="fa fa-close"></i> No </span></div>'
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado == 'a'){
                    return '<div class="text-center"><span class="text-navy"><i class="fa fa-check"></i> Si </span></div>';
                } else if (data.estado == 'i'){
                    return '<div class="text-center"><span class="text-danger"><i class="fa fa-close"></i> No </span></div>'
                }
            }},
            {"data":null,"render": function ( data, type, row) {
                return '<a class="btn btn-xs btn-success" onclick="editarProducto('+data.id_prod+')"><i class="fa fa-edit"></i></a>';
            }},
        ]
    });
}

/* Listar presentaciones de cada producto seleccionado */
var listarPresentaciones = function(cod_prod,nomb){
    var moneda = $("#moneda").val();
    var cat = '%';
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaPres",
        data: {
            cod_prod: cod_prod,
            cod_pres: cat
        },
        dataType: "json",
        success: function(item){
        $('#head-p').html('<a class="btn btn-primary btn-block btn-nuvpres" onclick="nuevaPresentacion('+cod_prod+',\''+nomb+'\')"><i class="fa fa-plus-circle"></i> Agregar presentaci&oacute;n </a>');
        $('#body-c').html('<br><strong class="ich">Presentaciones de '+nomb+'</strong><br><br>');
            if (item.data.length != 0) {
                $('#body-p').empty();
                $.each(item.data, function(i, campo) {
                    if(campo.estado == 'a'){
                        var boxpres = '';
                    }else{
                        var boxpres = 'boxpres';
                    }
                    $('#body-p')
                    .append(
                      $('<div class="ibox ibox-cr"/>')
                        .html('<a onclick="editarPresentacion('+campo.id_pres+',\''+nomb+'\')"><div class="ibox-title ibox-title-cr '+boxpres+'"><h5>'+campo.presentacion+'</h5><div class="amount-big"> <span class="the-number"> '+moneda+' '+campo.precio+'</span></div></div></a>')
                    )
                });
            } else {
                $('#body-p').html('<div class="panel panel-transparent panel-dashed text-center" style="padding-top: 6rem;padding-bottom: 6rem;">'
                +'<div class="row"><div class="col-sm-8 col-sm-push-2"><h2 class="ich m-t-none">Agrega una presentación</h2><p>Debes agregar una presentación para poder guardar y usar el producto.</p></div></div></div>');
            }
        }
    });
}

/* Editar datos de un producto */
var editarProducto = function(cod){
    $('#cod_catg').selectpicker('destroy');
    ComboCatg();
    var cat = '%';
    $('#mdl-producto').modal('show');
    $("#cod_prod").val(cod);
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaProd",
        data: {
            cod: cod,
            cat: cat
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
                $('#nombre_prod').val(campo.nombre);
                if(campo.id_tipo == 1){
                    $('#transf').iCheck('check');
                } else if (campo.id_tipo == 2){
                    $('#ntransf').iCheck('check');
                }
                $('#cod_area').selectpicker('val', campo.id_areap);
                $('#cod_catg').selectpicker('val', campo.id_catg);
                $('#estado_catg').selectpicker('val', campo.estado);
                $('#descripcion').val(campo.descripcion);
            });
        }
    });
}

/* Editar categoria */
var editarCategoria = function(cod,desc){
    $("#id_catg").val(cod);
    $("#nombre_catg").val(desc);
    $('#boton-catg').css("display","none");
    $('#nueva-catg').css("display","block");
    $('#frm-categoria').formValidation('revalidateField', 'nombre_catg');
}

/* Eliminar categoria */
var eliminarCategoria = function(id_catg){
    $.ajax({
        type: "POST",
        url: "?c=Config&a=eliminarCategoria",
        data: {
            id_catg: id_catg
        },
        dataType: "json",
        success: function(data){
            if(data == 0){
                toastr.success('Datos eliminados, correctamente.');
                listarCategorias();
            }else if(data == 1){
                toastr.warning('Advertencia, Categoria relacionada con un producto.');
            }
            console.log(data);
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        }
    });
}

/* Nueva presentacion de un producto */
var nuevaPresentacion = function(cod_prod,nomb_prod){
    $('#frm-presentacion').formValidation('resetForm', true);
    $('#estado_pres').val('').selectpicker('refresh');
    $('#wizardPicturePreview').attr('src','assets/img/productos/default.png');
    $('#imagen').val('default.png');
    $('#wizard-picture').val('');
    $('#cod_producto').val(cod_prod);
    $('#nomb_prod').val(nomb_prod);
    var cat = '%';
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaProd",
        data: {
            cod: cod_prod,
            cat: cat
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
            //id_tipo = 1 (Producto Transformado)
                if(campo.id_tipo == 1){
                    // Ocultar check receta (tp-1), stock/stock_minimo (tp-2)
                    $('#tp-1').css('display','none');
                    $('#tp-2').css('display','none');
                    // Quita el check a receta
                    $('#id_rec').iCheck('uncheck');
                    $('#mensaje-ins').css('display','block');
                    $('#mensaje-ins').html('<div class="alert alert-warning">'
                        +'<i class="fa fa-warning"></i> Guarde los datos de la presentaci&oacute;n, para que pueda ingresar una receta.'
                        +'</div>');
                }
                //id_tipo = 2 (Producto NO Transformado)
                else{
                    //Quita el check a stock y su clase icheckbox_flat-green
                    $('#id_stock').iCheck('uncheck');
                    $('.icheckbox_flat-green').removeClass('checked');
                    $('#mensaje-ins').css('display','none');
                    // Ocultar check receta (tp-1)
                    $('#tp-1').css('display','none');
                    // Mostrar check stock / stock-minimo (tp-2)
                    $('#tp-2').css('display','block');
                }
            });
        }
    });
    $('#cod_pres').val('');
    $('#stock_min').val('');
    $('#mdl-presentacion').modal('show');
}

/* Editar datos de una presentacion de un producto */
var editarPresentacion = function(cod_pres,nomb_prod){
    var cat = '%';
    $('#frm-presentacion').formValidation('resetForm', true);
    $("#nomb_prod").val(nomb_prod);
    $('#cod_pre').val(cod_pres);
    $('#mdl-presentacion').modal('show');
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ListaPres",
        data: {
            cod_prod: cat,
            cod_pres: cod_pres
        },
        dataType: "json",
        success: function(item){
            $.each(item.data, function(i, campo) {
                $('#cod_pres').val(campo.id_pres);
                $('#cod_producto').val(campo.id_prod);
                $('#cod_produ').val(campo.cod_prod);
                $('#nombre_pres').val(campo.presentacion);
                $('#precio_prod').val(campo.precio);
                $('#stock_min').val(campo.stock_min);
                $('#opciones').val(campo.opciones);
                $('#limite').val(campo.limite);
                $('#wizardPicturePreview').attr('src','assets/img/productos/'+campo.imagen+'');
                $('#imagen').val(campo.imagen);
                $('#wizard-picture').val('');
                $('#estado_pres').selectpicker('val', campo.estado);
                //id_tipo = 1 (Producto Transformado)
                if(campo.TipoProd.id_tipo == 1){
                    if(campo.receta == 1){
                        $('#id_rec').iCheck('check');
                        $('#mensaje-ins').css('display','block');
                        $('#mensaje-ins').html('<div class="alert alert-info">'
                            +'<i class="fa fa-info"></i> Modificar los ingredientes <a class="alert-link" onclick="receta()">AQUI</a>.'
                            +'</div>');
                    } else {
                        $('#id_rec').iCheck('uncheck');
                        $('#mensaje-ins').css('display','none');
                        $('#mensaje-ins').html('<div class="alert alert-warning">'
                            +'<i class="fa fa-warning"></i> Ingresar los ingredientes <a class="alert-link" onclick="receta()">AQUI</a> y luego click en Guardar.'
                            +'</div>');
                    }
                    // Mostrar check receta (tp-1)
                    $('#tp-1').css('display','block');
                    // Ocultar check stock / stock_minimo (tp-2)
                    $('#tp-2').css('display','none');
                }
                //id_tipo = 2 (Producto NO Transformado)
                else{
                    $('#mensaje-ins').css('display','none');
                    if(campo.receta == 1){
                        $('#id_stock').iCheck('check');
                    } else {
                        $('#id_stock').iCheck('uncheck');
                    }
                    // Ocultar check receta (tp-1)
                    $('#tp-1').css('display','none');
                    // Mostrar check stock / stock_minimo (tp-2)
                    $('#tp-2').css('display','block');
                }
            });
        }
    });
}

/* Producto */
$(function() {
    $('#frm-producto')
        .formValidation({
            framework: 'bootstrap',
            excluded: ':disabled',
            fields: {
            }
    })
    .on('success.form.fv', function(e) {

            e.preventDefault();
            var $form = $(e.target),
            fv = $form.data('formValidation');
            
            var form = $(this);

            var producto = {
                cod_prod: 0,
                tipo_prod: 0,
                cod_catg: 0,
                cod_area: 0,
                nombre_prod: 0,
                descripcion: 0,
                estado_catg: 0
            }

            producto.cod_prod = $('#cod_prod').val();
            producto.tipo_prod = $('input:radio[name=tipo_prod]:checked').val();
            producto.cod_catg = $('#cod_catg').val();
            producto.cod_area = $('#cod_area').val();
            producto.nombre_prod = $('#nombre_prod').val();
            producto.descripcion = $('#descripcion').val();
            producto.estado_catg = $('#estado_catg').val();

            $.ajax({
                dataType: 'JSON',
                type: 'POST',
                url: form.attr('action'),
                data: producto,
                success: function (cod) {
                    if(cod == 0){
                        toastr.warning('Advertencia, Datos duplicados.');
                        return false;
                    } else if(cod == 1){
                        var cat = '%';
                        $('#mdl-producto').modal('hide');
                        listarProductos(cat);
                        toastr.success('Datos registrados, correctamente.');
                    } else if(cod == 2) {
                        var cat = '%';
                        $('#mdl-producto').modal('hide');
                        listarProductos(cat);
                        toastr.success('Datos modificados, correctamente.');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown + ' ' + textStatus);
                }   
            });

            return false;
    });
});

$(function() {
    $('#frm-presentacion')
        .formValidation({
            framework: 'bootstrap',
            excluded: ':disabled',
            fields: {
            }
        })
    .on('success.form.fv', function(e) {

        e.preventDefault();
        var $form = $(e.target),
        fv = $form.data('formValidation');
        var form = $(this);

        var presentacion = new FormData($('#frm-presentacion')[0]);

        $.ajax({
            type: 'POST',
            dataType: 'JSON',
            data: presentacion,
            url: form.attr('action'),
            contentType: false,
            processData: false,
            success: function (cod) {
                if(cod == 0){
                    toastr.warning('Advertencia, Datos duplicados.');
                    return false;
                } else if(cod == 1){
                    $('#mdl-presentacion').modal('hide');
                    listarPresentaciones($('#cod_producto').val(),$('#nomb_prod').val());

                    toastr.success('Datos registrados, correctamente.');

                } else if(cod == 2) {
                    $('#mdl-presentacion').modal('hide');
                    listarPresentaciones($('#cod_producto').val(),$('#nomb_prod').val());
                    toastr.success('Datos modificados, correctamente.');
                }
            },
            error: function(jqXHR, textStatus, errorThrown){
                console.log(errorThrown + ' ' + textStatus);
            }   
        });

        return false;

      });
});

$(function() {

    $('#frm-categoria')
        .formValidation({
            framework: 'bootstrap',
            excluded: ':disabled',
            fields: {
        }
    })

    .on('success.form.fv', function(e) {

        e.preventDefault();
        var $form = $(e.target),
        fv = $form.data('formValidation');

        var form = $(this);

        var categoria = {
            cod_catg: 0,
            nombre_catg: 0
        }

        categoria.cod_catg = $('#id_catg').val();
        categoria.nombre_catg = $('#nombre_catg').val();

        $.ajax({
            dataType: 'JSON',
            type: 'POST',
            url: form.attr('action'),
            data: categoria,
            success: function (cod) {
                if(cod == 0){
                    toastr.warning('Advertencia, Datos duplicados.');
                    return false;
                } else if(cod == 1){
                    listarCategorias();
                    $('#nombre_catg').val('');
                    $("#id_catg").val('');
                    $('#boton-catg').css("display","block");
                    $('#nueva-catg').css("display","none");
                    toastr.success('Datos registrados, correctamente.');
                    return false;
                } else if(cod == 2) {
                    listarCategorias();
                    $('#nombre_catg').val('');
                    $("#id_catg").val('');
                    $('#boton-catg').css("display","block");
                    $('#nueva-catg').css("display","none");
                    toastr.success('Datos modificados, correctamente.');
                    return false;
                }
            },
            error: function(jqXHR, textStatus, errorThrown){
                console.log(errorThrown + ' ' + textStatus);
            }   
        });

    return false;

    });
});

var listarReceta = function(){

    var table = $('#table-ing')
    .DataTable({
        "destroy": true,
        "dom": "tp",
        "bSort": false,
        "lengthMenu": [5],
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=ListaIngs",
            "data": {
                cod: $("#cod_pre").val()
            }
        },
        "columns":[
        {"data":null,"render": function ( data, type, row ) {
            return '<span class="label label-info text-uppercase">INSUMO</span>';
        }},
        {"data": "Insumo.nomb_ins"},
        {"data":null,"render": function ( data, type, row ) {
            var opc_m=data.id_med;if(1==opc_m)var valor_cant=(1*data.cant).toFixed(6);else if(2==opc_m)var valor_cant=(1*data.cant).toFixed(6);else if(3==opc_m)var valor_cant=(1e3*data.cant).toFixed(6);else if(4==opc_m)var valor_cant=(1e6*data.cant).toFixed(6);else if(5==opc_m)var valor_cant=(1*data.cant).toFixed(6);else if(6==opc_m)var valor_cant=(1e3*data.cant).toFixed(6);else if(7==opc_m)var valor_cant=(2.20462*data.cant).toFixed(6);else if(8==opc_m)var valor_cant=(35.274*data.cant).toFixed(6);
            return valor_cant;
        }},
        {"data": "Medida.descripcion"},
        {"data":null,"render": function ( data, type, row ) {
            return '<div class="text-right"><button type="button" class="btn btn-danger btn-xs" onclick="eliminarInsumo('+data.id_pi+');"><i class="fa fa-trash"></i> Eliminar</button></div>';
        }}
        ]
    });

}

var ComboCatg = function(){
    $('#cod_catg').find('option').remove();
    $.ajax({
        type: "POST",
        url: "?c=Config&a=ComboCatg",
        dataType: "json",
        success: function(data){
            $.each(data, function (index, value) {
                $('#cod_catg').append("<option value='" + value.id_catg + "'>" + value.descripcion + "</option>").selectpicker('refresh');            
            });
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log(errorThrown + ' ' + textStatus);
        } 
    });
}

/* Abrir modal para ingresar insumos/ingredientes a la receta */
var receta = function(){
    $('#mdl-presentacion').modal('hide');
    $('#mdl-receta').modal('show');
    $('.list-ins').css('display','none');
    listarReceta();
}

/* Editar datos de insumo/ingrediente en receta */
var editarInsumo = function(cod){
    $.ajax({
        type: "POST",
        url: "?c=Config&a=UIng",
        data: {
            cod: cod,
            cant: $('#cant'+cod).val()
        },
        dataType: "json",
        success: function(datos){
            toastr.success('Datos modificados, correctamente.');
        }
    });
}

/* Eliminar insumo/ingrediente de receta */
var eliminarInsumo = function(cod){
    $.ajax({
        type: "POST",
        url: "?c=Config&a=EIng",
        data: {
            cod: cod
        },
        dataType: "json",
        success: function(datos){
            toastr.error('Datos eliminados, correctamente.');
            listarReceta();
        }
    });
}

$('.btn-eliminar').on('click', function(){
    $('.list-ins').css('display','none');
    $("#b_insumo").val('');
    $('#ins_cant').val('');
    $('#con_n').text('0');
});

/* Boton cerrar modal ingredientes */
$('.btn-cerrar').click( function() {
    $('#mdl-receta').modal('hide');
    $('#mdl-presentacion').modal('show');
});

/* Check activo receta */
$('#id_rec').on('ifChecked', function(event){
    $('#mensaje-ins').css('display','block');
    $('#id_receta').val(1);
});

/* Check inactivo receta */
$('#id_rec').on('ifUnchecked', function(event){
    $('#mensaje-ins').css('display','none');
    $('#id_receta').val(0);
});

/* Check activo stock */
$('#id_stock').on('ifChecked', function(event){
    $('#id_receta').val(1);
});

/* Check inactivo stock */
$('#id_stock').on('ifUnchecked', function(event){
    $('#id_receta').val(0);
});

/* Boton nuevo producto */
$('.btn-prodnuevo').click( function() {
    $('#cod_prod').val('');
    $('#cod_catg').selectpicker('destroy');
    ComboCatg();
    $('#mdl-producto').modal('show');
});

/* Boton nueva categoria */
$('.btn-catg').click( function() {
    $('#boton-catg').css("display","none");
    $('#nueva-catg').css("display","block");
});

/* Boton cancelar categoria */
$('.btn-ccatg').click( function() {
    $('#boton-catg').css("display","block");
    $('#nueva-catg').css("display","none");
    $('#nombre_catg').val('');
    $('#id_catg').val('');
});

$('#mdl-producto').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-producto').formValidation('resetForm', true);
    $('#transf').iCheck('update');
    $('#ntransf').iCheck('update');
    $('#estado_catg').selectpicker('val', 'a');
    $("#descripcion").val('');
    $("#cod_area").val('').selectpicker('refresh');
});

var mensaje = function(){
    if($("#m").val() == 'np'){
        toastr.success('Se ha registrado correctamente el producto');
    }else if ($("#m").val() == 'up'){
        toastr.info('Se ha modificado correctamente el producto');
    }else if ($("#m").val() == 'dp'){
        toastr.error('El nombre del producto ya se encuentra registrado');
    }else if ($("#m").val() == 'pp'){
        toastr.warning('El nombre del producto ya se encuentra registrado');
    }
}
