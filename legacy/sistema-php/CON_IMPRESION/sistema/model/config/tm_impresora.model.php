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

    public function listar($data)
    {
        try
        {
           
            $stm = $this->conexionn->prepare("SELECT * FROM tm_impresora WHERE id_imp <> 1 AND id_imp LIKE ?");
            $stm->execute(array($data['codigo']));
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

    public function registrar($data)
    {
        try
        {
            $consulta = "call usp_configImpresoras( :flag, :nombre, :estado, @a);";
            $arrayParam =  array(
                ':flag' => 1,
                ':nombre' => $data['nomb_imp'],
                ':estado' => $data['estado_imp']
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

    public function actualizar($data)
    {
        try 
        {
            $consulta = "call usp_configImpresoras( :flag, :nombre, :estado, :idImp);";
            $arrayParam =  array(
                ':flag' => 2,
                ':nombre' => $data['nomb_imp'],
                ':estado' => $data['estado_imp'],
                ':idImp' => $data['cod_imp'],
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