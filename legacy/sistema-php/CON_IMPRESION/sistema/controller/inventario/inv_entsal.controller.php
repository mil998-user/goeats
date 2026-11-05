<?php
require_once 'model/inventario/inv_entsal.model.php';
require_once 'model/inventario/inv_entsal.entidad.php';
class InventarioController{
    
    private $model;
    
    public function __CONSTRUCT(){
        $this->model  = new InventarioModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/inventario/inv_entsal/index.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function nuevo(){
        require_once 'view/header.php';
        require_once 'view/inventario/inv_entsal/nuevo.php';
        require_once 'view/footer.php';
    }

    public function detalle()
    {
        print_r(json_encode($this->model->detalle($_POST)));
    }

    public function anular(){
        $alm = new Inventario();
        $alm->__SET('cod_es', $_REQUEST['cod_es']);
        $alm->__SET('cod_tipo', $_REQUEST['cod_tipo']);
        $row = $this->model->anular($alm);
        if ($row['cod'] == 1){
            echo("<script>location.href = 'lista_inv_entsal.php?m=c';</script>");
            //header('Location: lista_inv_entsal.php?m=c');
        } else {
            echo("<script>location.href = 'lista_inv_entsal.php?m=e';</script>");
            //header('Location: lista_inv_entsal.php?m=e');
        }
    }

    public function buscarInsumo()
    {
        print_r(json_encode($this->model->buscarInsumo($_REQUEST['cadena'])));
    }

    public function ComboUniMed()
    {
        $this->model->ComboUniMed($_POST);
    }

    public function registrar()
    {
        print_r(json_encode( $this->model->registrar( $_POST ) ));
    }
}