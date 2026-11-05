<?php
require_once 'model/config/tm_otros.entidad.php';
require_once 'model/config/tm_otros.model.php';

class ConfigController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new ConfigModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/config/tm_config.php';
        require_once 'view/footer.php';
    }

    //DATOS DE LA EMPRESA
    public function IndexDE(){
        $alm = new Datos();
        $alm = $this->model->ObtenerDE();
        require_once 'view/header.php';
        require_once 'view/config/sist/de.php';
        require_once 'view/footer.php';
    }

    public function GuardarDE(){
        $alm = new Datos();

        $alm->__SET('id_de', $_REQUEST['id']);
        $alm->__SET('trib_acr', $_REQUEST['tribAcr']);
        $alm->__SET('trib_car', $_REQUEST['tribCar']);
        $alm->__SET('di_acr', $_REQUEST['diAcr']);
        $alm->__SET('di_car', $_REQUEST['diCar']);
        $alm->__SET('imp_acr', $_REQUEST['impAcr']);
        $alm->__SET('imp_val', $_REQUEST['impVal']);
        $alm->__SET('imp_icbper', $_REQUEST['imp_icbper']);
        $alm->__SET('mon_acr', $_REQUEST['monAcr']);
        $alm->__SET('mon_val', $_REQUEST['monVal']);
        $alm->__SET('ruc', $_REQUEST['ruc']);
        $alm->__SET('raz_soc', $_REQUEST['razSoc']);
        $alm->__SET('direccion', $_REQUEST['direc']);
        $alm->__SET('logo', $_REQUEST['logo']);

        if( !empty( $_FILES['logo']['name'] ) ){
            $logo = date('ymdhis') . '-' . strtolower($_FILES['logo']['name']);
            move_uploaded_file ($_FILES['logo']['tmp_name'], 'assets/img/' . $logo);          
            $alm->__SET('logo', $logo);
        }

        if($_REQUEST['id'] != ''){
           $this->model->ActualizarDE($alm);
           //header('Location: lista_tm_otros.php?c=Config&a=IndexDE&m=u');
           echo("<script>location.href = 'lista_tm_otros.php?c=Config&a=IndexDE&m=u';</script>");
        }
    }

    //TIPO DE DOCUMENTO
    public function IndexTD(){
        require_once 'view/header.php';
        require_once 'view/config/sist/tipo_doc.php';
        require_once 'view/footer.php';
    }

    public function ListarTD(){
        $this->model->ListarTD();
    }

    public function GuardarTD(){
        if($_POST['cod_td'] != '' and $_POST['serie'] != '' and $_POST['numero'] != ''){
            print_r(json_encode( $this->model->GuardarTD($_POST)));
        }
    }

    public function obtenerDatos(){
        $alm = new TipoDoc();
        
        if(isset($_REQUEST['cod'])){
            $alm = $this->model->obtenerDatos($_REQUEST['cod']);
        } 

        require_once 'view/header.php';
        require_once 'view/config/sist/tiraje.php';
        require_once 'view/footer.php';
    }

    //TIRAJE DE COMPROBANTE
    

    public function ListarTirajes(){
        $this->model->ListarTirajes($_POST);
    }



    

    public function obtenerDatosTiraje(){
        $alm = new Tiraje();
        
        if(isset($_REQUEST['cod'])){
            $alm = $this->model->obtenerDatosTiraje($_REQUEST['cod']);
        }

        require_once 'view/header.php';
        require_once 'view/config/sist/tiraje.php';
        require_once 'view/footer.php';
    }


    public function crud(){
        $alm = new Tiraje();
        $alm->__SET('idtiraje',    $_REQUEST['idtiraje']);
        $alm->__SET('contribuyente',    $_REQUEST['contribuyente']);
        $alm->__SET('regimen',   $_REQUEST['regimen']);
        $alm->__SET('ciudad',    $_REQUEST['ciudad']);
        $alm->__SET('serie',   $_REQUEST['serie']);
        $alm->__SET('aut_sri',  $_REQUEST['aut_sri']);
        $alm->__SET('desde',    $_REQUEST['desde']);
        $alm->__SET('hasta',    $_REQUEST['hasta']);
        $alm->__SET('id_comprobante',    $_REQUEST['id_comprobante']);

        $alm->__SET('disponibles',    $_REQUEST['disponibles']);
        $alm->__SET('imprenta',    $_REQUEST['imprenta']);
        $alm->__SET('imp_dueno',    $_REQUEST['imp_dueno']);
        $alm->__SET('imp_ruc',    $_REQUEST['imp_ruc']);
        $alm->__SET('imp_num_aut',    $_REQUEST['imp_num_aut']);
        $alm->__SET('imp_fecha_emision',    date('Y-m-d',strtotime($_REQUEST['imp_fecha_emision'])));
        $alm->__SET('imp_valido',    $_REQUEST['imp_valido']);
        $alm->__SET('imp_fecha_valido',    date('Y-m-d',strtotime($_REQUEST['imp_fecha_valido'])));
        $alm->__SET('estado',    $_REQUEST['estado']);

        if($alm->__GET('idtiraje') != ''){
           $this->model->editar($alm);
           echo("<script>location.href = 'lista_tm_otros.php?c=Config&a=IndexTD';</script>");
           //header('Location: lista_tm_clientes.php?m=u');
        } else {
           $row = $this->model->registrar($alm);
           if ($row['dup'] == 1){
                echo("<script>location.href = 'lista_tm_otros.php?c=Config&a=IndexTD';</script>");
                //header('Location: lista_tm_clientes.php?m=d');
            } else {
                echo("<script>location.href = 'lista_tm_otros.php?m=n';</script>");
                //header('Location: lista_tm_clientes.php?m=n');
            }
        }
    }


    //INDICADOR 01
    public function IndexI01(){
        require_once 'view/header.php';
        require_once 'view/config/indi/indicador_01.php';
        require_once 'view/footer.php';
    }

    public function ListarI01(){
        $this->model->ListarI01();
    }

    public function GuardarI01(){
        if($_POST['cod_ind'] != ''){
            print_r(json_encode( $this->model->GuardarI01($_POST)));
        }
    }
 
    

}
?> 