<?php
//------------------FIRMA DE XML--------------------------
require_once('api_signature/XMLSecurityKey.php');
require_once('api_signature/XMLSecurityDSig.php');
require_once('api_signature/XMLSecEnc.php');
//funcion para firmar
class Signature {
    public function signature_xml($flg_firma, $ruta, $ruta_firma, $pass_firma,$ruta1) {
        //flg_firma:
        //          01, 03, 07, 08: Firmar en el nodo uno.
        //          00: Firmar en el Nodo Cero (para comprobantes de Percepción o Retención)
        
        $doc = new DOMDocument();

        $doc->formatOutput = FALSE;
        $doc->preserveWhiteSpace = TRUE;
        $doc->load($ruta . '.XML');

        $objDSig = new XMLSecurityDSig(FALSE);
        $objDSig->setCanonicalMethod(XMLSecurityDSig::C14N);
        $options['force_uri'] = TRUE;
        $options['id_name'] = 'ID';
        $options['overwrite'] = FALSE;

        $objDSig->addReference($doc, XMLSecurityDSig::SHA1, array('http://www.w3.org/2000/09/xmldsig#enveloped-signature'), $options);
        $objKey = new XMLSecurityKey(XMLSecurityKey::RSA_SHA1, array('type' => 'private'));

        $pfx = file_get_contents($ruta_firma);
        $key = array();

        openssl_pkcs12_read($pfx, $key, $pass_firma);
        $objKey->loadKey($key["pkey"]);
        $objDSig->add509Cert($key["cert"], TRUE, FALSE);
        $objDSig->sign($objKey, $doc->documentElement->getElementsByTagName("ExtensionContent")->item($flg_firma));

        $atributo = $doc->getElementsByTagName('Signature')->item(0);
        $atributo->setAttribute('Id', 'SignatureSP');
        
        //===================rescatamos Codigo(HASH_CPE)==================
        $hash_cpe = $doc->getElementsByTagName('DigestValue')->item(0)->nodeValue;
       
        //$doc->save($ruta . '.XML');
        //$doc->save($ruta1 . '.xml');
        //chmod(''.$ruta1.'.xml', 0777);
        $doc->save('factura-firmada/'.$ruta1.'.XML');
        chmod('factura-firmada/'.$ruta1.'.XML', 0777);
        $resp['respuesta'] = 'ok';
        $resp['hash_cpe'] = $hash_cpe;
        return $resp;
    }
}

function tipo_comp($cadena) {
    $cadena1=substr($cadena, 0, 1);
    if($cadena1=="F"){
        return "01";
    }
    if($cadena1=="B"){
        return "03";
    }
}


function replace_invalid_caracters($cadena) {
	    $cadena = str_replace("'", "", $cadena);
	    $cadena = str_replace("#", "", $cadena);
	    $cadena = str_replace("$", "", $cadena);
	    $cadena = str_replace("%", "", $cadena);
	    $cadena = str_replace("&", "", $cadena);
	    $cadena = str_replace("'", "", $cadena);
	    $cadena = str_replace("(", "", $cadena);
	    $cadena = str_replace(")", "", $cadena);
	    $cadena = str_replace("*", "", $cadena);
	    $cadena = str_replace("+", "", $cadena);
	    $cadena = str_replace("-", "", $cadena);
	    $cadena = str_replace(".", "", $cadena);
	    $cadena = str_replace("/", "", $cadena);
	    $cadena = str_replace("<", "", $cadena);
	    $cadena = str_replace("=", "", $cadena);
	    $cadena = str_replace(">", "", $cadena);
	    $cadena = str_replace("?", "", $cadena);
	    $cadena = str_replace("@", "", $cadena);
	    $cadena = str_replace("[", "", $cadena);
	    $cadena = str_replace("\\", "", $cadena);
	    $cadena = str_replace("]", "", $cadena);
	    $cadena = str_replace("^", "", $cadena);
	    $cadena = str_replace("_", "", $cadena);
	    $cadena = str_replace("`", "", $cadena);
	    $cadena = str_replace("{", "", $cadena);
	    $cadena = str_replace("|", "", $cadena);
	    $cadena = str_replace("}", "", $cadena);
	    $cadena = str_replace("~", "", $cadena);
	    $cadena = str_replace("¡", "", $cadena);
	    $cadena = str_replace("¢", "", $cadena);
	    $cadena = str_replace("£", "", $cadena);
	    $cadena = str_replace("¤", "", $cadena);
	    $cadena = str_replace("¥", "", $cadena);
	    $cadena = str_replace("¦", "", $cadena);
	    $cadena = str_replace("§", "", $cadena);
	    $cadena = str_replace("¨", "", $cadena);
	    $cadena = str_replace("©", "", $cadena);
	    $cadena = str_replace("ª", "", $cadena);
	    $cadena = str_replace("«", "", $cadena);
	    $cadena = str_replace("¬", "", $cadena);
	    $cadena = str_replace("®", "", $cadena);
	    $cadena = str_replace("°", "", $cadena);
	    $cadena = str_replace("±", "", $cadena);
	    $cadena = str_replace("²", "", $cadena);
	    $cadena = str_replace("³", "", $cadena);
	    $cadena = str_replace("´", "", $cadena);
	    $cadena = str_replace("µ", "", $cadena);
	    $cadena = str_replace("¶", "", $cadena);
	    $cadena = str_replace("·", "", $cadena);
	    $cadena = str_replace("¸", "", $cadena);
	    $cadena = str_replace("¹", "", $cadena);
	    $cadena = str_replace("º", "", $cadena);
	    $cadena = str_replace("»", "", $cadena);
	    $cadena = str_replace("¼", "", $cadena);
	    $cadena = str_replace("½", "", $cadena);
	    $cadena = str_replace("¾", "", $cadena);
	    $cadena = str_replace("¿", "", $cadena);
	    $cadena = str_replace("À", "A", $cadena);
	    $cadena = str_replace("Á", "A", $cadena);
	    $cadena = str_replace("Â", "A", $cadena);
	    $cadena = str_replace("Ã", "A", $cadena);
	    $cadena = str_replace("Ä", "A", $cadena);
	    $cadena = str_replace("Å", "A", $cadena);
	    $cadena = str_replace("Æ", "", $cadena);
	    $cadena = str_replace("Ç", "", $cadena);
	    $cadena = str_replace("È", "E", $cadena);
	    $cadena = str_replace("É", "E", $cadena);
	    $cadena = str_replace("Ê", "E", $cadena);
	    $cadena = str_replace("Ë", "E", $cadena);
	    $cadena = str_replace("Ì", "I", $cadena);
	    $cadena = str_replace("Í", "I", $cadena);
	    $cadena = str_replace("Î", "I", $cadena);
	    $cadena = str_replace("Ï", "I", $cadena);
	    $cadena = str_replace("Ð", "", $cadena);
	    $cadena = str_replace("Ñ", "N", $cadena);
	    $cadena = str_replace("Ò", "O", $cadena);
	    $cadena = str_replace("Ó", "O", $cadena);
	    $cadena = str_replace("Ô", "O", $cadena);
	    $cadena = str_replace("Õ", "O", $cadena);
	    $cadena = str_replace("Ö", "O", $cadena);
	    $cadena = str_replace("×", "", $cadena);
	    $cadena = str_replace("Ø", "", $cadena);
	    $cadena = str_replace("Ù", "U", $cadena);
	    $cadena = str_replace("Ú", "U", $cadena);
	    $cadena = str_replace("Û", "U", $cadena);
	    $cadena = str_replace("Ü", "U", $cadena);
	    $cadena = str_replace("Ý", "Y", $cadena);
	    $cadena = str_replace("Þ", "", $cadena);
	    $cadena = str_replace("ß", "", $cadena);
	    $cadena = str_replace("à", "a", $cadena);
	    $cadena = str_replace("á", "a", $cadena);
	    $cadena = str_replace("â", "a", $cadena);
	    $cadena = str_replace("ã", "a", $cadena);
	    $cadena = str_replace("ä", "a", $cadena);
	    $cadena = str_replace("å", "a", $cadena);
	    $cadena = str_replace("æ", "", $cadena);
	    $cadena = str_replace("ç", "", $cadena);
	    $cadena = str_replace("è", "e", $cadena);
	    $cadena = str_replace("é", "e", $cadena);
	    $cadena = str_replace("ê", "e", $cadena);
	    $cadena = str_replace("ë", "e", $cadena);
	    $cadena = str_replace("ì", "i", $cadena);
	    $cadena = str_replace("í", "i", $cadena);
	    $cadena = str_replace("î", "i", $cadena);
	    $cadena = str_replace("ï", "i", $cadena);
	    $cadena = str_replace("ð", "o", $cadena);
	    $cadena = str_replace("ñ", "n", $cadena);
	    $cadena = str_replace("ò", "o", $cadena);
	    $cadena = str_replace("ó", "o", $cadena);
	    $cadena = str_replace("ô", "o", $cadena);
	    $cadena = str_replace("õ", "o", $cadena);
	    $cadena = str_replace("ö", "o", $cadena);
	    $cadena = str_replace("÷", "", $cadena);
	    $cadena = str_replace("ø", "", $cadena);
	    $cadena = str_replace("ù", "u", $cadena);
	    $cadena = str_replace("ú", "u", $cadena);
	    $cadena = str_replace("û", "u", $cadena);
	    $cadena = str_replace("ü", "u", $cadena);
	    $cadena = str_replace("ý", "y", $cadena);
	    $cadena = str_replace("þ", "", $cadena);
	    $cadena = str_replace("ÿ", "", $cadena);
	    $cadena = str_replace("Œ", "", $cadena);
	    $cadena = str_replace("œ", "", $cadena);
	    $cadena = str_replace("Š", "", $cadena);
	    $cadena = str_replace("š", "", $cadena);
	    $cadena = str_replace("Ÿ", "", $cadena);
	    $cadena = str_replace("ƒ", "", $cadena);
	    $cadena = str_replace("–", "", $cadena);
	    $cadena = str_replace("—", "", $cadena);
	    $cadena = str_replace("‘", "", $cadena);
	    $cadena = str_replace("’", "", $cadena);
	    $cadena = str_replace("‚", "", $cadena);
	    $cadena = str_replace("“", "", $cadena);
	    $cadena = str_replace("”", "", $cadena);
	    $cadena = str_replace("„", "", $cadena);
	    $cadena = str_replace("†", "", $cadena);
	    $cadena = str_replace("‡", "", $cadena);
	    $cadena = str_replace("•", "", $cadena);
	    $cadena = str_replace("…", "", $cadena);
	    $cadena = str_replace("‰", "", $cadena);
	    $cadena = str_replace("€", "", $cadena);
	    $cadena = str_replace("™", "", $cadena);
	    return $cadena;
}

function unidad($numuero){
switch ($numuero)
{
case 9:
{
$numu = "NUEVE";
break;
}
case 8:
{
$numu = "OCHO";
break;
}
case 7:
{
$numu = "SIETE";
break;
} 
case 6:
{
$numu = "SEIS";
break;
} 
case 5:
{
$numu = "CINCO";
break;
} 
case 4:
{
$numu = "CUATRO";
break;
} 
case 3:
{
$numu = "TRES";
break;
} 
case 2:
{
$numu = "DOS";
break;
} 
case 1:
{
$numu = "UN";
break;
} 
case 0:
{
$numu = "";
break;
} 
}
return $numu; 
}

function decena($numdero){

if ($numdero >= 90 && $numdero <= 99)
{
$numd = "NOVENTA ";
if ($numdero > 90)
$numd = $numd."Y ".(unidad($numdero - 90));
}
else if ($numdero >= 80 && $numdero <= 89)
{
$numd = "OCHENTA ";
if ($numdero > 80)
$numd = $numd."Y ".(unidad($numdero - 80));
}
else if ($numdero >= 70 && $numdero <= 79)
{
$numd = "SETENTA ";
if ($numdero > 70)
$numd = $numd."Y ".(unidad($numdero - 70));
}
else if ($numdero >= 60 && $numdero <= 69)
{
$numd = "SESENTA ";
if ($numdero > 60)
$numd = $numd."Y ".(unidad($numdero - 60));
}
else if ($numdero >= 50 && $numdero <= 59)
{
$numd = "CINCUENTA ";
if ($numdero > 50)
$numd = $numd."Y ".(unidad($numdero - 50));
}
else if ($numdero >= 40 && $numdero <= 49)
{
$numd = "CUARENTA ";
if ($numdero > 40)
$numd = $numd."Y ".(unidad($numdero - 40));
}
else if ($numdero >= 30 && $numdero <= 39)
{
$numd = "TREINTA ";
if ($numdero > 30)
$numd = $numd."Y ".(unidad($numdero - 30));
}
else if ($numdero >= 20 && $numdero <= 29)
{
if ($numdero == 20)
$numd = "VEINTE ";
else
$numd = "VEINTI".(unidad($numdero - 20));
}
else if ($numdero >= 10 && $numdero <= 19)
{
switch ($numdero){
case 10:
{
$numd = "DIEZ ";
break;
}
case 11:
{ 
$numd = "ONCE ";
break;
}
case 12:
{
$numd = "DOCE ";
break;
}
case 13:
{
$numd = "TRECE ";
break;
}
case 14:
{
$numd = "CATORCE ";
break;
}
case 15:
{
$numd = "QUINCE ";
break;
}
case 16:
{
$numd = "DIECISEIS ";
break;
}
case 17:
{
$numd = "DIECISIETE ";
break;
}
case 18:
{
$numd = "DIECIOCHO ";
break;
}
case 19:
{
$numd = "DIECINUEVE ";
break;
}
} 
}
else
$numd = unidad($numdero);
return $numd;
}

function centena($numc){
if ($numc >= 100)
{
if ($numc >= 900 && $numc <= 999)
{
$numce = "NOVECIENTOS ";
if ($numc > 900)
$numce = $numce.(decena($numc - 900));
}
else if ($numc >= 800 && $numc <= 899)
{
$numce = "OCHOCIENTOS ";
if ($numc > 800)
$numce = $numce.(decena($numc - 800));
}
else if ($numc >= 700 && $numc <= 799)
{
$numce = "SETECIENTOS ";
if ($numc > 700)
$numce = $numce.(decena($numc - 700));
}
else if ($numc >= 600 && $numc <= 699)
{
$numce = "SEISCIENTOS ";
if ($numc > 600)
$numce = $numce.(decena($numc - 600));
}
else if ($numc >= 500 && $numc <= 599)
{
$numce = "QUINIENTOS ";
if ($numc > 500)
$numce = $numce.(decena($numc - 500));
}
else if ($numc >= 400 && $numc <= 499)
{
$numce = "CUATROCIENTOS ";
if ($numc > 400)
$numce = $numce.(decena($numc - 400));
}
else if ($numc >= 300 && $numc <= 399)
{
$numce = "TRESCIENTOS ";
if ($numc > 300)
$numce = $numce.(decena($numc - 300));
}
else if ($numc >= 200 && $numc <= 299)
{
$numce = "DOSCIENTOS ";
if ($numc > 200)
$numce = $numce.(decena($numc - 200));
}
else if ($numc >= 100 && $numc <= 199)
{
if ($numc == 100)
$numce = "CIEN ";
else
$numce = "CIENTO ".(decena($numc - 100));
}
}
else
$numce = decena($numc);

return $numce; 
}

function miles($nummero){
if ($nummero >= 1000 && $nummero < 2000){
$numm = "MIL ".(centena($nummero%1000));
}
if ($nummero >= 2000 && $nummero <10000){
$numm = unidad(Floor($nummero/1000))." MIL ".(centena($nummero%1000));
}
if ($nummero < 1000)
$numm = centena($nummero);

return $numm;
}

function decmiles($numdmero){
if ($numdmero == 10000)
$numde = "DIEZ MIL";
if ($numdmero > 10000 && $numdmero <20000){
$numde = decena(Floor($numdmero/1000))."MIL ".(centena($numdmero%1000)); 
}
if ($numdmero >= 20000 && $numdmero <100000){
$numde = decena(Floor($numdmero/1000))." MIL ".(miles($numdmero%1000)); 
} 
if ($numdmero < 10000)
$numde = miles($numdmero);

return $numde;
} 

function cienmiles($numcmero){
if ($numcmero == 100000)
$num_letracm = "CIEN MIL";
if ($numcmero >= 100000 && $numcmero <1000000){
$num_letracm = centena(Floor($numcmero/1000))." MIL ".(centena($numcmero%1000)); 
}
if ($numcmero < 100000)
$num_letracm = decmiles($numcmero);
return $num_letracm;
} 

function millon($nummiero){
if ($nummiero >= 1000000 && $nummiero <2000000){
$num_letramm = "UN MILLON ".(cienmiles($nummiero%1000000));
}
if ($nummiero >= 2000000 && $nummiero <10000000){
$num_letramm = unidad(Floor($nummiero/1000000))." MILLONES ".(cienmiles($nummiero%1000000));
}
if ($nummiero < 1000000)
$num_letramm = cienmiles($nummiero);

return $num_letramm;
} 

function decmillon($numerodm){
if ($numerodm == 10000000)
$num_letradmm = "DIEZ MILLONES";
if ($numerodm > 10000000 && $numerodm <20000000){
$num_letradmm = decena(Floor($numerodm/1000000))."MILLONES ".(cienmiles($numerodm%1000000)); 
}
if ($numerodm >= 20000000 && $numerodm <100000000){
$num_letradmm = decena(Floor($numerodm/1000000))." MILLONES ".(millon($numerodm%1000000)); 
}
if ($numerodm < 10000000)
$num_letradmm = millon($numerodm);

return $num_letradmm;
}

function cienmillon($numcmeros){
if ($numcmeros == 100000000)
$num_letracms = "CIEN MILLONES";
if ($numcmeros >= 100000000 && $numcmeros <1000000000){
$num_letracms = centena(Floor($numcmeros/1000000))." MILLONES ".(millon($numcmeros%1000000)); 
}
if ($numcmeros < 100000000)
$num_letracms = decmillon($numcmeros);
return $num_letracms;
} 

function milmillon($nummierod){
if ($nummierod >= 1000000000 && $nummierod <2000000000){
$num_letrammd = "MIL ".(cienmillon($nummierod%1000000000));
}
if ($nummierod >= 2000000000 && $nummierod <10000000000){
$num_letrammd = unidad(Floor($nummierod/1000000000))." MIL ".(cienmillon($nummierod%1000000000));
}
if ($nummierod < 1000000000)
$num_letrammd = cienmillon($nummierod);

return $num_letrammd;
} 


function convertir($numero){
$numf = milmillon($numero);
return $numf;
}



?>