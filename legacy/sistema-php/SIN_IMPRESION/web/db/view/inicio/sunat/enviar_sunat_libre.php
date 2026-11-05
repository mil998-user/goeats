<?php
session_start();

include "../../../core/autoload.php";
include "../../../core/app/model/ConfiguracionData.php";
include "../../../core/app/model/PagoProcesoData.php";
include "../../../core/app/model/FacturasData.php";
include "../../../core/app/model/ProcesoVentaData.php";
include "../../../core/app/model/GastoData.php";
include "../../../core/app/model/ProcesoData.php";
include "../../../core/app/model/HabitacionData.php";
include "../../../core/app/model/TarifaData.php";
include "../../../core/app/model/ProductoData.php";

header('Content-Type: text/html; charset=UTF-8');
include ("funciones.php");
require "phpqrcode/qrlib.php";


$proceso = ProcesoData::getById($_REQUEST['id_venta']);

$sumatoria_s=0; 
$tmps = PagoProcesoData::getAllProceso($proceso->id); 
foreach($tmps as $p):  
     if($p->monto!=0){
        $facturas = new FacturasData();
        $facturas->nombre_producto = "Habitacion ".$proceso->getHabitacion()->nombre; 
        $facturas->descripcion = $proceso->getTarifa()->nombre;
        $facturas->cantidad = $p->cantidad;
        $facturas->precio = number_format($p->monto,2,'.',','); 
        $facturas->codigo = "H001";
        $facturas->id_proceso = $proceso->id;
        $facturas->add();
     };
    $sumatoria_s+=$p->monto*$p->cantidad; 
endforeach; 

$total=0;
$producto_pagado=0;
$productos = ProcesoVentaData::getByAll($proceso->id);
if(count($productos)>0){ 
    foreach($productos as $producto):

        $facturas = new FacturasData();
        $facturas->nombre_producto = $producto->getProducto()->nombre;
        $facturas->descripcion = $producto->getProducto()->descripcion;
        $facturas->cantidad = $producto->cantidad;
        $facturas->precio = number_format($producto->precio,2,'.',','); 
        $facturas->codigo = "P001";
        $facturas->id_proceso = $proceso->id;
        $facturas->add();

        $total=($producto->cantidad*$producto->precio)+$total; 
    endforeach; 
}; 
  

$total_extra=0;
$gastos = GastoData::getAllIngresoProceso($proceso->id);  
if(@count($gastos)>0){
    foreach($gastos as $gasto):

        $facturas = new FacturasData();
        $facturas->nombre_producto = $gasto->descripcion;
        $facturas->descripcion = "Gasto extra";
        $facturas->cantidad = 1;
        $facturas->precio = number_format($gasto->precio,2,'.',',');
        $facturas->codigo = "G001";
        $facturas->id_proceso = $proceso->id;
        $facturas->add();

        $total_extra+=$gasto->precio;
    endforeach; 
};


$totalfacura = ProcesoData::getById($proceso->id);
$totalfacura->total_factura = number_format($total_extra+$total+$sumatoria_s,2,'.',',');
$totalfacura->enviado = 1;
$totalfacura->updateTotalFactura();

class EnviarSunatModel {
    
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
    
    public function obtenerDatosVentaPorIdVenta($id_venta){
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM proceso where id = ?");
            $stm->execute(array($id_venta));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function listarDetalleVenta($cod_vent)
    {
        try
        {
            $cod = $cod_vent;
            $stm = $this->conexionn->prepare("SELECT * FROM facturas WHERE id_proceso = ? ");
            $stm->execute(array($cod));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
    
    public function obtenerDatosClientePorIdCliente($id_cliente){
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM persona where id = ?");
            $stm->execute(array($id_cliente));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
}


$igv = 0;
$configuracion = ConfiguracionData::getAllConfiguracion(); 
if(@count($configuracion)>0){ 

    $fac_ele = $configuracion->fac_ele;
    $clave = $configuracion->clave;
    $usuario_sol = $configuracion->usuariosol;
    $pass_sol = $configuracion->clavesol;
    $nombre_empresa = $configuracion->registro_empresarial;
    $departamento = "SAN MARTIN";
    $provincia = "SAN MARTIN";
    $distrito = "TARAPOTO";
    $ruc1 = $configuracion->rnc;
    $direccion = $configuracion->direccion;

    $igv=$configuracion->iva;
}else{

     $igv=0;                      
}


 
$enviarSunatModel = new EnviarSunatModel();
$id_venta = $_REQUEST['id_venta'];
$id_cliente = $_REQUEST['id_cliente'];

$datosVenta = $enviarSunatModel->obtenerDatosVentaPorIdVenta($id_venta);


foreach($datosVenta as $k => $d)
{
    $numero_factura = $d->nro_folio;
    $serie = $d->serie_doc;
    $fecha = $d->fecha_entrada;
    $tipo = $d->comprobante;
    $m_bolsa = 0;
    $igv = $igv;
}



$fecha = substr($fecha, 0, -9);

$nro_doc = "1";// tip0 de documento
$motivo = "1"; //codigo tipo motivo
$igv_1_18 = 1 + $igv; // valor del 1.18 para calcular base del total
//0=IGV, 1=EXONERADO
if ($igv == 0){
    $tip = 1;
} else {
    $tip = 0;
}

$razon_social = "";
$datosCliente = $enviarSunatModel->obtenerDatosClientePorIdCliente($id_cliente);
foreach($datosCliente as $k => $d)
{
    $ruc = $d->ruc;
    $dni = $d->documento;
    $razon_social = $d->razon_social;
    $nombres = $d->nombre;
}

if (!empty($razon_social)){
    $documento_usuario = $ruc;
    $tipo_documento_usuario = "6";
    $razon_social_usuario = $razon_social;
} else {
    $documento_usuario = $dni;
    $tipo_documento_usuario = "1";
    $razon_social_usuario = $nombres;
}



$cantidad1 = array();
$und_pro = array();
$precio_unitario = array();
$producto = array();
$codigo = array();

$sumador_total = 0;
$nums = 1;
$suma = 0;

$listaDetalleVenta = $enviarSunatModel->listarDetalleVenta($id_venta);

foreach($listaDetalleVenta as $k => $d)
{
    // foreach($data->Detalle as $d){
    if($d->cantidad > 0){
        $id_producto = $d->id;
        $cantidad = $d->cantidad;
        $nombre_producto = $d->nombre_producto;
        $pres_prod = $d->descripcion;        
        $precio_venta = $d->precio;
        $precio_venta_f = number_format($precio_venta, 2); // Formateo variables
        $precio_venta_r = str_replace(",", "", $precio_venta_f); // Reemplazo las comas
        $precio_total = $precio_venta_r * $cantidad;
        $precio_total_f = number_format($precio_total, 2); // Precio total formateado
        $precio_total_r = str_replace(",", "", $precio_total_f); // Reemplazo las comas
        $sumador_total += $precio_total_r; // Sumador
        $suma = $suma + 1;
        $d = 0;
        $und_pro1 = "KGM"; 
        $cantidad1[$nums] = $cantidad.".00";
        $und_pro[$nums] = $und_pro1;
        $precio_unitario[$nums] = $precio_venta;
        $producto[$nums] = $pres_prod;
        $nombre_producto_array[$nums] = $nombre_producto;
        $codigo[$nums] = "P001"; //$codigo_producto
        $nums ++;
    }
    
}

$sumador_total = $sumador_total + number_format($m_bolsa, 2) ;

if ($tipo <= 3 or $tipo == 5 or $tipo == 6) {
    if ($tipo == 1) {
        $tipo_documento = "03"; // BOLETA
        $serie = "B".$serie;
    } 
    if ($tipo == 2) {
        $tipo_documento = "01"; // FACTURA
        $serie = "F".$serie;
    }
    if ($tipo == 3) {
        $tipo_documento = "02"; // TICKET
        $serie = "T".$serie;
    }
    if ($tipo == 5) {
        $tipo_documento = "08"; // NOTA DE DEBITO
    }
    if ($tipo == 6) {
        $tipo_documento = "07"; // NOTA DE CREDITO
    }
    
    $cabecera = array();
    // DATOS PARA LOS XML FACTURA/BOLETA/NOTA DE CREDITO/ NOTA DE DEBITO
    // EMISOR
    $cabecera["NRO_DOCUMENTO_EMPRESA"] = $ruc1;
    
    $numero_factura1 = str_pad($numero_factura, 8, "0", STR_PAD_LEFT);
    
    $cabecera["NRO_COMPROBANTE"] = $serie . "-" . $numero_factura1;
    $tipo_doc = $tipo_documento;
    $cabecera["FECHA_DOCUMENTO"] = $fecha;
    $cabecera["FECHA_VTO"] = $fecha;
    $cabecera["COD_TIPO_DOCUMENTO"] = $tipo_documento;
    $cabecera["TOTAL_LETRAS"] = "";
    $cabecera["NRO_OTR_COMPROBANTE"] = "";
    $cabecera["NRO_GUIA_REMISION"] = "";
    $cabecera["TIPO_DOCUMENTO_EMPRESA"] = 6;
    $moneda = "PEN";
    $cabecera["RAZON_SOCIAL_EMPRESA"] = $nombre_empresa;
    $cabecera["NOMBRE_COMERCIAL_EMPRESA"] = $nombre_empresa;
    $cabecera["DEPARTAMENTO_EMPRESA"] = $departamento;
    $cabecera["PROVINCIA_EMPRESA"] = $provincia;
    $cabecera["DISTRITO_EMPRESA"] = $distrito;
    $cabecera["DIRECCION_EMPRESA"] = $direccion;
    $cabecera["CONTACTO_EMPRESA"] = "";
    $cabecera["COD_PAIS_CLIENTE"] = "PE";
    $doc_emisor = 6;
    // Solo para NOTA DE CREDITO Y NOTA DE DEBITO
    $cabecera["NRO_DOCUMENTO_MODIFICA"] = $nro_doc;
    $cabecera["COD_TIPO_MOTIVO"] = $motivo;
    $cabecera["TIPO_COMPROBANTE_MODIFICA"] = tipo_comp($nro_doc);
    
    $r = "";
    if ($tipo == 6) {
        if ($motivo == "01") {
            $r = "ANULACION DE LA OPERACION";
        }
        if ($motivo == "02") {
            $r = "ANULACION POR ERROR EN EL RUC";
        }
        if ($motivo == "03") {
            $r = "CORRECION POR ERROR EN LA DESCRIPCION";
        }
        if ($motivo == "04") {
            $r = "DESCUENTO GLOBAL";
        }
        if ($motivo == "05") {
            $r = "DESCUENTO POR ITEM";
        }
        if ($motivo == "06") {
            $r = "DEVOLUCION TOTAL";
        }
        if ($motivo == "07") {
            $r = "DEVOLUCION POR ITEM";
        }
        if ($motivo == "08") {
            $r = "BONIFICACION";
        }
        if ($motivo == "09") {
            $r = "DISMINUCION EN EL VALOR";
        }
    }
    if ($tipo == 5) {
        if ($motivo == "01") {
            $r = "INTERES POR MORA";
        }
        if ($motivo == "02") {
            $r = "AUMENTO EN EL VALOR";
        }
        if ($motivo == "03") {
            $r = "PENALIDADES";
        }
    }
    $cabecera["DESCRIPCION_MOTIVO"] = $r;
    
    // DATOS DEL CLIENTE
    $cabecera["NRO_DOCUMENTO_CLIENTE"] = $documento_usuario;
    $cabecera["RAZON_SOCIAL_CLIENTE"] = $razon_social_usuario;
    $cabecera["COD_UBIGEO_CLIENTE"] = "";
    $cabecera["TIPO_DOCUMENTO_CLIENTE"] = $tipo_documento_usuario;
    $cabecera["DEPARTAMENTO_CLIENTE"] = "";
    $cabecera["PROVINCIA_CLIENTE"] = "";
    $cabecera["DISTRITO_CLIENTE"] = "";
    $cabecera["DIRECCION_CLIENTE"] = "";
    $cabecera["COD_PAIS_CLIENTE"] = "PE";
    $cabecera["COD_MONEDA"] = "PEN";
    $cabecera["TOTAL_ISC"] = 0;
    $cabecera["TOTAL_EXPORTACION"] = 0;
    $cabecera["TOTAL_GRATUITAS"] = 0;
    $cabecera["COD_TIPO_OPERACION"]=10;
    $cabecera["TOTAL_EXONERADAS"] = 0;
    $cabecera["TOTAL_INAFECTA"] = 0;
    $cabecera["TOTAL_OTR_IMP"] = 0;
    $total = round($sumador_total, 2);
    
    if ($tip == 0) {
        $cabecera["TOTAL_GRAVADAS"] = round($sumador_total / $igv_1_18, 2);
        $cabecera["TOTAL_IGV"] = round(($sumador_total / $igv_1_18) * $igv, 2);
        $cabecera["SUB_TOTAL"] = round($sumador_total / $igv_1_18, 2);
        $cabecera["TOTAL"] = round($sumador_total, 2);
        $cabecera["TOTAL_DESCUENTO"] = 0;
        $mto_igv = round(($sumador_total / $igv_1_18) * $igv, 2);
    }
    if ($tip == 1) {
        $cabecera["TOTAL_GRAVADAS"] = round($sumador_total / $igv_1_18, 2);
        $cabecera["TOTAL_IGV"] = "0.00";
        $cabecera["SUB_TOTAL"] = round($sumador_total, 2);
        $cabecera["TOTAL"] = round($sumador_total, 2);
        $cabecera["TOTAL_DESCUENTO"] = 0;
        $cabecera["TOTAL_EXONERADAS"] = round($sumador_total, 2);
        $mto_igv = 0;
    }
    
    // CODIGO QR
    
    /**
     * *** FACTURA: DATOS OBLIGATORIOS PARA EL CÓDIGO QR ****
     */
    /* RUC | TIPO DE DOCUMENTO | SERIE | NUMERO | MTO TOTAL IGV | MTO TOTAL DEL COMPROBANTE | FECHA DE EMISION |TIPO DE DOCUMENTO ADQUIRENTE | NUMERO DE DOCUMENTO ADQUIRENTE | */
    $text_qr = "$ruc1|$tipo_documento|$serie|$numero_factura1|$mto_igv|$total|$fecha|$tipo_documento_usuario|$documento_usuario|";
    $ruta_qr = "qr/" . $id_venta . ".png";
    QRcode::png($text_qr, $ruta_qr, 'Q', 15, 0);
  
    // CREACION DE XML DE DOCUMENTO FACTURA, BOLETA
    $doc = new DOMDocument();
    $doc->formatOutput = FALSE;
    $doc->preserveWhiteSpace = TRUE;
    $doc->encoding = 'utf-8';
    $nums1 = $nums - 1;
    if ($tipo <= 2) { 
        $xmlCPE = 
        '<?xml version="1.0" encoding="utf-8"?>
        <Invoice xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
            <ext:UBLExtensions>
                <ext:UBLExtension>
                    <ext:ExtensionContent>
                    </ext:ExtensionContent>
                </ext:UBLExtension>
            </ext:UBLExtensions>
            <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
            <cbc:CustomizationID schemeAgencyName="PE:SUNAT">2.0</cbc:CustomizationID>
            <cbc:ProfileID schemeName="Tipo de Operacion" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51">' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:ProfileID>
            <cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
            <cbc:IssueDate>' . $cabecera["FECHA_DOCUMENTO"] . '</cbc:IssueDate>
            <cbc:IssueTime>00:00:00</cbc:IssueTime>
            <cbc:DueDate>' . $cabecera["FECHA_VTO"] . '</cbc:DueDate>
            <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listID="0101" name="Tipo de Operacion" listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51">' . $cabecera["COD_TIPO_DOCUMENTO"] . '</cbc:InvoiceTypeCode>';
            if ($cabecera["TOTAL_LETRAS"] != "") {
                $xmlCPE = $xmlCPE . '<cbc:Note languageLocaleID="1000">' . $cabecera["TOTAL_LETRAS"] . '</cbc:Note>';
            }
            $xmlCPE = $xmlCPE . 
            '<cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">' . $cabecera["COD_MONEDA"] . '</cbc:DocumentCurrencyCode>
            <cbc:LineCountNumeric>' . $nums1 . '</cbc:LineCountNumeric>';
            if ($cabecera["NRO_OTR_COMPROBANTE"] != "") {
                $xmlCPE = $xmlCPE . 
                '<cac:OrderReference>
                    <cbc:ID>' . $cabecera["NRO_OTR_COMPROBANTE"] . '</cbc:ID>
                </cac:OrderReference>';
            }
            if ($cabecera["NRO_GUIA_REMISION"] != "") {
                $xmlCPE = $xmlCPE . 
                '<cac:DespatchDocumentReference>
                    <cbc:ID>' . $cabecera["NRO_GUIA_REMISION"] . '</cbc:ID>
                    <cbc:IssueDate>' . $cabecera["FECHA_GUIA_REMISION"] . '</cbc:IssueDate>
                    <cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">' . $cabecera["COD_GUIA_REMISION"] . '</cbc:DocumentTypeCode>
                </cac:DespatchDocumentReference>';
            }
            $xmlCPE = $xmlCPE . 
                '<cac:Signature>
                <cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
                <cac:SignatoryParty>
                    <cac:PartyIdentification>
                        <cbc:ID>' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
                    </cac:PartyIdentification>
                    <cac:PartyName>
                        <cbc:Name>' . $cabecera["RAZON_SOCIAL_EMPRESA"] . '</cbc:Name>
                    </cac:PartyName>
                </cac:SignatoryParty>
                <cac:DigitalSignatureAttachment>
                    <cac:ExternalReference>
                        <cbc:URI>#' . $cabecera["NRO_COMPROBANTE"] . '</cbc:URI>
                    </cac:ExternalReference>
                </cac:DigitalSignatureAttachment>
            </cac:Signature>
            <cac:AccountingSupplierParty>
                <cac:Party>
                    <cac:PartyIdentification>
                        <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
                    </cac:PartyIdentification>
                    <cac:PartyName>
                        <cbc:Name><![CDATA[' . $cabecera["NOMBRE_COMERCIAL_EMPRESA"] . ']]></cbc:Name>
                    </cac:PartyName>
                    <cac:PartyTaxScheme>
                        <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
                        <cbc:CompanyID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:CompanyID>
                        <cac:TaxScheme>
                            <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
                        </cac:TaxScheme>
                    </cac:PartyTaxScheme>
                    <cac:PartyLegalEntity>
                        <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
                        <cac:RegistrationAddress>
                            <cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI" />
                            <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
                            <cbc:CityName><![CDATA[' . $cabecera["DEPARTAMENTO_EMPRESA"] . ']]></cbc:CityName>
                            <cbc:CountrySubentity><![CDATA[' . $cabecera["PROVINCIA_EMPRESA"] . ']]></cbc:CountrySubentity>
                            <cbc:District><![CDATA[' . $cabecera["DISTRITO_EMPRESA"] . ']]></cbc:District>
                            <cac:AddressLine>
                                <cbc:Line><![CDATA[' . $cabecera["DIRECCION_EMPRESA"] . ']]></cbc:Line>
                            </cac:AddressLine>
                            <cac:Country>
                                <cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">' . "PE" . '</cbc:IdentificationCode>
                            </cac:Country>
                        </cac:RegistrationAddress>
                    </cac:PartyLegalEntity>
                    <cac:Contact>
                        <cbc:Name><![CDATA[' . $cabecera["CONTACTO_EMPRESA"] . ']]></cbc:Name>
                    </cac:Contact>
                </cac:Party>
            </cac:AccountingSupplierParty>
            <cac:AccountingCustomerParty>
                <cac:Party>
                    <cac:PartyIdentification>
                        <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
                    </cac:PartyIdentification>
                    <cac:PartyName>
                        <cbc:Name><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:Name>
                    </cac:PartyName>
                    <cac:PartyTaxScheme>
                        <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
                        <cbc:CompanyID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:CompanyID>
                        <cac:TaxScheme>
                            <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
                        </cac:TaxScheme>
                    </cac:PartyTaxScheme>
                    <cac:PartyLegalEntity>
                        <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
                        <cac:RegistrationAddress>
                            <cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI">' . $cabecera["COD_UBIGEO_CLIENTE"] . '</cbc:ID>
                            <cbc:CityName><![CDATA[' . $cabecera["DEPARTAMENTO_CLIENTE"] . ']]></cbc:CityName>
                            <cbc:CountrySubentity><![CDATA[' . $cabecera["PROVINCIA_CLIENTE"] . ']]></cbc:CountrySubentity>
                            <cbc:District><![CDATA[' . $cabecera["DISTRITO_CLIENTE"] . ']]></cbc:District>
                            <cac:AddressLine>
                                <cbc:Line><![CDATA[' . $cabecera["DIRECCION_CLIENTE"] . ']]></cbc:Line>
                            </cac:AddressLine>
                            <cac:Country>
                                <cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">' . $cabecera["COD_PAIS_CLIENTE"] . '</cbc:IdentificationCode>
                            </cac:Country>
                        </cac:RegistrationAddress>
                    </cac:PartyLegalEntity>
                </cac:Party>
            </cac:AccountingCustomerParty>
            <cac:AllowanceCharge>
                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                <cbc:AllowanceChargeReasonCode listName="Cargo/descuento" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo53">02</cbc:AllowanceChargeReasonCode>
                <cbc:MultiplierFactorNumeric>0.00</cbc:MultiplierFactorNumeric>
                <cbc:Amount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:Amount>
                <cbc:BaseAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:BaseAmount>
            </cac:AllowanceCharge>
    
            <cac:TaxTotal>
                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>';
                if ($tip == 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRAVADAS"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">1000</cbc:ID>
                                <cbc:Name>IGV</cbc:Name>
                                <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                if ($cabecera["TOTAL_ISC"] > 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_ISC"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_ISC"] . '</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">2000</cbc:ID>
                                <cbc:Name>ISC</cbc:Name>
                                <cbc:TaxTypeCode>EXC</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                // CAMPO NUEVO
                if ($cabecera["TOTAL_EXPORTACION"] > 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_EXPORTACION"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">G</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9995</cbc:ID>
                                <cbc:Name>EXP</cbc:Name>
                                <cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                if ($cabecera["TOTAL_GRATUITAS"] > 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRATUITAS"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">Z</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9996</cbc:ID>
                                <cbc:Name>GRA</cbc:Name>
                                <cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                if ($cabecera["TOTAL_EXONERADAS"] > 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_EXONERADAS"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">E</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9997</cbc:ID>
                                <cbc:Name>EXO</cbc:Name>
                                <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                if ($cabecera["TOTAL_INAFECTA"] > 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_INAFECTA"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">O</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9998</cbc:ID>
                                <cbc:Name>INAFECTO</cbc:Name>
                                <cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                if ($cabecera["TOTAL_OTR_IMP"] > 0) {
                    $xmlCPE = $xmlCPE . 
                    '<cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_OTR_IMP"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_OTR_IMP"] . '</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
                            <cac:TaxScheme>
                                <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">9999</cbc:ID>
                                <cbc:Name>OTR</cbc:Name>
                                <cbc:TaxTypeCode>OTH</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>';
                }
                // TOTAL=GRAVADA+IGV+EXONERADA
                // NO ENTRA GRATUITA(INAFECTA) NI DESCUENTO
                // SUB_TOTAL=PRECIO(SIN IGV) * CANTIDAD
                $xmlCPE = $xmlCPE . 
            '</cac:TaxTotal>
            <cac:LegalMonetaryTotal>
                <cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["SUB_TOTAL"] . '</cbc:LineExtensionAmount>
                <cbc:TaxInclusiveAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:TaxInclusiveAmount>
                <cbc:AllowanceTotalAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_DESCUENTO"] . '</cbc:AllowanceTotalAmount>
                <cbc:ChargeTotalAmount currencyID="' . $cabecera["COD_MONEDA"] . '">0.00</cbc:ChargeTotalAmount>
                <cbc:PayableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:PayableAmount>
            </cac:LegalMonetaryTotal>';
    
            //===========================================================
            // LISTA DE PRODUCTOS
            //===========================================================
            //nums = cantidad de productos
            for ($i = 1; $i <= $nums - 1; $i ++) {
                $cabecera["CANTIDAD_DET"] = (int) ($cantidad1[$i]);
                $cabecera["UNIDAD_MEDIDA"] = $und_pro[$i];
                $cabecera["PRECIO_TIPO_CODIGO"] = "01";
                $cabecera["COD_TIPO_OPERACION"] = 10;
                $cabecera["POR_IGV"] = $igv;
                $cabecera["DESCRIPCION_DET"] = $producto[$i];
                $cabecera["NOMBRE_PRODUCTO_ARRAY"] = $nombre_producto_array[$i];
                
                $cabecera["CODIGO_DET"] = $codigo[$i];
                $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
                
                if ($tip == 0) {
                    $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]) / $igv_1_18, 2);
                    $cabecera["IGV"] = round(($igv * $cantidad1[$i] * $precio_unitario[$i]) / $igv_1_18, 2);
                    $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i] / $igv_1_18, 2);
                }
                if ($tip == 1) {
                    $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]), 2);
                    $cabecera["IGV"] = "0.00";
                    $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i], 2);
                }
                $xmlCPE = $xmlCPE . 
                '<cac:InvoiceLine>
                    <cbc:ID>' . $i . '</cbc:ID>
                    <cbc:InvoicedQuantity unitCode="' . $cabecera["UNIDAD_MEDIDA"] . '" unitCodeListID="UN/ECE rec 20" unitCodeListAgencyName="United Nations Economic Commission for Europe">' . $cabecera["CANTIDAD_DET"] . '</cbc:InvoicedQuantity>
                    <cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:LineExtensionAmount>
                    <cac:PricingReference>
                        <cac:AlternativeConditionPrice>
                            <cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
                            <cbc:PriceTypeCode listName="Tipo de Precio" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">' . $cabecera["PRECIO_TIPO_CODIGO"] . '</cbc:PriceTypeCode>
                        </cac:AlternativeConditionPrice>
                    </cac:PricingReference>';
                    $xmlCPE = $xmlCPE .
                    '<cac:TaxTotal>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>';
                    
                        if ($cabecera["NOMBRE_PRODUCTO_ARRAY"] =="BOLSA"){
                            //IMPUESTO ICBPER
                            $xmlCPE = $xmlCPE .
                            '<cac:TaxSubtotal>
                                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxAmount>
                                <cbc:BaseUnitMeasure unitCode="NIU">'. $cabecera["CANTIDAD_DET"] .'</cbc:BaseUnitMeasure>
                                <cac:TaxCategory>
                                    <cbc:PerUnitAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PerUnitAmount>
                                    <cac:TaxScheme>
                                        <cbc:ID schemeAgencyName="PE:SUNAT" schemeName="Codigo de tributos" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05">7152</cbc:ID>
                                        <cbc:Name>ICBPER</cbc:Name>
                                        <cbc:TaxTypeCode>OTH</cbc:TaxTypeCode>
                                    </cac:TaxScheme>
                                </cac:TaxCategory>
                            </cac:TaxSubtotal>';
                        }
                        if ($tip == 0) {
                            $xmlCPE = $xmlCPE . 
                            '<cac:TaxSubtotal>
                                <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
                                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                                <cac:TaxCategory>
                                    <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
                                    <cbc:Percent>' . $cabecera["POR_IGV"] * 100 . '</cbc:Percent>
                                    <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="SUNAT:Codigo de Tipo de Afectación del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:TaxExemptionReasonCode>
                                    <cac:TaxScheme>
                                        <cbc:ID schemeID="UN/ECE 5153" schemeName="Tax Scheme Identifier" schemeAgencyName="United Nations Economic Commission for Europe">1000</cbc:ID>
                                        <cbc:Name>IGV</cbc:Name>
                                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                                    </cac:TaxScheme>
                                </cac:TaxCategory>
                            </cac:TaxSubtotal>';
                        }
                        if ($tip == 1) {
                            $xmlCPE = $xmlCPE .
                            '<cac:TaxSubtotal>
                                <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
                                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                                <cac:TaxCategory>
                                    <cbc:Percent>'. $cabecera["POR_IGV"] * 100 .'</cbc:Percent>
                                    <cbc:TaxExemptionReasonCode>20</cbc:TaxExemptionReasonCode>
                                    <cac:TaxScheme>
                                        <cbc:ID>9997</cbc:ID>
                                        <cbc:Name>EXO</cbc:Name>
                                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                                    </cac:TaxScheme>
                                </cac:TaxCategory>
                            </cac:TaxSubtotal>';
                        }
                    $xmlCPE = $xmlCPE . 
                    '</cac:TaxTotal>
                    <cac:Item>
                        <cbc:Description><![CDATA[' . replace_invalid_caracters((isset($cabecera["DESCRIPCION_DET"])) ? $cabecera["DESCRIPCION_DET"] : "") . ']]></cbc:Description>
                        <cac:SellersItemIdentification>
                            <cbc:ID><![CDATA[' . replace_invalid_caracters((isset($cabecera["CODIGO_DET"])) ? $cabecera["CODIGO_DET"] : "") . ']]></cbc:ID>
                        </cac:SellersItemIdentification>
                    </cac:Item>
                    <cac:Price>
                        <cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_SIN_IGV_DET"] . '</cbc:PriceAmount>
                    </cac:Price>
                </cac:InvoiceLine>';
            }
            $xmlCPE = $xmlCPE . 
        '</Invoice>';
    }
    
    
    if ($tipo == 6) { // XML Nota de Credito
        $xmlCPE = '<?xml version="1.0" encoding="UTF-8"?>
        <CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <ext:UBLExtensions>
                <ext:UBLExtension>
                    <ext:ExtensionContent>
                    </ext:ExtensionContent>
                </ext:UBLExtension>
            </ext:UBLExtensions>
            <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
            <cbc:CustomizationID>2.0</cbc:CustomizationID>
            <cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
            <cbc:IssueDate>' . $cabecera["FECHA_DOCUMENTO"] . '</cbc:IssueDate>
            <cbc:IssueTime>00:00:00</cbc:IssueTime>
            <cbc:DocumentCurrencyCode>' . $cabecera["COD_MONEDA"] . '</cbc:DocumentCurrencyCode>
            <cac:DiscrepancyResponse>
                <cbc:ReferenceID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ReferenceID>
                <cbc:ResponseCode>' . $cabecera["COD_TIPO_MOTIVO"] . '</cbc:ResponseCode>
                <cbc:Description><![CDATA[' . $cabecera["DESCRIPCION_MOTIVO"] . ']]></cbc:Description>
            </cac:DiscrepancyResponse>
            <cac:BillingReference>
                <cac:InvoiceDocumentReference>
                    <cbc:ID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ID>
                    <cbc:DocumentTypeCode>' . $cabecera["TIPO_COMPROBANTE_MODIFICA"] . '</cbc:DocumentTypeCode>
                </cac:InvoiceDocumentReference>
            </cac:BillingReference>
            <cac:Signature>
                <cbc:ID>IDSignST</cbc:ID>
                <cac:SignatoryParty>
                    <cac:PartyIdentification>
                        <cbc:ID>' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
                    </cac:PartyIdentification>
                    <cac:PartyName>
                        <cbc:Name><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:Name>
                    </cac:PartyName>
                </cac:SignatoryParty>
                <cac:DigitalSignatureAttachment>
                    <cac:ExternalReference>
                        <cbc:URI>#SignatureSP</cbc:URI>
                    </cac:ExternalReference>
                </cac:DigitalSignatureAttachment>
            </cac:Signature>
            <cac:AccountingSupplierParty>
                <cac:Party>
                    <cac:PartyIdentification>
                        <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
                    </cac:PartyIdentification>
                    <cac:PartyName>
                        <cbc:Name><![CDATA[' . $cabecera["NOMBRE_COMERCIAL_EMPRESA"] . ']]></cbc:Name>
                    </cac:PartyName>
                    <cac:PartyLegalEntity>
                        <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
                        <cac:RegistrationAddress>
                            <cbc:AddressTypeCode>0001</cbc:AddressTypeCode>
                        </cac:RegistrationAddress>
                    </cac:PartyLegalEntity>
                </cac:Party>
            </cac:AccountingSupplierParty>
            <cac:AccountingCustomerParty>
                <cac:Party>
                    <cac:PartyIdentification>
                        <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
                    </cac:PartyIdentification>
                    <cac:PartyLegalEntity>
                    <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
                    </cac:PartyLegalEntity>
                </cac:Party>
            </cac:AccountingCustomerParty>
            <cac:TaxTotal>
                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
                <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRAVADAS"] . '</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
                    <cac:TaxCategory>
                        <cac:TaxScheme>
                            <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">1000</cbc:ID>
                            <cbc:Name>IGV</cbc:Name>
                            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                        </cac:TaxScheme>
                    </cac:TaxCategory>
                </cac:TaxSubtotal>
            </cac:TaxTotal>
            <cac:LegalMonetaryTotal>
                <cbc:PayableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:PayableAmount>
            </cac:LegalMonetaryTotal>';
                // NOTA DE CREDITO
                for ($i = 1; $i <= $nums - 1; $i ++) {
                    $cabecera["CANTIDAD_DET"] = $cantidad1[$i];
                    $cabecera["UNIDAD_MEDIDA"] = $und_pro[$i];
                    $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]) / $igv_1_18, 2);
                    $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
                    $cabecera["PRECIO_TIPO_CODIGO"] = "01";
                    $cabecera["IGV"] = round(($igv * $cantidad1[$i] * $precio_unitario[$i]) / $igv_1_18, 2);
                    $cabecera["POR_IGV"] = 18.00;
                    $cabecera["COD_TIPO_OPERACION"] = 10;
                    $cabecera["DESCRIPCION_DET"] = $producto[$i];
                    $cabecera["CODIGO_DET"] = $codigo[$i];
                    $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i] / $igv_1_18, 2);
                    
                    $xmlCPE = $xmlCPE . '<cac:CreditNoteLine>
                <cbc:ID>' . $i . '</cbc:ID>
                <cbc:CreditedQuantity unitCode="' . $cabecera["UNIDAD_MEDIDA"] . '">' . $cabecera["CANTIDAD_DET"] . '</cbc:CreditedQuantity>
                <cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:LineExtensionAmount>
                <cac:PricingReference>
                    <cac:AlternativeConditionPrice>
                    <cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
                        <cbc:PriceTypeCode>' . $cabecera["PRECIO_TIPO_CODIGO"] . '</cbc:PriceTypeCode>
                    </cac:AlternativeConditionPrice>
                </cac:PricingReference>
                <cac:TaxTotal>
                    <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                    <cac:TaxSubtotal>
                        <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
                        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                        <cac:TaxCategory>
                            <cbc:Percent>' . $cabecera["POR_IGV"] . '</cbc:Percent>
                            <cbc:TaxExemptionReasonCode>' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:TaxExemptionReasonCode>
                            <cac:TaxScheme>
                                <cbc:ID>1000</cbc:ID>
                                <cbc:Name>IGV</cbc:Name>
                                <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                            </cac:TaxScheme>
                        </cac:TaxCategory>
                    </cac:TaxSubtotal>
                </cac:TaxTotal>
                <cac:Item>
                    <cbc:Description><![CDATA[' . replace_invalid_caracters((isset($cabecera["DESCRIPCION_DET"])) ? $cabecera["DESCRIPCION_DET"] : "") . ']]></cbc:Description>
                    <cac:SellersItemIdentification>
                        <cbc:ID><![CDATA[' . replace_invalid_caracters((isset($cabecera["CODIGO_DET"])) ? $cabecera["CODIGO_DET"] : "") . ']]></cbc:ID>
                    </cac:SellersItemIdentification>
                </cac:Item>
                <cac:Price>
                    <cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
                </cac:Price>
            </cac:CreditNoteLine>';
        }
        
        $xmlCPE = $xmlCPE . '</CreditNote>';
    }

    if ($tipo == 5) { // XML Nota de Débito
        $xmlCPE = '<?xml version="1.0" encoding="UTF-8"?>
<DebitNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>' . $cabecera["NRO_COMPROBANTE"] . '</cbc:ID>
    <cbc:IssueDate>' . $cabecera["FECHA_DOCUMENTO"] . '</cbc:IssueDate>
    <cbc:IssueTime>00:00:00</cbc:IssueTime>
    <cbc:DocumentCurrencyCode>' . $cabecera["COD_MONEDA"] . '</cbc:DocumentCurrencyCode>
    <cac:DiscrepancyResponse>
        <cbc:ReferenceID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ReferenceID>
        <cbc:ResponseCode>' . $cabecera["COD_TIPO_MOTIVO"] . '</cbc:ResponseCode>
        <cbc:Description><![CDATA[' . $cabecera["DESCRIPCION_MOTIVO"] . ']]></cbc:Description>
    </cac:DiscrepancyResponse>
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>' . $cabecera["NRO_DOCUMENTO_MODIFICA"] . '</cbc:ID>
            <cbc:DocumentTypeCode>' . $cabecera["TIPO_COMPROBANTE_MODIFICA"] . '</cbc:DocumentTypeCode>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>
    <cac:Signature>
        <cbc:ID>IDSignST</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyIdentification>
                <cbc:ID>' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#SignatureSP</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_EMPRESA"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_EMPRESA"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[' . $cabecera["NOMBRE_COMERCIAL_EMPRESA"] . ']]></cbc:Name>
            </cac:PartyName>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_EMPRESA"] . ']]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:AddressTypeCode>0001</cbc:AddressTypeCode>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="' . $cabecera["TIPO_DOCUMENTO_CLIENTE"] . '" schemeName="SUNAT:Identificador de Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">' . $cabecera["NRO_DOCUMENTO_CLIENTE"] . '</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
<cbc:RegistrationName><![CDATA[' . $cabecera["RAZON_SOCIAL_CLIENTE"] . ']]></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
        <cac:TaxSubtotal>
<cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_GRAVADAS"] . '</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL_IGV"] . '</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:RequestedMonetaryTotal>
<cbc:PayableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["TOTAL"] . '</cbc:PayableAmount>
    </cac:RequestedMonetaryTotal>';
        
        for ($i = 1; $i <= $nums - 1; $i ++) {
            $cabecera["CANTIDAD_DET"] = $cantidad1[$i];
            $cabecera["UNIDAD_MEDIDA"] = $und_pro[$i];
            $cabecera["IMPORTE_DET"] = round(($cantidad1[$i] * $precio_unitario[$i]) / $igv_1_18, 2);
            $cabecera["PRECIO_DET"] = round($precio_unitario[$i], 2);
            $cabecera["PRECIO_TIPO_CODIGO"] = "01";
            $cabecera["IGV"] = round(($igv * $cantidad1[$i] * $precio_unitario[$i]) / $igv_1_18, 2);
            $cabecera["POR_IGV"] = 18.00;
            $cabecera["COD_TIPO_OPERACION"] = 10;
            $cabecera["DESCRIPCION_DET"] = $producto[$i];
            $cabecera["CODIGO_DET"] = $codigo[$i];
            $cabecera["PRECIO_SIN_IGV_DET"] = round($precio_unitario[$i] / $igv_1_18, 2);
            $xmlCPE = $xmlCPE . '
    <cac:DebitNoteLine>
        <cbc:ID>' . $i . '</cbc:ID>
<cbc:DebitedQuantity unitCode="' . $cabecera["UNIDAD_MEDIDA"] . '">' . $cabecera["CANTIDAD_DET"] . '</cbc:DebitedQuantity>
<cbc:LineExtensionAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:LineExtensionAmount>
        <cac:PricingReference>
            <cac:AlternativeConditionPrice>
<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
<cbc:PriceTypeCode>' . $cabecera["PRECIO_TIPO_CODIGO"] . '</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
        </cac:PricingReference>
        <cac:TaxTotal>
<cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IMPORTE_DET"] . '</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["IGV"] . '</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>' . $cabecera["POR_IGV"] . '</cbc:Percent>
<cbc:TaxExemptionReasonCode>' . $cabecera["COD_TIPO_OPERACION"] . '</cbc:TaxExemptionReasonCode>
                    <cac:TaxScheme>
                        <cbc:ID>1000</cbc:ID>
                        <cbc:Name>IGV</cbc:Name>
                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
    
<cac:Item>
<cbc:Description><![CDATA[' . replace_invalid_caracters((isset($cabecera["DESCRIPCION_DET"])) ? $cabecera["DESCRIPCION_DET"] : "") . ']]></cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID><![CDATA[' . replace_invalid_caracters((isset($cabecera["CODIGO_DET"])) ? $cabecera["CODIGO_DET"] : "") . ']]></cbc:ID>
            </cac:SellersItemIdentification>
        </cac:Item>
<cac:Price>
<cbc:PriceAmount currencyID="' . $cabecera["COD_MONEDA"] . '">' . $cabecera["PRECIO_DET"] . '</cbc:PriceAmount>
</cac:Price>
    </cac:DebitNoteLine>';
        }
        
        $xmlCPE = $xmlCPE . '</DebitNote>';
    }
    
    if ($tipo!=3){
        $doc->loadXML($xmlCPE);
        
        // GUARDAR DOCUMENTO XML EN facturas-sin-firmar
        $doc->save("factura-sin-firmar/$ruc1-$tipo_doc-$serie-$numero_factura1.XML");
        chmod("factura-sin-firmar/$ruc1-$tipo_doc-$serie-$numero_factura1.XML", 0777);
        // FIRMA
        $doc3 = "$ruc1-$tipo_doc-$serie-$numero_factura1";
        $rutas = array();
        
        $rutas['ruta_xml'] = "factura-sin-firmar/$doc3";
        if ($fac_ele == 1) {
            $rutas['ruta_firma'] = "certificados/produccion/$ruc1.pfx";
            $rutas['pass_firma'] = $clave;
        }
        if ($fac_ele == 3) {
            $rutas['ruta_firma'] = "certificados/beta/firmabeta.pfx";
            $rutas['pass_firma'] = '123456';
            // $rutas['pass_firma'] = $clave;
        }
        
        $rutas['ruta_xml1'] = "$doc3";
        $signature = new Signature();
        $flg_firma = "0";
        try {
            $resp_firma = $signature->signature_xml($flg_firma, $rutas['ruta_xml'], $rutas['ruta_firma'], $rutas['pass_firma'], $rutas['ruta_xml1']);
            if ($resp_firma['respuesta'] == 'error') {
                return $resp_firma;
            }
        } catch (Exception $e) {
            echo "Error con Sunat: ".$e->getMessage();
            return $e->getMessage();
        }
    }
}

include ("../../../constantes.php");

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!-- Meta, title, CSS, favicons, etc. -->
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Enviando a Sunat</title>
</head>
<body>
    <?php 
    if (CONF_ENVIO_AUTOMATICO_SUNAT_FINALIZAR_VENTA==1  && $tipo!= 3){
    ?>
    <img src="../../../assets/img/sunat.png"  width="100" height="100">
    <?php } ?>
    
    <img src="../../../assets/img/loading.gif"  width="100" height="100">
    
    <script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
    <script src="//code.jquery.com/jquery-1.11.2.min.js"></script>
    <script>
        $(document).ready(function(){
            load(1);        
        });
    
        function load(id){
            <?php 
            if (CONF_ENVIO_AUTOMATICO_SUNAT_FINALIZAR_VENTA==1 && $tipo!= 3){
            ?>
            var fac = '<?php echo $doc3;?>' + '-' + '<?php echo $id_venta;?>';
            $.ajax({
                type: "GET",
                url: "enviar_sunat_web_service.php",
                data: "fac=" + fac + "&enviar_todos=0",
                success: function(datos){
                    alert('Datos enviados a Sunat Satisfactoriamente');
                    var link = '../../../reporte/factura.php?id='+<?php echo $id_venta;?>;
                    window.location.href = link;
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown + ' ' + textStatus);
                    alert('Error ' + errorThrown + ' ' + textStatus);
                    var link = '../../../reporte/factura.php?id='+<?php echo $id_venta;?>;
                    window.location.href = link;
                } 
            }); 
            <?php 
            }
            ?>

            

                
        }  
   </script>
   
</body>
</html>
