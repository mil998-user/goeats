<?php
require_once 'model/compras/compras.entidad.php';
require_once 'model/compras/compras.model.php';

class CompraController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new CompraModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/compras/index.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function nuevo(){
        require_once 'view/header.php';
        require_once 'view/compras/nuevo.php';
        require_once 'view/footer.php';
    }

    public function detalle()
    {
        print_r(json_encode($this->model->detalle($_POST)));
    }

    public function registrar()
    {
        print_r(json_encode($this->model->registrar($_POST)));
    }

    public function anular(){
        $row = $this->model->anular($_REQUEST['cod_compra']);
        if ($row['cod'] == 1){
            echo("<script>location.href = 'lista_comp.php?m=c';</script>");
            //header('Location: lista_comp.php?m=c');
        } else {
            echo("<script>location.href = 'lista_comp.php?m=e';</script>");
            //header('Location: lista_comp.php?m=e');
        }
    }  

    public function buscarProveedor()
    {
        print_r(json_encode($this->model->buscarProveedor($_REQUEST['cadena'])));
    }

    public function nuevoProveedor()
    {
        print_r(json_encode($this->model->nuevoProveedor($_POST)));
    }

    public function buscarInsumo()
    {
        print_r(json_encode($this->model->buscarInsumo($_REQUEST['cadena'])));
    } 
}
?> 