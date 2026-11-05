$(function() {
    listarTiposDoc();
    $('#frm-tipodoc')
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
            
            cod_td = $('#cod_td').val();
            serie = $('#serie').val();
            numero = $('#numero').val();

            $.ajax({
                dataType: 'JSON',
                type: 'POST',
                url: '?c=Config&a=GuardarTD',
                data: {
                    cod_td: cod_td,
                    serie: serie,
                    numero: numero
                },
                success: function (datos) {
                    $('#mdl-tipodoc').modal('hide');
                    listarTiposDoc();
                    toastr.info('Se ha modificado correctamente los datos!');
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown + ' ' + textStatus);
                }   
            });

          return false;
    });
});

/* Mostrar datos en la tabla tipo de documentos */
var listarTiposDoc = function(){
    var cont = 1;
    var table = $('#table')
    .DataTable({
        "destroy": true,
        "responsive": true,
        "dom": "<'row'<'col-sm-6'><'col-sm-6'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "bSort": false,
        "ajax":{
            "method": "POST",
            "dataType": "JSON",
            "url": "?c=Config&a=ListarTD"
        },
        "columns":[
            {"data":null,"render": function ( data, type, row) {
                return '<i class="fa fa-slack"></i> 0'+cont++;
            }},
            {"data":"descripcion"},
            {"data":"serie"},
            {"data":"numero"}, 
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><button class="btn btn-info btn-xs" onclick="listarTirajes('+data.id_tipo_doc+',\''+data.descripcion+'\');"> Ver </button>'
                +'&nbsp;<a class="btn btn-success btn-xs" onclick="editarTipoDoc('+data.id_tipo_doc+',\''+data.descripcion+'\',\''+data.serie+'\',\''+data.numero+'\');"><i class="fa fa-edit"></i> Editar</a></div>';
            }}
        ]
    });
}


/* Mostrar datos en la tabla mesas */
var listarTirajes = function(cod_sal,desc_sal){
    var mesaNueva = '';
    /* Ocultar panel mensaje 'seleccione un salon' */
    $('#lizq-s').css("display","none"); 
    /* Mostrar tabla mesas por salon */
    $('#lizq-i').css("display","block");
    $('#btn-nuevo').html('<a href="?c=Config&a=obtenerDatosTiraje" class="btn btn-primary" ><i class="fa fa-plus-circle"></i> Nuevo tiraje</a>');

    $('#title-mesa').text(desc_sal);
    var table = $('#table-m')
    .DataTable({
        "destroy": true,
        "responsive": true, 
        "dom": "ftp",
        "bSort": false,
        "ajax":{
            "method": "POST",
            "url": "?c=Config&a=ListarTirajes",
            "data": function ( d ) {
              d.cod = cod_sal;
          }
        },
        "columns":[
            {"data":"Salon.descripcion"},
            {"data":null,"render": function ( data, type, row) {
                return '<i class="fa fa-square"></i> '+data.serie;
            }},
            {"data":null,"render": function ( data, type, row) {
                return data.desde;
            }},
            {"data":null,"render": function ( data, type, row) {
                return data.hasta;
            }},
            {"data":null,"render": function ( data, type, row) {
                if(data.estado == '1'){
                  return '<span class="label label-primary">ACTIVO</span>';
                } else if (data.estado == '0'){
                  return '<span class="label label-danger">INACTIVO</span>'
                } 
            }},
            {"data":null,"render": function ( data, type, row) {
                return '<div class="text-right"><a class="btn btn-success btn-xs" href="?c=Config&a=obtenerDatosTiraje&cod='+data.idtiraje+'" > <i class="fa fa-edit"></i> Editar </button>';
            }}
        ]
    });
}


/* Editar datos del tipo de documento */
function editarTipoDoc(cod,desc,ser,num){
    $('#cod_td').val(cod);
    $('#serie').val(ser);
    $('#numero').val(num);
	$(".modal-title").html("<center>Documento: " + desc + "</center>");        
	$("#mdl-tipodoc").modal('show');
}

$('#mdl-tipodoc').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $('#frm-tipodoc').formValidation('resetForm', true);
});
