<?php
require_once 'model/caja/aper_caja.entidad.php';
require_once 'model/caja/aper_caja.model.php';

class CajaController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new CajaModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/caja/aper_caja.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function detalle()
    {
        print_r(json_encode($this->model->detalle($_POST)));
    }

    public function crud(){
        $alm = new Caja();
        $alm->__SET('cod_apc', $_REQUEST['cod_apc']);
        $alm->__SET('id_tie', $_REQUEST['id_tie']);
        $alm->__SET('id_usu', $_REQUEST['id_usu']);
        $alm->__SET('id_caja', $_REQUEST['id_caja']);
        $alm->__SET('id_turno', $_REQUEST['id_turno']);
        $alm->__SET('monto_aper', $_REQUEST['monto_aper']);
        $alm->__SET('monto_cierre', $_REQUEST['monto_cierre']);
        $alm->__SET('monto_sistema', $_REQUEST['monto_sistema']);
        $alm->__SET('fecha_cierre', date('Y-m-d H:i:s',strtotime($_REQUEST['fecha_cierre'])));
        if($alm->__GET('cod_apc') != ''){
           $row = $this->model->cerrar($alm);
           if ($row['dup'] == 1){
                if($row['per'] == $_SESSION['id_usu']) {
                    $_SESSION["apertura"] = 0;
                }
                //header('Location: lista_caja_aper.php?m=c');
                echo("<script>location.href = 'lista_caja_aper.php?m=c';</script>");
           } else {
                //header('Location: lista_caja_aper.php?m=d');
                echo("<script>location.href = 'lista_caja_aper.php?m=d';</script>");
           }
        }else{
           $row = $this->model->aperturar($alm);
           if ($row['dup'] == 0){

                //SI ROL ES 1 ES PORQUE EL USUARIO LOGEADO ES ADMINISTRADOR
                if($_SESSION["rol_usr"] == 1){

                    //SI APERTURA ES 1 ES PORQUE EL USUARIO LOGEADO ESTA APERTURADO
                    if($_SESSION["apertura"] == 1){

                        //SI ES DIFERENTE AL ADMINISTRADOR
                        if($_SESSION['id_usu'] <> $_REQUEST['id_usu']) {
                            $_SESSION["apertura"] = 1;
                        }

                    //SI APERTURA NO ES 1 ES PORQUE EL USUARIO LOGEADO NO ESTA APERTURADO
                    } else if($_SESSION["apertura"] == 0){

                        //SI ES IGUAL AL ADMINISTRADOR
                        if($_SESSION['id_usu'] == $_REQUEST['id_usu']) {

                            //REGISTRA APERTURA PARA ACTIVAR LAS VENTAS/CAJA
                            $_SESSION["apertura"] = 1;
                            //REGISTRA EL NUEVO ID DE APERTURA
                            $_SESSION['id_apc'] = $row['cod'];

                        } 

                    }

                //SI ROL NO ES 1 ES PORQUE EL USUARIO LOGEADO ES CAJERO
                } else if($_SESSION["rol_usr"] == 2){

                    //REGISTRA APERTURA PARA ACTIVAR LAS VENTAS/CAJA
                    $_SESSION["apertura"] = 1;
                    //REGISTRA EL NUEVO ID DE APERTURA
                    $_SESSION['id_apc'] = $row['cod'];

                }
                echo("<script>location.href = 'lista_caja_aper.php?m=n';</script>");
                //header('Location: lista_caja_aper.php?m=n');
           } else {
                echo("<script>location.href = 'lista_caja_aper.php?m=d';</script>");
                //header('Location: lista_caja_aper.php?m=d');
           }
        }
    }

    public function comboUsuario()
    {
        print_r(json_encode($this->model->comboUsuario($_POST)));
    }

    public function montoSistema()
    {
        print_r(json_encode($this->model->montoSistema($_POST)));
    }

}
?> 