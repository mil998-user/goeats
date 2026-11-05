<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include "../validaciondedatos.php";
include "../procesarcomprobante.php";
require_once ("../../../../model/rest.model.php");

class ActualizarVentaModel
{

    private $conexionn;

    public function __CONSTRUCT()
    {
        try {
            $this->conexionn = Database::Conectar();
        } catch (Exception $e) {
            die($e->getMessage());
        }
    }

    public function actualizarVentaAceptadoSunat($id_venta)
    {
        try {
            $sql = "UPDATE tm_venta SET aceptado = 'Aceptada' WHERE id_venta = ?";
            $this->conexionn->prepare($sql)->execute(array(
                $id_venta
            ));
            $this->conexionn = null;
        } catch (Exception $e) {
            die($e->getMessage());
        }
    }
}

$datosEmpresa = $_SESSION["datosempresa"];
foreach ($datosEmpresa as $reg) {
    $fac_ele = $reg['fac_ele'];
    $clave = $reg['clave'];
    $usuario_sol = $reg['usuariosol'];
    $pass_sol = $reg['clavesol'];
}

date_default_timezone_set('America/Lima');
include ("../../../../constantes.php");

$enviar_todos = $_GET['enviar_todos'];
if ($enviar_todos == '1') {
    $all_fact = $_GET['all_fact'];
} else {
    $all_fact = $_GET['fac'];
}

$array_envios = explode(",", $all_fact);

foreach ($array_envios as $doc3) {
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
    
    $factura_numero = str_replace(".XML","",$porciones[3]);
    
    $doc3 = "$porciones[0]-$porciones[1]-$porciones[2]-$factura_numero";
    $xml_mostrar = "R-$porciones[0]-$porciones[1]-$porciones[2]-$porciones[3]";
    // ------------------ENVIAR XML SUNAT-------------------
    // NOMBRE DE ARCHIVO A PROCESAR.
    $NomArch = $doc3;
    $tipodeproceso = (isset($data['tipo_proceso'])) ? $data['tipo_proceso'] : $fac_ele;

    $content_firmas = 'certificados/';

    $nombre_archivo = $doc3;
    $array_cabecera['EMISOR_RUC'] = $ruc1;
    $array_cabecera['TIPO_COMPROBANTE'] = $tip;
    $array_cabecera['SERIE_COMPROBANTE'] = $folio;
    $array_cabecera['NUMERO_COMPROBANTE'] = $numero_factura;
    $array_cabecera['EMISOR_USUARIO_SOL'] = $usuario_sol;
    $array_cabecera['EMISOR_PASS_SOL'] = $pass_sol;
    $ruta_cdr = __DIR__."/";

    $ruta_firma = '';
    $pass_firma = $clave;
    $ruta_ws = "https://e-factura.sunat.gob.pe/ol-it-wsconscpegem/billConsultService";

    $rutas = array();
    $rutas['nombre_archivo'] = $nombre_archivo;
    $rutas['ruta_cdr'] = $ruta_cdr;
    $rutas['ruta_firma'] = $ruta_firma;
    $rutas['pass_firma'] = $pass_firma;
    $rutas['ruta_ws'] = $ruta_ws;

    $x = 0;
    $intento = CONF_CANTIDAD_REINTENTOS_WEBSERVICE_SUNAT;
    $procesarcomprobante = new Procesarcomprobante();
    do {
        $resp = $procesarcomprobante->obtener_cdr($array_cabecera, $rutas);
        $x ++;
    } while ($x <= $intento && ! ($resp['respuesta'] == 'ok'));

    $resp['ruta_xml'] = '';
    $resp['ruta_cdr'] = '';
    $resp['ruta_pdf'] = '';
    $resp['ruta_xml'] = "";
    $resp['url_xml'] = "";
    $resp['ruta_cdr'] = "";

    $respuesta = json_encode($resp);
    if ($resp['respuesta'] == 'ok') {
        $doc_temp = "R-" . $doc3 . ".XML";

        $real_path = "cdr/" . $doc_temp;
        $aceptado1 = "";
        $fecha3 = "";

        if (file_exists($real_path)) {
            $xml = file_get_contents($real_path);
            // Obteniendo datos del archivo .XML
            $aceptado = "";
            $DOM = new DOMDocument('1.0', 'ISO-8859-1');
            $DOM->preserveWhiteSpace = FALSE;
            $DOM->loadXML($xml);

            // Obteniendo RUC.
            $DocXML = $DOM->getElementsByTagName('Description');
            foreach ($DocXML as $Nodo) {
                $aceptado = $Nodo->nodeValue;
            }

            $DocXML = $DOM->getElementsByTagName('ResponseDate');
            foreach ($DocXML as $Nodo) {
                $fecha3 = $Nodo->nodeValue;
            }
            $pos = strpos($aceptado, "aceptada");

            if ($pos === false) {
                $aceptado1 = "No aceptada";
            } else {
                $aceptado1 = "Aceptada";
                $fecha3 = date("Y-m-d H:i:s");
            }
        }
        $actualizarVentaModel = new ActualizarVentaModel();
        $datosVenta = $actualizarVentaModel->actualizarVentaAceptadoSunat($id_venta);
        echo "Datos Actualizados Correctamente.<br>";
        echo '<a href="' . $xml_mostrar . '" class="btn btn-danger btn-xs" title="Descargar CDR">Mostrar CDR</a>';
    } else {
        echo $respuesta;
    }
}

?>

