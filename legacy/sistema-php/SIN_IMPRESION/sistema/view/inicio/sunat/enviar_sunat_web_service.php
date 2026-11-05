<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include "validaciondedatos.php";
include "procesarcomprobante.php";
require_once("../../../model/rest.model.php");

class ActualizarVentaModel {
    
    private $conexionn;
    
    public function __CONSTRUCT()
    {
        try
        {
            $this->conexionn = Database::Conectar();
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function actualizarVentaAceptadoSunat($id_venta)
    {
        try
        {
            $sql = "UPDATE tm_venta SET aceptado = 'Aceptada' WHERE id_venta = ?";
            $this->conexionn->prepare($sql)
            ->execute(array($id_venta));
            $this->conexionn=null;
        } catch (Exception $e)
        {
            die($e->getMessage());
        }
    }
}

$datosEmpresa = $_SESSION["datosempresa"];
foreach($datosEmpresa as $reg) {
    $fac_ele = $reg['fac_ele'];
    $clave = $reg['clave'];
    $usuario_sol = $reg['usuariosol'];
    $pass_sol = $reg['clavesol'];
}

date_default_timezone_set('America/Lima');
include ("../../../constantes.php");

$enviar_todos = $_GET['enviar_todos'];
if ($enviar_todos == '1') {
    $all_fact = $_GET['all_fact'];
} else {
    $all_fact = $_GET['fac'];
}

$array_envios = explode(",", $all_fact);

foreach ($array_envios as $doc3) {
    // $doc3=$_GET['fac'];
    $dato = $doc3;
    $porciones = explode("-", $dato);
    
    $ruc1 = $porciones[0];
    $tip = $porciones[1];
    if ($tip == "01") {
        $estado_factura = 1;
    }
    if ($tip == "03") {
        $estado_factura = 2;
    }
    if ($tip == "07") {
        $estado_factura = 6;
    }
    if ($tip == "08") {
        $estado_factura = 5;
    }
    
    $fecha3 = date("d/m/Y H:i:s");
    
    $folio = $porciones[2];
    $numero_factura = $porciones[3] * 1;
    $id_venta = $porciones[4];
    $doc3="$porciones[0]-$porciones[1]-$porciones[2]-$porciones[3]";
    // ------------------ENVIAR XML SUNAT-------------------
    // NOMBRE DE ARCHIVO A PROCESAR.
    $NomArch = $doc3;
    $tipodeproceso = (isset($data['tipo_proceso'])) ? $data['tipo_proceso'] : $fac_ele;
    
    $content_firmas = 'certificados/';
    
    $nombre_archivo = $doc3;
    $array_cabecera['EMISOR_RUC'] = $ruc1;
    $array_cabecera['EMISOR_USUARIO_SOL'] = $usuario_sol;
    $array_cabecera['EMISOR_PASS_SOL'] = $pass_sol;
    if ($fac_ele == '1') {
        $ruta = "factura-firmada/" . $nombre_archivo;
        $ruta_cdr = "cdr/";
        $ruta_firma = '';
        $pass_firma = $clave;
        $ruta_ws = 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService';
    }
    
    if ($fac_ele == '3') {
        $ruta = "factura-firmada/" . $nombre_archivo;
        $ruta_cdr = "cdr/";
        $ruta_firma = $content_firmas . 'beta/firmabeta.pfx';
        $pass_firma = '123456';
        $ruta_ws = 'https://e-beta.sunat.gob.pe:443/ol-ti-itcpfegem-beta/billService';
        //         $ruta_ws = 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billservice';
    }
    
    $rutas = array();
    $rutas['nombre_archivo'] = $nombre_archivo;
    $rutas['ruta_xml'] = $ruta;
    $rutas['ruta_cdr'] = $ruta_cdr;
    $rutas['ruta_firma'] = $ruta_firma;
    $rutas['pass_firma'] = $pass_firma;
    $rutas['ruta_ws'] = $ruta_ws;
    
    $x = 0;
    $intento = CONF_CANTIDAD_REINTENTOS_WEBSERVICE_SUNAT;
    $procesarcomprobante = new Procesarcomprobante();
    do {
        $resp = $procesarcomprobante->procesar_factura1($array_cabecera, $rutas);
        $x ++;
    } while ($x <= $intento && ! ($resp['respuesta'] == 'ok'));
    
    $resp['ruta_xml'] = '';
    $resp['ruta_cdr'] = '';
    $resp['ruta_pdf'] = '';
    $resp['ruta_xml'] = "";
    $resp['url_xml'] = "";
    $resp['ruta_cdr'] = "";
      echo json_encode($resp);
    // exit();
    if ($resp['respuesta'] == 'ok') {
        $actualizarVentaModel = new ActualizarVentaModel();
        $datosVenta = $actualizarVentaModel->actualizarVentaAceptadoSunat($id_venta);
//         $sql_factura1 = mysqli_query($con, "update facturas set aceptado='Aceptada' where numero_factura='" . $numero_factura . "' and folio='" . $folio . "' and estado_factura='" . $estado_factura . "' and tienda='" . $tienda . "'");
        echo '<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 12pt; color: #000099; margin-top: 10px;">';
        echo 'Su documento electronico ha sido enviado satisfactoriamente.<br>';
        echo '<span style="color: #A70202;">Descargar CDR generado:<a href="pdf/documentos/cdr/R-' . $NomArch . '.XML" target="_blank">R-' . $NomArch . '.xml</a>(respuesta de la sunat)</span>';
        echo '</div>';
    } else {
        if ($resp['respuesta'] == 'error' && $resp['cod_sunat']=='soap-env:Client.1033') {
            $actualizarVentaModel = new ActualizarVentaModel();
            $datosVenta = $actualizarVentaModel->actualizarVentaAceptadoSunat($id_venta);
        }
        echo '<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 12pt; color: #000099; margin-top: 10px;">';
        echo 'Su documento electronico no ha sido enviado ocurrio o link de la Sunat caido.<br>';
        echo '</div>';
    }
}

?>

