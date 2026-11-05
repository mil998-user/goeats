<?php
require_once 'model/config/tm_tienda.model.php';

class ConfigController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new ConfigModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/config/sist/tm_tienda.php';
        require_once 'view/footer.php';
    }

    public function ListaTiendas()
    {
        $this->model->ListaTiendas($_POST);
    }

    public function CrudTienda()
    {
        if($_POST['codTie'] != ''){
           print_r(json_encode( $this->model->UTienda($_POST)));
        } else{
           print_r(json_encode( $this->model->CTienda($_POST)));
        }
    }
}
?> 