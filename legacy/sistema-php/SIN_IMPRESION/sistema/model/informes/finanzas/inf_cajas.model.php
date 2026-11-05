<?php
include_once("model/rest.model.php");

class InformeModel
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
            $ifecha = date('Y-m-d',strtotime($_POST['ifecha']));
            $ffecha = date('Y-m-d',strtotime($_POST['ffecha']));
            $stm = $this->conexionn->prepare("SELECT * FROM v_caja_aper WHERE DATE(fecha_a) >= ? AND DATE(fecha_a) <= ?");
            $stm->execute(array($ifecha,$ffecha));
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