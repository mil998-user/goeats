<?php
require_once 'model/inventario/inv_kardexv.model.php';
class InventarioController{
    
    private $model;
    
    public function __CONSTRUCT(){
        $this->model  = new InventarioModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/inventario/inv_kardexv.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function ComboInsumoProducto()
    {
        $this->model->ComboInsumoProducto($_POST);
    }
}