<?php
require 'simple_html_dom.php';
error_reporting(E_ALL ^ E_NOTICE);

if (isset($_POST['doc1']) && !empty($_POST['doc1'])){
    $dni = $_POST['doc1'];
    //     $sUrl = 'https://aplicaciones007.jne.gob.pe/srop_publico/Consulta/api/AfiliadoApi/GetNombresCiudadano';
    $sUrl = 'https://www.facturacionelectronica.us/facturacion/controller/ws_consulta_rucdni_v2.php?documento=DNI&usuario=10447915125&password=985511933&nro_documento='.$dni;
    
    //     $postdata = http_build_query(
    //         array(
    //             'CODDNI' => $dni
    //         )
    //         );
    
    $opts = array('http' =>
        array(
            'method'  => 'GET',
            'header'  => 'Content-Type: application/x-www-form-urlencoded',
            //             'header'  => 'Requestverificationtoken: 30OB7qfO2MmL2Kcr1z4S0ttQcQpxH9pDUlZnkJPVgUhZOGBuSbGU4qM83JcSu7DZpZw-IIIfaDZgZ4vDbwE5-L9EPoBIHOOC1aSPi4FS_Sc1:clDOiaq7mKcLTK9YBVGt2R3spEU8LhtXEe_n5VG5VLPfG9UkAQfjL_WT9ZDmCCqtJypoTD26ikncynlMn8fPz_F_Y88WFufli38cUM-24PE1',
            //             'content' => json_encode($postdata)
        )
    );
    $context  = stream_context_create($opts);
    $result = file_get_contents($sUrl, false, $context);
    $data = json_decode($result);
    if ($data->success=="True"){
        echo $data->result->Paterno."|".$data->result->Materno."|".$data->result->Nombre;
    }
}

if (isset($_POST['ruc']) && !empty($_POST['ruc'])){
    $a1=$_POST['ruc'];
    $cliente = new Sunat();
    $a2=$cliente->getDataRUC($a1);
    
//     $clientes = new Sunat1();
//     $a3=$clientes->getDataRUC1($a1);
    
    $clientes1 = new Sunat2();
    $a4=$clientes1->getDataRUC2($a1);
    
    echo "$a2|$a4||";
}


class cURL
{
    protected $_useragent = 'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:53.0) Gecko/20100101 Firefox/53.0';
    protected $_url;
    protected $_followlocation;
    protected $_timeout;
    protected $_httpheaderData = array();
    protected $_httpheader = array('Expect:');
    protected $_maxRedirects;
    protected $_cookieFileLocation;
    protected $_post;
    protected $_postFields;
    protected $_referer ="https://www.google.com/";
    
    protected $_session;
    protected $_webpage;
    protected $_includeHeader;
    protected $_noBody;
    protected $_status;
    protected $_binary;
    protected $_binaryFields;
    
    public    $authentication = false;
    public    $auth_name      = '';
    public    $auth_pass      = '';
    
    public function __construct( $followlocation = true, $timeOut = 30, $maxRedirecs = 4, $binary = false, $includeHeader = false, $noBody = false )
    {
        $this->_followlocation = $followlocation;
        $this->_timeout = $timeOut;
        $this->_maxRedirects = $maxRedirecs;
        $this->_noBody = $noBody;
        $this->_includeHeader = $includeHeader;
        $this->_binary = $binary;
        
        $this->_cookieFileLocation = dirname(__FILE__).'/cookie.txt';
    }
    
    public function useAuth( $use )
    {
        $this->authentication = false;
        if($use == true) $this->authentication = true;
    }
    
    public function setName( $name )
    {
        $this->auth_name = $name;
    }
    public function setPass( $pass )
    {
        $this->auth_pass = $pass;
    }
    
    public function setReferer( $referer )
    {
        $this->_referer = $referer;
    }
    
    public function setHttpHeader( $httpheader=array() )
    {
        $this->_httpheader = array();
        foreach( $httpheader as $i=>$v )
        {
            $this->_httpheaderData[$i]=$v;
        }
        foreach( $this->_httpheaderData as $i=>$v )
        {
            $this->_httpheader[]=$i.":".$v;
        }
    }
    
    public function setCookiFileLocation( $path )
    {
        $this->_cookieFileLocation = $path;
        if ( !file_exists($this->_cookieFileLocation) )
        {
            file_put_contents($this->_cookieFileLocation,"");
        }
    }
    
    public function setPost( $postFields = array() )
    {
        $this->_binary = false;
        $this->_post = true;
        $this->_postFields = http_build_query($postFields);
    }
    
    public function setBinary( $postBinaryFields = "" )
    {
        $this->_post = false;
        $this->_binary = true;
        $this->_binaryFields = $postBinaryFields;
    }
    
    public function setUserAgent( $userAgent )
    {
        $this->_useragent = $userAgent;
    }
    
    public function createCurl( $url = 'nul' )
    {
        if($url != 'nul')
        {
            $this->_url = $url;
        }
        
        $s = curl_init();
        curl_setopt($s,CURLOPT_URL,$this->_url);
        curl_setopt($s,CURLOPT_HTTPHEADER,$this->_httpheader);
        curl_setopt($s,CURLOPT_TIMEOUT,$this->_timeout);
        curl_setopt($s,CURLOPT_MAXREDIRS,$this->_maxRedirects);
        curl_setopt($s,CURLOPT_RETURNTRANSFER,true);
        curl_setopt($s,CURLOPT_FOLLOWLOCATION,$this->_followlocation);
        curl_setopt($s,CURLOPT_COOKIEJAR,$this->_cookieFileLocation);
        curl_setopt($s,CURLOPT_COOKIEFILE,$this->_cookieFileLocation);
        
        if($this->authentication == true)
        {
            curl_setopt($s, CURLOPT_USERPWD, $this->auth_name.':'.$this->auth_pass);
        }
        
        if($this->_post)
        {
            curl_setopt($s,CURLOPT_POST,true);
            curl_setopt($s,CURLOPT_POSTFIELDS,$this->_postFields);
        }
        
        if($this->_binary)
        {
            curl_setopt($s,CURLOPT_BINARYTRANSFER,true);
            curl_setopt($s,CURLOPT_POSTFIELDS, $this->_binaryFields);
            $this->setHttpHeader( array('Content-Length'=>strlen($this->_binaryFields)) );
        }
        
        if($this->_includeHeader)
        {
            curl_setopt($s,CURLOPT_HEADER,true);
        }
        
        if($this->_noBody)
        {
            curl_setopt($s,CURLOPT_NOBODY,true);
        }
        
        curl_setopt($s,CURLOPT_USERAGENT,$this->_useragent);
        curl_setopt($s,CURLOPT_REFERER,$this->_referer);
        $this->_webpage = curl_exec($s);
        $this->_status = curl_getinfo($s,CURLINFO_HTTP_CODE);
        curl_close($s);
    }
    
    public function getHttpStatus()
    {
        return $this->_status;
    }
    
    public function __toString()
    {
        return $this->_webpage;
    }
    // simplificado
    public function send($url, array $post = array() )
    {
        if( count($post)!=0 )
            $this->setPost( $post );
            
            $this->createCurl( $url );
            return $this->_webpage;
    }
    public function sendBinary($url,$binary="")
    {
        if( $binary != "" )
            $this->setBinary( $binary );
            $this->createCurl( $url );
            return $this->_webpage;
    }
}

class Sunat{
    var $cc;  // cUrl
    function __construct()
    {
        $this->cc = new cURL();
    }
    function getNumRand()
    {
        $url="http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/captcha?accion=random";
        $numRand = $this->cc->send($url);
        return $numRand;
    }
    function getDataRUC( $ruc )
    {
        $numRand = $this->getNumRand();
        $rtn = '';
        if($ruc != "" && $numRand!=false) {
            $data = array(
                "nroRuc" => $ruc,
                "accion" => "consPorRuc",
                "numRnd" => $numRand
            );
            
            $url = "http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias";
            $Page = $this->cc->send($url,$data);
            
            //RazonSocial
            $patron='/<input type="hidden" name="desRuc" value="(.*)">/';
            $output = preg_match_all($patron, $Page, $matches, PREG_SET_ORDER);
            if(isset($matches[0])) {
                $RS = utf8_encode(str_replace('"','', ($matches[0][1])));
                $rtn = trim($RS);
            } 
        }
        
        return $rtn;
    }
}



class Sunat1{
    var $cc;  // cUrl
    function __construct()
    {
        $this->cc = new cURL();
    }
    function getNumRand1()
    {
        $url="http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/captcha?accion=random";
        $numRand = $this->cc->send($url);
        return $numRand;
    }
    function getDataRUC1( $ruc )
    {
        $numRand = $this->getNumRand1();
        $rtn = '';
        if($ruc != "" && $numRand!=false)
        {
            $data = array(
                "nroRuc" => $ruc,
                "accion" => "consPorRuc",
                "numRnd" => $numRand
            );
            
            $url = "http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias";
            $Page = $this->cc->send($url,$data);
            
            //RazonSocial
            $patron='/<td class="bgn" colspan=1>Tel&eacute;fono\(s\):<\/td>[ ]*-->\r\n<!--\t[ ]*<td class="bg" colspan=1>(.*)<\/td>/';
            $output = preg_match_all($patron, $Page, $matches, PREG_SET_ORDER);
            if( isset($matches[0]) )
            {
                $rtn = trim($matches[0][1]);
            }
        }
        return $rtn;
    }
}


class Sunat2{
    var $cc;  // cUrl
    function __construct()
    {
        $this->cc = new cURL();
    }
    function getNumRand2()
    {
        $url="http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/captcha?accion=random";
        $numRand = $this->cc->send($url);
        return $numRand;
    }
    function getDataRUC2( $ruc )
    {
        $numRand = $this->getNumRand2();
        $rtn = '';
        if($ruc != "" && $numRand!=false)
        {
            $data = array(
                "nroRuc" => $ruc,
                "accion" => "consPorRuc",
                "numRnd" => $numRand
            );
            
            $url = "http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias";
            $Page = $this->cc->send($url,$data);
            
            //Direccion
            $busca=array(
                "Direccion" 			=> "Direcci&oacute;n del Domicilio Fiscal"
                
            );
            foreach($busca as $i=>$v)
            {
                $patron='/<td class="bgn"[ ]*colspan=1[ ]*>'.$v.':[ ]*<\/td>\r\n[\t]*[ ]+<td class="bg" colspan=[1|3]+>(.*)<\/td>/';
                $output = preg_match_all($patron, $Page, $matches, PREG_SET_ORDER);
                if(isset($matches[0]))
                {
                    $rtn = trim(utf8_encode( preg_replace( "[\s+]"," ", ($matches[0][1]) ) ) );
                }
            }
        }
        return $rtn;
    }
}

?>