<?php
require_once 'model/informes/ventas/inf_productos.model.php';
class InformeController{
    
    private $model;
    
    public function __CONSTRUCT(){
        $this->model  = new InformeModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/informes/ventas/inf_productos.php';
        require_once 'view/footer.php';
    }

    public function Datos()
    {
        $this->model->Datos($_POST);
    }

    public function combPro()
    {
        print_r(json_encode($this->model->combPro($_POST)));
    }

    public function combPre()
    {
        print_r(json_encode($this->model->combPre($_POST)));
    }

}