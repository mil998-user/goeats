$(function() {
    mensaje();
    $('#config').addClass("active");
});

var mensaje = function(){
    if ($("#m").val() == 'u'){
        toastr.info('Datos modificados correctamente');
    }
}