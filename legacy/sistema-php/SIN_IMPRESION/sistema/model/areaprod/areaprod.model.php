<?php
include_once("model/rest.model.php");

class AreaProdModel
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

    public function ListarM()
    {
        try
        {   
            $id_areap = $_SESSION["id_areap"];
            $stm = $this->conexionn->prepare("SELECT * FROM v_cocina_me WHERE estado <> 'c' AND estado <> 'x' AND id_areap = ? AND cantidad > 0 ORDER BY fecha_pedido ASC");
            $stm->execute(array($id_areap));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Total'} = $this->conexionn->query("SELECT COUNT(id_pedido) AS nro_p FROM v_cocina_me WHERE estado <> 'c' AND estado <> 'x' AND cantidad > 0 AND id_areap = ".$id_areap)
                    ->fetch(PDO::FETCH_OBJ);

                $c[$k]->{'CProducto'} = $this->conexionn->query("SELECT desc_c FROM v_productos WHERE id_pres = ".$d->id_pres."")
                    ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarMO()
    {
        try
        {        
            $id_areap = $_SESSION["id_areap"];
            $stm = $this->conexionn->prepare("SELECT * FROM v_cocina_mo WHERE id_areap = ? ORDER BY fecha_pedido ASC");
            $stm->execute(array($id_areap));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Total'} = $this->conexionn->query("SELECT COUNT(id_pedido) AS nro_p FROM v_cocina_mo WHERE estado <> 'c' AND estado <> 'i' AND estado <> 'x' AND id_areap = ".$id_areap)
                    ->fetch(PDO::FETCH_OBJ);

                $c[$k]->{'CProducto'} = $this->conexionn->query("SELECT desc_c FROM v_productos WHERE id_pres = ".$d->id_pres."")
                    ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;         
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarDE()
    {
        try
        {        
            $id_areap = $_SESSION["id_areap"];
            $stm = $this->conexionn->prepare("SELECT * FROM v_cocina_de WHERE id_areap = ? ORDER BY fecha_pedido ASC");
            $stm->execute(array($id_areap));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Total'} = $this->conexionn->query("SELECT COUNT(id_pedido) AS nro_p FROM v_cocina_de WHERE estado <> 'c' AND estado <> 'i' AND estado <> 'x' AND id_areap = ".$id_areap)
                    ->fetch(PDO::FETCH_OBJ);

                $c[$k]->{'CProducto'} = $this->conexionn->query("SELECT desc_c FROM v_productos WHERE id_pres = ".$d->id_pres."")
                    ->fetch(PDO::FETCH_OBJ);
            }
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;         
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Preparacion($data)
    {
        try
        {   
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            $sql = "UPDATE tm_detalle_pedido SET estado = 'p', fecha_envio = ? WHERE id_pedido = ? AND id_pres = ? AND fecha_pedido = ?";
            $this->conexionn->prepare($sql)
              ->execute(array(
                $fecha,
                $data['cod_ped'],
                $data['cod_prod'],
                $data['fecha_p']
                ));
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Atendido($data)
    {
        try
        {   
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha = date("Y-m-d H:i:s");
            $sql = "UPDATE tm_detalle_pedido SET estado = 'c', fecha_envio = ? WHERE id_pedido = ? AND id_pres = ? AND fecha_pedido = ?";
            $this->conexionn->prepare($sql)
              ->execute(array(
                $fecha,
                $data['cod_ped'],
                $data['cod_prod'],
                $data['fecha_p']
                ));
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
}