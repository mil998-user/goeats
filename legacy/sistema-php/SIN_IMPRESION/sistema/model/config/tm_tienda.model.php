<?php
include_once("model/rest.model.php");

class ConfigModel
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

    public function ListaTiendas($data)
    {
        try
        {
           
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tienda WHERE id_tie like ?");
            $stm->execute(array($data['cod']));
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

    public function CTienda($data)
    {
        try
        {
            $consulta = "call usp_configTiendas( :flag, :nomb, :direc, :telef, :est, @a);";
            $arrayParam =  array(
                ':flag' => 1,
                ':nomb' => $data['nomb'],
                ':direc' => $data['direc'],
                ':telef' => $data['telef'],
                ':est' => $data['est']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function UTienda($data)
    {
        try 
        {
            $consulta = "call usp_configTiendas( :flag, :nomb, :direc, :telef, :est, :idTie);";
            $arrayParam =  array(
                ':flag' => 2,
                ':nomb' => $data['nomb'],
                ':direc' => $data['direc'],
                ':telef' => $data['telef'],
                ':est' => $data['est'],
                ':idTie' => $data['codTie']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }
}