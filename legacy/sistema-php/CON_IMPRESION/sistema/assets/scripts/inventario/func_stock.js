$(function() {
    moment.locale('es');
    listar();
    $('#inventario').addClass("active");
    $('#i-stock').addClass("active");
});

$('#tipo_ins').change( function() {
    listar();
});

var listar = function(){
    function filterGlobal () {
        $('#table').DataTable().search( 
            $('#global_filter').val()
        ).draw();
    }

    var total = 0;
        table =	$('#table')
	    .DataTable({
            "destroy": true,
            "responsive": true,
            "dom": "<'row'<'col-sm-6'><'col-sm-6'>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
            "bSort":false,
    		"ajax":{
        		"method": "POST",
        		"url": "?c=Inventario&a=listar",
                "data": {
                    tipo_ins: $('#tipo_ins').val()
                }
    		},
            "columns":[
                {
                    "data": null,
                    "render": function ( data, type, row) {
                        if(data.id_tipo_ins == 1){
                            return '<label class="label label-warning">INSUMO</label>';
                        } else if(data.id_tipo_ins == 2){
                            return '<label class="label label-success">PRODUCTO</label>';
                        }
                    }
                },
                {"data": "Presentacion.cod_ins"},
                {"data": "Presentacion.nomb_ins"},
                {"data": "Presentacion.nomb_med"},
                {"data": null,"render": function ( data, type, row ) {
                    total = data.ent-data.sal;
                    return '<div class="text-success text-right">'+total.toFixed(6)+'</div>';
                }}
            ]
	});

    $('input.global_filter').on( 'keyup click', function () {
        filterGlobal();
    });
};