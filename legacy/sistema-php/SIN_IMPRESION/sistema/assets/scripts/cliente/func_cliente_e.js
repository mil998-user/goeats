$(function() {
    
    $('#clientes').addClass("active");
    
    $('#frm-cliente').formValidation({
        framework: 'bootstrap',
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

    $('input:radio[id=td_dni]').on('ifChecked', function(event){
        $(".block01").css("display","block");
        $(".block02").css("display","none");
        $(".block03").css("display","block");
        $(".block04").css("display","block");
        $(".block05").css("display","block");
        $(".block06").css("display","block");
        $(".block07").css("display","none");
    });

    $('input:radio[id=td_ruc]').on('ifChecked', function(event){
        $(".block01").css("display","none");
        $(".block02").css("display","block");
        $(".block03").css("display","none");
        $(".block04").css("display","none");
        $(".block05").css("display","none");
        $(".block06").css("display","none");
        $(".block07").css("display","block");
    });

    /* Consultar dni del nuevo cliente */
    $("#btnBuscarDni").click(function(event) {
        event.preventDefault();
        var dni = $("#dni").val();
        var url = "busqueda.php";
        $.ajax({                        
            type: "POST",                 
            url: url,                    
            data: "doc1="+ dni ,
            success: function(data)            
            {                        
               porciones = data.split('|'); 
               $("#ape_paterno").val(porciones[0]);
               $("#ape_materno").val(porciones[1]);
               $("#nombres").val(porciones[2]);
               $("#direccion").val('-');
               $('#frm-cliente').formValidation('revalidateField', 'nombres');
               $('#frm-cliente').formValidation('revalidateField', 'ape_paterno');
               $('#frm-cliente').formValidation('revalidateField', 'ape_materno');
               $('#frm-cliente').formValidation('revalidateField', 'direccion');
               if (porciones[0]=='' || porciones[0]=='  '){
                  alert("El documento ingresado no existe ");
                  document.getElementById("nombre_cliente").value = '';
               }                        
            }
      });
    });
    
    /* Consultar ruc del nuevo cliente */
    $("#btnBuscarRuc").click(function(event) {
        event.preventDefault();
        var ruc = $("#ruc").val();
        var url = "busqueda.php";
        $.ajax({                        
            type: "POST",                 
            url: url,                    
            data: "ruc="+ ruc ,
            success: function(data)            
            {                        
               porciones = data.split('|'); 
               $("#dni").val("");
               $("#ruc").val(ruc);
               $("#razon_social").val(porciones[0]);
               $("#direccion").val(porciones[1]);
               $('#frm-cliente').formValidation('revalidateField', 'razon_social');
               $('#frm-cliente').formValidation('revalidateField', 'direccion');
            }
      });
    });
});
