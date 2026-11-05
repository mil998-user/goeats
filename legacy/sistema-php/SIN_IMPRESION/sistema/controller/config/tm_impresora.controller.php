<?php
require_once 'model/config/tm_impresora.model.php';

class ConfigController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new ConfigModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/config/sist/tm_impresora.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function Crud()
    {
        if($_POST['cod_imp'] != ''){
           print_r(json_encode( $this->model->actualizar($_POST)));
        } else{
           print_r(json_encode( $this->model->registrar($_POST)));
        }
    }
}
?> 