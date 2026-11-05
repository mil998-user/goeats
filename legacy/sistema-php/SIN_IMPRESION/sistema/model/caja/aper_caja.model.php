<?php
include_once("model/rest.model.php");

class CajaModel
{
    
    private $conexionn;

    public function __CONSTRUCT()
    {
        try
        {
            $this->conexionn = Database::Conectar();     
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function listar()
    {
        try
        {
            if($_SESSION["rol_usr"] == 1){
                $stm = $this->conexionn->prepare("SELECT * FROM v_caja_aper WHERE estado <> 'c'");
                $stm->execute();
            } else {
                $stm = $this->conexionn->prepare("SELECT * FROM v_caja_aper WHERE id_usu = ? AND estado <> 'c'");
                $stm->execute(array($_SESSION["id_usu"]));
            }
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json; 
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Tienda()
    {
        try
        {    
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tienda WHERE estado = 'a'");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Cajero()
    {
        try
        {    
            $stm = $this->conexionn->prepare("SELECT id_usu,ape_paterno,ape_materno,nombres FROM tm_usuario WHERE (id_rol = 1 OR id_rol = 2) AND estado = 'a'");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Caja()
    {
        try
        {    
            $stm = $this->conexionn->prepare("SELECT * FROM tm_caja WHERE estado = 'a'");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Turno()
    {
        try
        {    
            $stm = $this->conexionn->prepare("SELECT * FROM tm_turno");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function comboUsuario($data)
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT id_usu,CONCAT(ape_paterno,' ',ape_materno,' ',nombres) AS nombres FROM tm_usuario WHERE (id_rol = 1 OR id_rol = 2) AND estado = 'a' AND id_tie = ?");
            $stm->execute(array($data['id_tie']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function montoSistema($data)
    {
        try
        {
            $fecha_ape = date('Y-m-d H:i:s',strtotime($data['fecha_ape']));
            $fecha_cie = date('Y-m-d H:i:s',strtotime($data['fecha_cie']));

            $stm = $this->conexionn->prepare("SELECT IFNULL(SUM(pago_efe),0) AS pago_efe, IFNULL(SUM(pago_tar),0) AS pago_tar, IFNULL(SUM(descu),0) AS descu, IFNULL(SUM(total-descu),0) AS total FROM v_ventas_con WHERE (fec_ven >= ? AND fec_ven <= ?) AND id_apc = ? AND estado <> 'i'");
            $stm->execute(array($fecha_ape,$fecha_cie,$data['id_apc']));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            $c->{'Apertura'} = $this->conexionn->query("SELECT * FROM v_caja_aper WHERE id_apc = ".$data['id_apc'])
            ->fetch(PDO::FETCH_OBJ);
            $c->{'Ingresos'} = $this->conexionn->query("SELECT IFNULL(SUM(importe),0) AS total FROM tm_ingresos_adm WHERE (fecha_reg >= '{$fecha_ape}' AND fecha_reg <= '{$fecha_cie}') AND id_apc = {$data['id_apc']} AND estado='a'")
            ->fetch(PDO::FETCH_OBJ);
            $c->{'EgresosA'} = $this->conexionn->query("SELECT IFNULL(SUM(importe),0) AS total FROM v_gastosadm WHERE (fecha_re >= '{$fecha_ape}' AND fecha_re <= '{$fecha_cie}') AND id_apc = {$data['id_apc']} AND (id_tg = 1 OR id_tg = 2 OR id_tg = 3) AND estado='a'")
            ->fetch(PDO::FETCH_OBJ);
            $c->{'EgresosB'} = $this->conexionn->query("SELECT IFNULL(SUM(importe),0) AS total FROM v_gastosadm WHERE (fecha_re >= '{$fecha_ape}' AND fecha_re <= '{$fecha_cie}') AND id_apc = {$data['id_apc']} AND id_tg = 4 AND estado='a'")
            ->fetch(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function aperturar(Caja $data)
    {
        try
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            if($_SESSION["rol_usr"] == 1){
                $id_tie = $data->__GET('id_tie');
                $id_usu = $data->__GET('id_usu');
            } elseif ($_SESSION["rol_usr"] == 2){
                $id_tie = $_SESSION["id_tie"];
                $id_usu = $_SESSION["id_usu"];
            }
            $consulta = "call usp_cajaAperturar( :flag, :idTie, :idUsu, :idCaja, :idTurno, :fechaA, :montoA);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idTie' => $id_tie,
                ':idUsu' => $id_usu,
                ':idCaja' => $data->__GET('id_caja'),
                ':idTurno' => $data->__GET('id_turno'),
                ':fechaA' =>  $fecha,
                ':montoA' => $data->__GET('monto_aper')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function cerrar(Caja $data)
    {
        try
        {
            $consulta = "call usp_cajaCerrar( :flag, :idApc, :fechaC, :montoC, :montoS);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idApc' => $data->__GET('cod_apc'),
                ':fechaC' => $data->__GET('fecha_cierre'),
                ':montoC' => $data->__GET('monto_cierre'),
                ':montoS' => $data->__GET('monto_sistema')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function detalle($data)
    {
        try
        {    
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha_ape = date('Y-m-d H:i:s',strtotime($data['fecha_a']));
            $fecha_cie = date("Y-m-d H:i:s");
            $stm = $this->conexionn->prepare("SELECT IFNULL(SUM(pago_efe),0) AS pago_efe, IFNULL(SUM(pago_tar),0) AS pago_tar, IFNULL(SUM(descu),0) AS descu, IFNULL(SUM(total-descu),0) AS total FROM v_ventas_con WHERE (fec_ven >= ? AND fec_ven <= ?) AND id_apc = ? AND estado <> 'i' AND id_tpag <> 4");
            $stm->execute(array($fecha_ape,$fecha_cie,$data['id_apc']));
            $c = $stm->fetch(PDO::FETCH_OBJ);
            $c->{'Apertura'} = $this->conexionn->query("SELECT * FROM v_caja_aper WHERE id_apc = ".$data['id_apc'])
            ->fetch(PDO::FETCH_OBJ);
            $c->{'Ingresos'} = $this->conexionn->query("SELECT IFNULL(SUM(importe),0) AS total FROM tm_ingresos_adm WHERE (fecha_reg >= '{$fecha_ape}' AND fecha_reg <= '{$fecha_cie}') AND id_apc = {$data['id_apc']} AND estado='a'")
            ->fetch(PDO::FETCH_OBJ);
            $c->{'EgresosA'} = $this->conexionn->query("SELECT IFNULL(SUM(importe),0) AS total FROM v_gastosadm WHERE (fecha_re >= '{$fecha_ape}' AND fecha_re <= '{$fecha_cie}') AND id_apc = {$data['id_apc']} AND (id_tg = 1 OR id_tg = 2 OR id_tg = 3) AND estado='a'")
            ->fetch(PDO::FETCH_OBJ);
            $c->{'EgresosB'} = $this->conexionn->query("SELECT IFNULL(SUM(importe),0) AS total FROM v_gastosadm WHERE (fecha_re >= '{$fecha_ape}' AND fecha_re <= '{$fecha_cie}') AND id_apc = {$data['id_apc']} AND id_tg = 4 AND estado='a'")
            ->fetch(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

}