<?php
require_once 'model/informes/finanzas/inf_cajas.model.php';
class InformeController{
    
    private $model;
    
    public function __CONSTRUCT(){
        $this->model  = new InformeModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/informes/finanzas/inf_cajas.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    //MONTO DEL SISTEMA
    public function detalle()
    {
        print_r(json_encode($this->model->detalle($_POST)));
    }
}