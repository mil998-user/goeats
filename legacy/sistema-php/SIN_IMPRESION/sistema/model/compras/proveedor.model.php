<?php
include_once("model/rest.model.php");

class ProveedorModel
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
            $stm = $this->conexionn->prepare("SELECT * FROM tm_proveedor");
            $stm->execute();            
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

    public function obtenerDatos($cod)
    {
        try 
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_proveedor WHERE id_prov = ?");
            $stm->execute(array($cod));
            $r = $stm->fetch(PDO::FETCH_OBJ);
            $alm = new Proveedor();
            $alm->__SET('id_prov', $r->id_prov);
            $alm->__SET('ruc', $r->ruc);
            $alm->__SET('razon_social', $r->razon_social);
            $alm->__SET('direccion', $r->direccion);
            $alm->__SET('telefono', $r->telefono);
            $alm->__SET('email', $r->email);
            $alm->__SET('contacto', $r->contacto);
            $alm->__SET('estado', $r->estado);
            $stm->closeCursor();
            return $alm;
            $this->conexionn=null;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function editar(Proveedor $data)
    {
        try 
        {   
            $consulta = "call usp_comprasRegProveedor( :flag, :ruc, :razS, :direc, :telf, :email, :contc, :idProv);";
            $arrayParam =  array(
                ':flag' => 2,
                ':ruc' => $data->__GET('ruc'),
                ':razS' => $data->__GET('razon_social'),
                ':direc' => $data->__GET('direccion'),
                ':telf' => $data->__GET('telefono'),
                ':email' => $data->__GET('email'),
                ':contc' => $data->__GET('contacto'),
                ':idProv' => $data->__GET('id_prov')
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function registrar(Proveedor $data)
    {
        try 
        {
            $consulta = "call usp_comprasRegProveedor( :flag, :ruc, :razS, :direc, :telf, :email, :contc, @a);";
            $telefono = 0;
            if($data->__GET('telefono') != '' and $data->__GET('telefono') != null){
               $telefono = $data->__GET('telefono'); 
            }
            $arrayParam =  array(
                ':flag' => 1,
                ':ruc' => $data->__GET('ruc'),
                ':razS' => $data->__GET('razon_social'),
                ':direc' => $data->__GET('direccion'),
                ':telf' => $data->__GET('telefono'),
                ':email' => $data->__GET('email'),
                ':contc' => $data->__GET('contacto')
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

    public function estado($data)
    {
        try 
        {
            $sql = "UPDATE tm_proveedor SET estado = ? WHERE id_prov = ?";
            $this->conexionn->prepare($sql)->execute(array($data->__GET('estado'),$data->__GET('cod_prov')));
            $this->conexionn=null;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }
}