<?php
require_once 'model/caja/ing_caja.entidad.php';
require_once 'model/caja/ing_caja.model.php';

class CajaController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new CajaModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/caja/ing_caja.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function crud(){
        $alm = new Ingreso();
        $alm->__SET('importe', $_REQUEST['importe']);
        $alm->__SET('motivo', $_REQUEST['motivo']);
        $this->model->registrar($alm);
        echo("<script>location.href = 'lista_caja_ing.php?m=n';</script>");
        //header('Location: lista_caja_ing.php?m=n');
    }

    //ESTADO DE COMPROBANTE
    public function estado(){
        $alm = new Ingreso();
        $alm->__SET('cod_ing',  $_REQUEST['cod_ing']);
        $this->model->estado($alm);
        echo("<script>location.href = 'lista_caja_ing.php?m=a';</script>");
        //header('Location: lista_caja_ing.php?m=a');
    }
}
?> 