<?php
require_once 'model/config/tm_usuario.entidad.php';
require_once 'model/config/tm_usuario.model.php';

class ConfigController{
    
    private $model;

    public function __CONSTRUCT(){
        $this->model = new ConfigModel();
    }
    
    public function Index(){
        require_once 'view/header.php';
        require_once 'view/config/sist/tm_usuario.php';
        require_once 'view/footer.php';
    }

    public function listar()
    {
        $this->model->listar($_POST);
    }

    public function obtenerDatos(){
        $alm = new Usuario();
        
        if(isset($_REQUEST['cod'])){
            $alm = $this->model->obtenerDatos($_REQUEST['cod']);
        }

        require_once 'view/header.php';
        require_once 'view/config/sist/tm_usuario_e.php';
        require_once 'view/footer.php';
    }

    public function crud(){

        $alm = new Usuario();
        $alm->__SET('id_usu',    $_REQUEST['id_usu']);
        $alm->__SET('id_tie',    $_REQUEST['id_tie']);
        $alm->__SET('id_rol',   $_REQUEST['id_rol']);
        $alm->__SET('id_areap',   $_REQUEST['id_areap']);
        $alm->__SET('dni',   $_REQUEST['dni']);
        $alm->__SET('ape_paterno',   $_REQUEST['ape_paterno']);
        $alm->__SET('ape_materno',  $_REQUEST['ape_materno']);
        $alm->__SET('nombres',    $_REQUEST['nombres']);
        $alm->__SET('email',    $_REQUEST['email']);
        $alm->__SET('usuario',    $_REQUEST['usuario']);
        $alm->__SET('contrasena',    $_REQUEST['contrasena']);
        $alm->__SET('estado',    $_REQUEST['estado']);
        $alm->__SET('imagen',    $_REQUEST['imagen']);
        

        if( !empty( $_FILES['imagen']['name'] ) ){
            $imagen = date('ymdhis') . '-' . strtolower($_FILES['imagen']['name']);
            move_uploaded_file ($_FILES['imagen']['tmp_name'], 'assets/img/usuarios/'.$imagen);          
            $alm->__SET('imagen', $imagen);
        }
        
        if($_REQUEST['id_usu'] != ''){
           $this->model->editar($alm);
           echo("<script>location.href = 'lista_tm_usuarios.php?m=u';</script>");
           //header('Location: lista_tm_usuarios.php?m=u');
        }
        else{
           $row = $this->model->registrar($alm);
           if ($row['cod'] == 0){
                echo("<script>location.href = 'lista_tm_usuarios.php?m=n';</script>");
                //header('Location: lista_tm_usuarios.php?m=n');
            } else {
                echo("<script>location.href = 'lista_tm_usuarios.php?m=d';</script>");
                //header('Location: lista_tm_usuarios.php?m=d');
            }
        }
    }

    public function estado(){
        $alm = new Usuario();
        if ($_REQUEST['estado']=='a' || $_REQUEST['estado']=='i'){
            $alm->__SET('cod_usu',  $_REQUEST['cod_usu']);
            $alm->__SET('estado',     $_REQUEST['estado']);
            $this->model->estado($alm);
            echo("<script>location.href = 'lista_tm_usuarios.php';</script>");
            //header('Location: lista_tm_usuarios.php');
        }else{
            echo("<script>location.href = 'lista_tm_usuarios.php';</script>");
            //header('Location: lista_tm_usuarios.php');
        }
    }

    public function eliminar(){
        $this->model->eliminar($_REQUEST['cod_usu_e']);
    }
}
?> 