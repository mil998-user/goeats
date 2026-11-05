<?php
require_once 'model/inicio/inicio.model.php';
require_once 'model/inicio/inicio.entidad.php';

class FacturacionController{
    
    private $model;
    
    public function __CONSTRUCT(){
        $this->model  = new InicioModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/facturacion/index.php';
        require_once 'view/footer.php';
    }
    
    public function listarDocumentos(){
        require_once 'view/header.php';
        require_once 'view/facturacion/facturaelectronica.php';
    }

    public function RegistrarPedido()
    {
        $val = $this->model->ValidarEstadoPedido($_POST['cod_ped']);
        if ($val == 1){
            $this->model->RegistrarPedido($_POST);
            print_r(json_encode(1));
            //header('Location: inicio.php?Cod=','_blank')
        } else  {
            print_r(json_encode(2));
            //header('Location: inicio.php?Cod=f');
        }
    }

    public function Desocupar(){
        $alm = new Pedido();
        $alm->__SET('cod_pede',  $_REQUEST['cod_pede']);
        $alm->__SET('cod_tipe',  $_REQUEST['cod_tipe']);
        $this->model->Desocupar($alm);
        echo("<script>location.href = 'inicio.php';</script>");
        //header('Location: inicio.php');
    }


    public function FinalizarPedido(){
        $alm = new Pedido();
        $alm->__SET('codPed',  $_REQUEST['codPed']);
        $this->model->FinalizarPedido($alm);
        echo("<script>location.href = 'inicio.php';</script>");
        //header('Location: inicio.php');
    }

    public function DatosGrles(){
        print_r(json_encode($this->model->DatosGrles($_POST)));
    }
    
}