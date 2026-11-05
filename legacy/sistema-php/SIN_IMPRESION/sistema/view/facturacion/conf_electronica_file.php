<?php
require_once ("../../model/db.php"); // Contiene las variables de configuracion para conectar a la base de datos
require_once ("../../model/conexion.php"); // Contiene funcion que conecta a la base de datos

$fac_ele = $_POST['fac_ele'];
$usuariosol = $_POST['usuariosol'];
$clavesol = $_POST['clavesol'];
$clave = $_POST['clave'];
$ruc = $_POST['ruc'];
if ($fac_ele == 3 or $fac_ele == 1) {
    if (is_uploaded_file($_FILES['files']['tmp_name'])) {
        $ruta_destino = "../inicio/sunat/certificados/produccion/";
        $namefinal = $ruc . ".pfx"; // linea nueva devuelve la cadena sin espacios al principio o al final
        $uploadfile = $ruta_destino . $namefinal;
        if (move_uploaded_file($_FILES['files']['tmp_name'], $uploadfile)) {
            $dml = "update tm_empresa set fac_ele='" . $fac_ele . "',usuariosol='" . $usuariosol . "',clavesol='" . $clavesol . "',clave='" . $clave . "' where id_de=1";
            if (! mysqli_query($con, $dml)) {
                die("No se pudo actualizar.");
            } else {
                ?>
                <div class="alert alert-success alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <strong>Aviso!</strong> Datos y Archivo actualizado correctamente.
                </div>
                <?php 
                
            }
        }
    } else {
        $dml = "update tm_empresa set fac_ele='" . $fac_ele . "',usuariosol='" . $usuariosol . "',clavesol='" . $clavesol . "',clave='" . $clave . "' where id_de=1";
        if (! mysqli_query($con, $dml)) {
            die("No se pudo actualizar...".$dml);
        }
        ?>
        <div class="alert alert-success alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <strong>Aviso!</strong> Datos actualizado correctamente.
        </div>
        <?php 
    }
}

?>



